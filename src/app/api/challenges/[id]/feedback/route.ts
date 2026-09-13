import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { CitizenFeedbackSchema } from "@/lib/validators";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { safeLog } from "@/lib/safe-logger";
import { isValidChallengeTransition } from "@/lib/lifecycle";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUserFromRequest(request);
    const clientIp = getClientIp(request);
    const identifier = session ? `user:${session.userId}` : `ip:${clientIp}`;

    const rl = checkRateLimit(identifier, RATE_LIMIT_BUCKETS.INTERACTION);
    if (!rl.success) {
      return createRateLimitResponse(rl.reset, "Feedback submission limit reached. Please wait.");
    }

    let userId = session?.userId;
    if (!userId) {
      const isDemo = process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
      if (!isDemo) {
        return NextResponse.json(
          { error: "Authentication required to submit resolution feedback.", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }
      const defaultCitizen = await db.user.findFirst({ where: { role: "CITIZEN" } });
      userId = defaultCitizen?.id || "anonymous-citizen";
    }

    const body = await request.json();
    const result = CitizenFeedbackSchema.safeParse({
      ...body,
      challengeId: params.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { challengeId, feedback, notes, satisfactionRating } = result.data;

    const challenge = await db.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // ── Ownership Authorization Check (Defense in Depth) ───────────────────
    const isCreator = Boolean(userId && userId === challenge.createdById);
    const isAdmin = Boolean(session?.role === "ADMIN");

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        {
          error: "Forbidden: Only the citizen who reported this challenge or an authorized Government Administrator can submit resolution verification feedback.",
          code: "OWNERSHIP_REQUIRED",
          challengeOwnerId: challenge.createdById,
        },
        { status: 403 }
      );
    }

    let newStatus = challenge.status;
    let newSlaStatus = challenge.slaStatus;
    let impactScore = challenge.impactScore || 80;

    // Government verification state machine handling
    if (feedback === "SOLVED") {
      // Citizen marks on-ground resolution verified.
      // If already in implementation/deployed, transitions to FIELD_VERIFIED / SOLVED.
      if (["DEPLOYED", "PILOT_DEPLOYED", "IN_PROGRESS", "ASSIGNED", "VERIFIED"].includes(challenge.status)) {
        newStatus = "FIELD_VERIFIED";
      }
      newSlaStatus = "RESOLVED";
      impactScore = Math.min(98, (satisfactionRating || 5) * 20);
    } else if (feedback === "NOT_SOLVED") {
      // Citizen indicates civic work failed or is incomplete - escalate for administrative intervention!
      newStatus = "ESCALATED";
      newSlaStatus = "ESCALATED";
      impactScore = Math.max(20, impactScore - 30);
    } else {
      // PARTIALLY_SOLVED - keep in progress with notes
      if (challenge.status === "FIELD_VERIFIED" || challenge.status === "SOLVED") {
        newStatus = "IN_PROGRESS";
      }
    if (newStatus !== challenge.status && !isValidChallengeTransition(challenge.status, newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid lifecycle transition: Cannot transition challenge from '${challenge.status}' to '${newStatus}'.`,
          code: "INVALID_LIFECYCLE_TRANSITION",
        },
        { status: 409 }
      );
    }

    const updatedChallenge = await db.challenge.update({
      where: { id: challengeId },
      data: {
        citizenFeedback: feedback,
        citizenFeedbackNotes: notes || null,
        status: newStatus,
        slaStatus: newSlaStatus,
        impactScore,
      },
    });

    // Record Audit Log
    const user = await db.user.findUnique({ where: { id: userId } });
    await db.auditLog.create({
      data: {
        action: feedback === "NOT_SOLVED" ? "CITIZEN_REOPEN_ESCALATION" : "CITIZEN_RESOLUTION_FEEDBACK",
        entityType: "Challenge",
        entityId: challengeId,
        actorId: userId,
        actorName: user?.name || "Verified Citizen",
        details: JSON.stringify({
          feedback,
          notes,
          satisfactionRating,
          previousStatus: challenge.status,
          newStatus,
        }),
      },
    });

    // If citizen verified problem solved, award karma to solvers and citizens
    if (feedback === "SOLVED") {
      await db.user.update({
        where: { id: challenge.createdById },
        data: { karmaPoints: { increment: 50 } },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        feedback === "NOT_SOLVED"
          ? "Feedback recorded. Due to citizen report of incomplete resolution, the challenge has been escalated and reopened for administrative review."
          : "Citizen feedback recorded successfully. Thank you for verifying civic resolution on the ground!",
      challenge: updatedChallenge,
    });
  } catch (error: unknown) {
    safeLog.error("Citizen Feedback Error:", error);
    return NextResponse.json({ error: "Failed to submit citizen feedback" }, { status: 500 });
  }
}
