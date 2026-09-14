import { NextResponse } from "next/server";
import db from "@/lib/db";
import { generateToken, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { DEMO_ALLOWED_ROLES, isDemoModeEnabled } from "@/lib/rbac";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { safeLog } from "@/lib/safe-logger";

const ROLE_EMAILS: Record<string, string> = {
  CITIZEN:  "citizen@demo.in",
  SOLVER:   "solver@demo.in",
  INDUSTRY: "industry@demo.in",
  // NOTE: ADMIN is intentionally NOT listed here — ADMIN requires real credentials via /login
};

export async function POST(request: Request) {
  // ── 1. Security Gate: Demo mode must be explicitly enabled (fails closed in production) ──
  if (!isDemoModeEnabled()) {
    return NextResponse.json(
      {
        error: "Demo mode is disabled on this deployment.",
        code: "DEMO_MODE_DISABLED",
      },
      { status: 403 }
    );
  }

  // ── 2. Rate Limiting ────────────────────────────────────────────────────────
  const clientIp = getClientIp(request);
  const rl = checkRateLimit(clientIp, RATE_LIMIT_BUCKETS.AUTH);
  if (!rl.success) {
    return createRateLimitResponse(rl.reset, "Too many role switch requests. Please wait.");
  }

  try {
    const body = await request.json();
    const roleKey = (body.role || "").toUpperCase();

    // ── 3. Security: Block ADMIN role from demo-switch ───────────────────────
    if (!DEMO_ALLOWED_ROLES.includes(roleKey as "CITIZEN" | "SOLVER" | "INDUSTRY")) {
      return NextResponse.json(
        {
          error: `Demo mode does not allow switching to '${roleKey}'. Government Authority (ADMIN) accounts require official credentials via /login. Allowed demo roles: ${DEMO_ALLOWED_ROLES.join(", ")}`,
          code: "DEMO_ROLE_RESTRICTED",
          allowedRoles: DEMO_ALLOWED_ROLES,
        },
        { status: 403 }
      );
    }

    const targetEmail = ROLE_EMAILS[roleKey];
    if (!targetEmail) {
      return NextResponse.json(
        { error: `Invalid demo role: ${body.role}.` },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email: targetEmail } });
    if (!user) {
      return NextResponse.json(
        { error: "Demo persona not found. Please run the seed script." },
        { status: 404 }
      );
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization || undefined,
      district: user.district || undefined,
    };

    const token = generateToken(tokenPayload);
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      designation: user.designation,
      district: user.district,
      state: user.state,
      karmaPoints: user.karmaPoints,
      avatar: user.avatar,
    };

    const response = NextResponse.json({ success: true, user: userData });
    response.cookies.set("jansahaya_token", token, AUTH_COOKIE_OPTIONS);

    return response;
  } catch (error: unknown) {
    safeLog.error("Demo Switch Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
