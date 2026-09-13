import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { CSRPledgeSchema } from "@/lib/validators";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { safeLog } from "@/lib/safe-logger";

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    const clientIp = getClientIp(request);
    const identifier = session ? `user:${session.userId}` : `ip:${clientIp}`;

    // ── 1. Rate Limiting Check ──────────────────────────────────────────────
    const rl = checkRateLimit(identifier, RATE_LIMIT_BUCKETS.INTERACTION);
    if (!rl.success) {
      return createRateLimitResponse(rl.reset, "CSR pledge request limit reached. Please wait.");
    }

    // ── 2. Authenticate & Role Gate ─────────────────────────────────────────
    let userId = session?.userId;
    if (!userId) {
      const isDemo = process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
      if (!isDemo) {
        return NextResponse.json(
          { error: "Authentication required to pledge CSR grants.", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }
      const defaultIndustry = await db.user.findFirst({ where: { role: "INDUSTRY" } });
      userId = defaultIndustry?.id || "demo-industry-partner";
    } else if (session && session.role !== "INDUSTRY" && session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Industry CSR Partners or Government Authorities can submit grant pledges.", code: "INSUFFICIENT_PRIVILEGES" },
        { status: 403 }
      );
    }

    // ── 3. Validate Input ───────────────────────────────────────────────────
    const body = await request.json();
    const result = CSRPledgeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { challengeId, solutionId, funderName, amountPledged, notes } = result.data;

    // ── 4. Verify Target Challenge ──────────────────────────────────────────
    const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    let targetSolution = null;
    if (solutionId) {
      targetSolution = await db.solution.findUnique({ where: { id: solutionId } });
    } else {
      // Find top solution for this challenge
      targetSolution = await db.solution.findFirst({ where: { challengeId } });
    }

    if (targetSolution) {
      await db.solution.update({
        where: { id: targetSolution.id },
        data: {
          csrFundingStatus: "PLEDGED",
          csrFunderName: funderName,
          csrAmountPledged: amountPledged,
        },
      });
    }

    // Record Audit Log
    const effectiveUserId = userId || "demo-industry-funder";
    const user = await db.user.findUnique({ where: { id: effectiveUserId } });
    await db.auditLog.create({
      data: {
        action: "CSR_FUNDING_PLEDGED",
        entityType: "Challenge",
        entityId: challengeId,
        actorId: effectiveUserId,
        actorName: funderName || user?.name || "CSR Partner",
        details: JSON.stringify({
          funderName,
          amountPledged,
          solutionId: targetSolution?.id,
          notes,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `CSR Grant Pledge of ₹${(amountPledged / 100000).toFixed(1)} Lakhs by ${funderName} successfully committed for Challenge implementation.`,
      solution: targetSolution,
    });
  } catch (error: unknown) {
    safeLog.error("CSR Pledge Error:", error);
    return NextResponse.json({ error: "Failed to process CSR pledge" }, { status: 500 });
  }
}
