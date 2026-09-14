import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { CommentCreateSchema } from "@/lib/validators";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { safeLog } from "@/lib/safe-logger";
import { isDemoModeEnabled } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: challengeId } = params;
    const comments = await db.comment.findMany({
      where: { challengeId },
      include: {
        user: { select: { id: true, name: true, role: true, organization: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ comments });
  } catch (error: unknown) {
    safeLog.error("Fetch Comments Error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

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
      return createRateLimitResponse(rl.reset, "Comment rate limit exceeded. Please wait.");
    }

    // ── 2. Authenticate or Demo Fallback ───────────────────────────────────
    let userId = session?.userId;
    if (!userId) {
      if (!isDemoModeEnabled()) {
        return NextResponse.json(
          { error: "Authentication required to post comments.", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }
      const demoUser = await db.user.findFirst({ where: { role: "CITIZEN" } });
      if (!demoUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = demoUser.id;
    }

    // ── 3. Validate Input ───────────────────────────────────────────────────
    const body = await request.json();
    const valResult = CommentCreateSchema.safeParse(body);
    if (!valResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: valResult.error.flatten() },
        { status: 400 }
      );
    }

    const { content, audioUrl } = valResult.data;

    // ── 4. Verify Parent Challenge Exists ───────────────────────────────────
    const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const comment = await db.comment.create({
      data: {
        challengeId,
        userId,
        content: content.trim(),
        audioUrl: audioUrl || null,
      },
      include: {
        user: { select: { id: true, name: true, role: true, organization: true } },
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: unknown) {
    safeLog.error("Post Comment Error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
