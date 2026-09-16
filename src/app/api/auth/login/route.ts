import { NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword, generateToken, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { LoginSchema } from "@/lib/validators";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { safeLog } from "@/lib/safe-logger";
import { DEMO_PERSONAS } from "@/lib/demo-personas";

export async function POST(request: Request) {
  try {
    // ── 1. Rate Limiting Check (Anti-Brute-Force) ───────────────────────────
    const clientIp = getClientIp(request);
    const rl = checkRateLimit(clientIp, RATE_LIMIT_BUCKETS.AUTH);
    if (!rl.success) {
      return createRateLimitResponse(
        rl.reset,
        "Too many login attempts from this IP. Please wait before retrying."
      );
    }

    // ── 2. Request Validation ──────────────────────────────────────────────
    const body = await request.json();
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // ── 2b. User Lookup (with offline demo resilience) ─────────────────────
    let user: any = null;
    try {
      user = await db.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbErr) {
      safeLog.warn("Database unavailable during login attempt, falling back to demo personas:", dbErr);
    }

    if (!user) {
      const demoMatch = Object.values(DEMO_PERSONAS).find(
        (p) => p.email.toLowerCase() === normalizedEmail
      );
      if (demoMatch) {
        // Valid demo passwords
        const validPasswords = ["Admin@123", "Demo@123", "Citizen@123", "Solver@123", "Industry@123", "Password@123"];
        if (validPasswords.includes(password)) {
          user = {
            id: demoMatch.id,
            email: demoMatch.email,
            name: demoMatch.name,
            role: demoMatch.role,
            organization: demoMatch.organization,
            designation: demoMatch.designation,
            district: demoMatch.district,
            state: demoMatch.state,
            karmaPoints: demoMatch.karmaPoints,
            avatar: demoMatch.avatar,
            _isDemo: true,
          };
        }
      }
    }

    // Uniform timing-safe error response (prevents user enumeration)
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user._isDemo) {
      const isMatch = await verifyPassword(password, user.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }
    }

    // ── 3. Secure Token Generation & Session Cookie ─────────────────────────
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization || undefined,
      district: user.district || undefined,
    };

    const token = generateToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      user: {
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
      },
    });

    response.cookies.set("jansahaya_token", token, AUTH_COOKIE_OPTIONS);

    return response;
  } catch (error: unknown) {
    safeLog.error("Login API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
