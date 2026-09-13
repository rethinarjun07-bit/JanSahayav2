import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isValidSolutionTransition } from "@/lib/lifecycle";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const solution = await db.solution.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, organization: true, designation: true, role: true, karmaPoints: true, avatar: true },
        },
        challenge: {
          include: {
            createdBy: { select: { id: true, name: true, district: true } },
          },
        },
        milestones: {
          orderBy: { order: "asc" },
        },
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, role: true, organization: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true, organization: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { upvotes: true, comments: true },
        },
      },
    });

    if (!solution) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    // Phase 5: Draft solutions must only be visible to author or ADMIN
    // Return 404 to avoid leaking existence of private draft
    const session = await getUserFromRequest(request);
    const isAuthor = session?.userId === solution.authorId;
    const isAdmin = session?.role === "ADMIN";

    if (solution.status === "DRAFT" && !isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...solution,
      techStack: solution.techStack ? JSON.parse(solution.techStack) : [],
      mediaUrls: solution.mediaUrls ? JSON.parse(solution.mediaUrls) : [],
    });
  } catch (error: unknown) {
    console.error("Fetch Single Solution Error:", error);
    return NextResponse.json({ error: "Failed to fetch solution" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getUserFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const existingSolution = await db.solution.findUnique({
      where: { id },
    });

    if (!existingSolution) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    const isAuthor = session.userId === existingSolution.authorId;
    const isAdmin = session.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to modify this solution proposal.", code: "INSUFFICIENT_PRIVILEGES" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // If updating a milestone status
    if (body.milestoneId && body.milestoneStatus) {
      const milestone = await db.milestone.findFirst({
        where: { id: body.milestoneId, solutionId: id },
      });
      if (milestone) {
        await db.milestone.update({
          where: { id: body.milestoneId },
          data: {
            status: body.milestoneStatus,
            notes: body.notes,
            proofUrl: body.proofUrl,
            updatedAt: new Date(),
          },
        });
      }
    }

    // Only Government Admins can set govtEndorsed
    const govtEndorsed = isAdmin && typeof body.govtEndorsed === "boolean" ? body.govtEndorsed : existingSolution.govtEndorsed;
    const endorsedBy = isAdmin && body.endorsedBy ? body.endorsedBy : existingSolution.endorsedBy;

    // Validate solution lifecycle transition and role authority
    let newStatus = existingSolution.status;
    if (body.status && body.status !== existingSolution.status) {
      const transitionCheck = isValidSolutionTransition(existingSolution.status, body.status, session.role);
      if (!transitionCheck.valid) {
        return NextResponse.json(
          {
            error: transitionCheck.error || `Invalid solution transition from '${existingSolution.status}' to '${body.status}'.`,
            code: "INVALID_SOLUTION_TRANSITION",
          },
          { status: transitionCheck.error?.includes("Forbidden") ? 403 : 409 }
        );
      }
      newStatus = body.status;
    }

    const updated = await db.solution.update({
      where: { id },
      data: {
        status: newStatus,
        milestoneStage: body.milestoneStage || existingSolution.milestoneStage,
        govtEndorsed,
        endorsedBy,
        endorsedAt: govtEndorsed ? new Date() : existingSolution.endorsedAt,
      },
      include: { milestones: true },
    });

    await db.auditLog.create({
      data: {
        action: "SOLUTION_PROGRESS_UPDATED",
        entityType: "Solution",
        entityId: id,
        actorId: session.userId,
        actorName: session.name,
        details: JSON.stringify({
          status: updated.status,
          milestoneStage: updated.milestoneStage,
          govtEndorsed: updated.govtEndorsed,
        }),
      },
    });

    return NextResponse.json({ success: true, solution: updated });
  } catch (error: unknown) {
    console.error("Update Solution Error:", error);
    return NextResponse.json({ error: "Failed to update solution" }, { status: 500 });
  }
}
