import { NextResponse } from "next/server";
import db from "@/lib/db";
import { generateToken, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { DEMO_ALLOWED_ROLES, isDemoModeEnabled } from "@/lib/rbac";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { safeLog } from "@/lib/safe-logger";
import { DEMO_PERSONAS } from "@/lib/demo-personas";

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

    let user: any = null;
    try {
      user = await db.user.findUnique({ where: { email: targetEmail } });
    } catch (dbErr) {
      safeLog.warn("Database lookup failed during demo switch; using fallback persona:", dbErr);
    }

    if (!user) {
      user = DEMO_PERSONAS[roleKey];
    }

    if (!user) {
      return NextResponse.json(
        { error: "Demo persona not found." },
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
      karmaPoints: user.karmaPoints || 100,
      avatar: user.avatar,
      skills: user.skills ? (typeof user.skills === "string" ? JSON.parse(user.skills) : user.skills) : [],
      badges: user.badges ? (typeof user.badges === "string" ? JSON.parse(user.badges) : user.badges) : [],
    };

    const response = NextResponse.json({ success: true, user: userData, token });
    response.cookies.set("jansahaya_token", token, AUTH_COOKIE_OPTIONS);

    return response;
  } catch (error: unknown) {
    safeLog.error("Demo Switch Error:", error);
    // Even on uncaught exception in demo mode, try to return the requested persona
    try {
      const body = await request.clone().json();
      const roleKey = (body.role || "").toUpperCase();
      const fallback = DEMO_PERSONAS[roleKey];
      if (fallback) {
        const token = generateToken({
          userId: fallback.id,
          email: fallback.email,
          name: fallback.name,
          role: fallback.role,
          organization: fallback.organization,
          district: fallback.district,
        });
        const res = NextResponse.json({ success: true, user: fallback, token });
        res.cookies.set("jansahaya_token", token, AUTH_COOKIE_OPTIONS);
        return res;
      }
    } catch {
      // ignore secondary error
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
