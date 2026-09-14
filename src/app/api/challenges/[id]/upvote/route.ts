import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { safeLog } from "@/lib/safe-logger";
import { isDemoModeEnabled } from "@/lib/rbac";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: challengeId } = params;
    const session = await getUserFromRequest(request);
    const clientIp = getClientIp(request);
    const identifier = session ? `user:${session.userId}` : `ip:${clientIp}`;

    // ── 1. Rate Limiting Check ──────────────────────────────────────────────
    const rl = checkRateLimit(identifier, RATE_LIMIT_BUCKETS.INTERACTION);
    if (!rl.success) {
      return createRateLimitResponse(rl.reset, "Upvote action limit reached. Please wait.");
    }

    // ── 2. Authenticate or Demo Fallback ───────────────────────────────────
    let userId = session?.userId;
    if (!userId) {
      if (!isDemoModeEnabled()) {
        return NextResponse.json(
          { error: "Authentication required to upvote.", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }
      const demoUser = await db.user.findFirst({ where: { role: "CITIZEN" } });
      if (!demoUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = demoUser.id;
    }

    // ── 3. Verify Challenge Exists ──────────────────────────────────────────
    const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const existing = await db.upvote.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId,
        },
      },
    });

    if (existing) {
      // Remove upvote (toggle off)
      await db.upvote.delete({
        where: { id: existing.id },
      });
      const count = await db.upvote.count({ where: { challengeId } });
      return NextResponse.json({ upvoted: false, count });
    } else {
      // Add upvote
      await db.upvote.create({
        data: {
          userId,
          challengeId,
        },
      });

      // Award karma to creator
      await db.user.update({
        where: { id: challenge.createdById },
        data: { karmaPoints: { increment: 5 } },
      }).catch(() => {});

      const count = await db.upvote.count({ where: { challengeId } });
      return NextResponse.json({ upvoted: true, count });
    }
  } catch (error: unknown) {
    safeLog.error("Upvote Error:", error);
    return NextResponse.json({ error: "Failed to process upvote" }, { status: 500 });
  }
}
