import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { isValidChallengeTransition } from "@/lib/lifecycle";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Increment view count
    await db.challenge.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    const challenge = await db.challenge.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true, organization: true, district: true, state: true, karmaPoints: true },
        },
        solutions: {
          include: {
            author: {
              select: { id: true, name: true, organization: true, role: true, karmaPoints: true, avatar: true },
            },
            milestones: {
              orderBy: { order: "asc" },
            },
            reviews: {
              include: {
                reviewer: { select: { id: true, name: true, role: true, organization: true } },
              },
            },
            _count: {
              select: { upvotes: true, comments: true },
            },
          },
        },
        duplicates: {
          select: { id: true, title: true, district: true, createdAt: true, status: true },
        },
        masterChallenge: {
          select: { id: true, title: true, district: true, status: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true, organization: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        upvotes: {
          select: { userId: true },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const now = new Date().getTime();
    const deadlineTime = challenge.slaDeadline
      ? new Date(challenge.slaDeadline).getTime()
      : new Date(challenge.createdAt).getTime() + 14 * 24 * 3600 * 1000;
    const diffHours = Math.round((deadlineTime - now) / (1000 * 60 * 60));

    let liveSlaStatus = challenge.slaStatus || "ON_TRACK";
    if (challenge.status === "SOLVED" || challenge.status === "MERGED") {
      liveSlaStatus = "RESOLVED";
    } else if (diffHours < -24) {
      liveSlaStatus = "ESCALATED";
    } else if (diffHours < 0) {
      liveSlaStatus = "BREACHED";
    } else if (diffHours <= 24) {
      liveSlaStatus = "APPROACHING";
    }

    return NextResponse.json({
      ...challenge,
      slaStatus: liveSlaStatus,
      slaRemainingHours: diffHours,
      slaBreached: diffHours < 0,
      aiTags: challenge.aiTags ? JSON.parse(challenge.aiTags) : [],
      mediaUrls: challenge.mediaUrls ? JSON.parse(challenge.mediaUrls) : [],
      sdgGoals: challenge.sdgGoals ? JSON.parse(challenge.sdgGoals) : [],
    });
  } catch (error: unknown) {
    console.error("Fetch Single Challenge Error:", error);
    return NextResponse.json({ error: "Failed to fetch challenge" }, { status: 500 });
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

    const existingChallenge = await db.challenge.findUnique({ where: { id } });
    if (!existingChallenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const isAdmin = session.role === "ADMIN";
    const isCreator = session.userId === existingChallenge.createdById;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this challenge.", code: "INSUFFICIENT_PRIVILEGES" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Citizens can only edit title/description while still in SUBMITTED state
    if (!isAdmin && isCreator) {
      if (existingChallenge.status !== "SUBMITTED") {
        return NextResponse.json(
          { error: "Cannot edit challenge once it has entered official government review.", code: "LIFECYCLE_LOCKED" },
          { status: 400 }
        );
      }
      const updated = await db.challenge.update({
        where: { id },
        data: {
          title: body.title || existingChallenge.title,
          description: body.description || existingChallenge.description,
        },
      });
      return NextResponse.json({ success: true, challenge: updated });
    }

    // Admin updates (Government Authority)
    if (body.status && body.status !== existingChallenge.status) {
      if (!isValidChallengeTransition(existingChallenge.status, body.status)) {
        return NextResponse.json(
          {
            error: `Invalid lifecycle transition: Cannot transition challenge from '${existingChallenge.status}' to '${body.status}'.`,
            code: "INVALID_LIFECYCLE_TRANSITION",
            currentStatus: existingChallenge.status,
            attemptedStatus: body.status,
          },
          { status: 400 }
        );
      }
    }

    const updated = await db.challenge.update({
      where: { id },
      data: {
        status: body.status || existingChallenge.status,
        officialNotes: body.officialNotes ?? existingChallenge.officialNotes,
        severity: body.severity || existingChallenge.severity,
        assignedUniversityId: body.assignedUniversityId ?? existingChallenge.assignedUniversityId,
        assignedDepartment: body.assignedDepartment ?? existingChallenge.assignedDepartment,
        verifiedAt: body.status === "VERIFIED" ? (existingChallenge.verifiedAt || new Date()) : existingChallenge.verifiedAt,
        verifiedById: body.status === "VERIFIED" ? session.userId : existingChallenge.verifiedById,
      },
    });

    await db.auditLog.create({
      data: {
        action: `CHALLENGE_${body.status || "UPDATED"}`,
        entityType: "Challenge",
        entityId: id,
        actorId: session.userId,
        actorName: session.name,
        details: JSON.stringify({
          status: updated.status,
          notes: body.officialNotes,
          severity: updated.severity,
        }),
      },
    });

    return NextResponse.json({ success: true, challenge: updated });
  } catch (error: unknown) {
    console.error("Update Challenge Error:", error);
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 });
  }
}
