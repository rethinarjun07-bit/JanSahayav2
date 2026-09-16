import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { safeLog } from "@/lib/safe-logger";
import { DEMO_PERSONAS } from "@/lib/demo-personas";

export async function GET(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    let user: any = null;
    try {
      user = await db.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organization: true,
          designation: true,
          district: true,
          state: true,
          skills: true,
          karmaPoints: true,
          badges: true,
          avatar: true,
        },
      });
    } catch (dbErr) {
      safeLog.warn("Database lookup failed during auth/me:", dbErr);
    }

    if (!user) {
      // Fall back to decoded session token data / demo personas
      const demoFallback = DEMO_PERSONAS[session.role];
      return NextResponse.json({
        user: {
          id: session.userId,
          name: session.name || demoFallback?.name || "Demo User",
          email: session.email || demoFallback?.email || "demo@demo.in",
          role: session.role || demoFallback?.role || "CITIZEN",
          organization: session.organization || demoFallback?.organization || null,
          designation: demoFallback?.designation || null,
          district: session.district || demoFallback?.district || "Ranchi",
          state: demoFallback?.state || "Jharkhand",
          skills: demoFallback?.skills || [],
          karmaPoints: demoFallback?.karmaPoints || 100,
          badges: demoFallback?.badges || [],
          avatar: null,
        },
      });
    }

    return NextResponse.json({
      user: {
        ...user,
        skills: user.skills ? (typeof user.skills === "string" ? JSON.parse(user.skills) : user.skills) : [],
        badges: user.badges ? (typeof user.badges === "string" ? JSON.parse(user.badges) : user.badges) : [],
      },
    });
  } catch (error: unknown) {
    safeLog.error("Auth me error:", error);
    try {
      const session = await getUserFromRequest(request);
      if (session) {
        const demoFallback = DEMO_PERSONAS[session.role];
        return NextResponse.json({
          user: {
            id: session.userId,
            name: session.name || demoFallback?.name || "Demo User",
            email: session.email || demoFallback?.email || "demo@demo.in",
            role: session.role || demoFallback?.role || "CITIZEN",
            organization: session.organization || demoFallback?.organization || null,
            designation: demoFallback?.designation || null,
            district: session.district || demoFallback?.district || "Ranchi",
            state: demoFallback?.state || "Jharkhand",
            skills: demoFallback?.skills || [],
            karmaPoints: demoFallback?.karmaPoints || 100,
            badges: demoFallback?.badges || [],
            avatar: null,
          },
        });
      }
    } catch {
      // ignore
    }
    return NextResponse.json({ user: null });
  }
}
