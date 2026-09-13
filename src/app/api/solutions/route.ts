import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { requireRole } from "@/lib/rbac";
import { SolutionSchema } from "@/lib/validators";
import { transitionChallengeStatus } from "@/lib/lifecycle";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    const isAdmin = session?.role === "ADMIN";
    const currentUserId = session?.userId;

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");
    const authorId = searchParams.get("authorId");

    const where: Record<string, unknown> = {};
    if (challengeId) where.challengeId = challengeId;
    if (authorId) where.authorId = authorId;

    // Phase 5: Draft solutions must only be visible to author or ADMIN
    if (!isAdmin) {
      if (currentUserId) {
        where.OR = [
          { status: { not: "DRAFT" } },
          { authorId: currentUserId },
        ];
      } else {
        where.status = { not: "DRAFT" };
      }
    }

    const solutions = await db.solution.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, organization: true, role: true, karmaPoints: true, avatar: true },
        },
        challenge: {
          select: { id: true, title: true, district: true, severity: true, category: true },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      solutions: solutions.map((s) => ({
        ...s,
        techStack: s.techStack ? JSON.parse(s.techStack) : [],
        mediaUrls: s.mediaUrls ? JSON.parse(s.mediaUrls) : [],
      })),
    });
  } catch (error: unknown) {
    console.error("Fetch Solutions Error:", error);
    return NextResponse.json({ error: "Failed to fetch solutions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request);

    // ── Security: Only SOLVER or ADMIN can submit solutions ──────────────
    // Removed the previous unsafe fallback to the first SOLVER in the DB.
    const deny = requireRole(session, "SOLVER", "ADMIN");
    if (deny) return deny;

    const authorId = session!.userId;

    const body = await request.json();
    const result = SolutionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // ── Challenge Lifecycle Validation ──────────────────────────────────────
    const challenge = await db.challenge.findUnique({
      where: { id: data.challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Only allow submitting active solutions if challenge is in an active lifecycle state
    // (e.g. ASSIGNED, VERIFIED, or already IN_PROGRESS).
    // If challenge is SUBMITTED, REJECTED, MERGED, SOLVED, or CLOSED, reject with 409 Conflict.
    if (challenge.status !== "IN_PROGRESS") {
      const transitionCheck = await transitionChallengeStatus({
        challengeId: data.challengeId,
        toStatus: "IN_PROGRESS",
        actor: {
          userId: authorId,
          name: session!.name,
          role: session!.role,
        },
        notes: `Solution proposal '${data.title}' submitted by solver.`,
      });

      if (!transitionCheck.success) {
        return NextResponse.json(
          {
            error: transitionCheck.error || "Invalid challenge lifecycle transition for solution submission.",
            code: transitionCheck.code || "INVALID_LIFECYCLE_TRANSITION",
          },
          { status: transitionCheck.statusHttp || 409 }
        );
      }
    }

    const solution = await db.solution.create({
      data: {
        challengeId: data.challengeId,
        authorId,
        teamName: data.teamName || "Innovation Taskforce",
        title: data.title,
        abstract: data.abstract,
        methodology: data.methodology,
        techStack: data.techStack ? JSON.stringify(data.techStack) : null,
        budgetEstimate: data.budgetEstimate,
        timelineMonths: data.timelineMonths || 3,
        prototypeUrl: data.prototypeUrl,
        mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
        status: "PROPOSED",
        milestoneStage: "Phase 1: Conceptualization & Planning",
      },
    });

    // Create default milestones if provided or generate standard 3-phase gates
    const milestonesToCreate =
      data.milestones && data.milestones.length > 0
        ? data.milestones
        : [
            { order: 1, title: "Architecture & Simulation Benchmark", description: "Design specifications, mathematical models, and baseline data verification." },
            { order: 2, title: "Hardware / IoT Prototype Assembly", description: "Bench testing of sensor modules, firmware, and local telemetry field unit." },
            { order: 3, title: "District On-Ground Pilot & Calibration", description: "Field trial under supervision of District Disaster Management Cell." },
          ];

    for (const m of milestonesToCreate) {
      await db.milestone.create({
        data: {
          solutionId: solution.id,
          order: m.order,
          title: m.title,
          description: m.description,
          status: "PENDING",
        },
      });
    }

    // Award karma to author
    await db.user.update({
      where: { id: authorId },
      data: { karmaPoints: { increment: 50 } },
    });

    const authorUser = await db.user.findUnique({ where: { id: authorId } });
    await db.auditLog.create({
      data: {
        action: "SOLUTION_PROPOSAL_SUBMITTED",
        entityType: "Solution",
        entityId: solution.id,
        actorId: authorId,
        actorName: authorUser?.name || "Researcher",
        details: JSON.stringify({ title: solution.title, teamName: solution.teamName }),
      },
    });

    return NextResponse.json({ success: true, solution });
  } catch (error: unknown) {
    console.error("Create Solution Error:", error);
    return NextResponse.json({ error: "Failed to create solution proposal" }, { status: 500 });
  }
}
