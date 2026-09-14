import { NextResponse } from "next/server";
import { TokenPayload } from "./auth";

// ---------------------------------------------------------------------------
// Role Definitions & Permission Map
// ---------------------------------------------------------------------------

export type AppRole = "CITIZEN" | "SOLVER" | "INDUSTRY" | "ADMIN";

/**
 * Defines which roles are permitted to perform each action category.
 * Used for fine-grained permission checks in API routes.
 */
export const ROLE_PERMISSIONS: Record<string, AppRole[]> = {
  // Government-exclusive actions
  verify_challenge:   ["ADMIN"],
  merge_challenges:   ["ADMIN"],
  assign_university:  ["ADMIN"],
  view_admin_panel:   ["ADMIN"],
  view_audit_logs:    ["ADMIN"],

  // Solver + Admin actions
  post_solution:      ["SOLVER", "ADMIN"],
  submit_milestone:   ["SOLVER", "ADMIN"],

  // Industry + Admin actions
  endorse_solution:   ["INDUSTRY", "ADMIN"],
  browse_industry:    ["INDUSTRY", "ADMIN", "CITIZEN", "SOLVER"],

  // Any authenticated user
  post_challenge:     ["CITIZEN", "SOLVER", "INDUSTRY", "ADMIN"],
  upvote:             ["CITIZEN", "SOLVER", "INDUSTRY", "ADMIN"],
  comment:            ["CITIZEN", "SOLVER", "INDUSTRY", "ADMIN"],
};

// ---------------------------------------------------------------------------
// Role hierarchy: each role also inherits the roles below it
// ---------------------------------------------------------------------------
export const PROTECTED_ROUTES: Record<string, AppRole[]> = {
  "/admin":           ["ADMIN"],
  "/solver/dashboard":["SOLVER", "ADMIN"],
  "/solver/profile":  ["SOLVER", "ADMIN"],
  "/industry":        ["INDUSTRY", "ADMIN"],
};

// ---------------------------------------------------------------------------
// API Guard Helpers
// ---------------------------------------------------------------------------

/**
 * Asserts that the authenticated session has one of the required roles.
 * Returns a NextResponse 401/403 if not, or null if check passes.
 *
 * Usage in API routes:
 *   const deny = requireRole(session, "ADMIN");
 *   if (deny) return deny;
 */
export function requireRole(
  session: TokenPayload | null,
  ...allowedRoles: AppRole[]
): NextResponse | null {
  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized: Authentication required.",
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    );
  }

  const userRole = session.role as AppRole;
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      {
        error: `Forbidden: This action requires ${allowedRoles.join(" or ")} authority. Your current role is ${userRole}.`,
        code: "INSUFFICIENT_PRIVILEGES",
        requiredRoles: allowedRoles,
        currentRole: userRole,
      },
      { status: 403 }
    );
  }

  return null; // Access granted
}

/**
 * Asserts that the authenticated session is an authorized Government ADMIN.
 */
export function requireAdmin(session: TokenPayload | null): NextResponse | null {
  return requireRole(session, "ADMIN");
}

/**
 * Asserts that the authenticated session has any of the specified roles.
 */
export function requireAnyRole(
  session: TokenPayload | null,
  ...allowedRoles: AppRole[]
): NextResponse | null {
  return requireRole(session, ...allowedRoles);
}

/**
 * Checks whether a given role is allowed to access a protected page path.
 */
export function canAccessRoute(role: string | undefined, pathname: string): boolean {
  for (const [prefix, allowed] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      if (!role) return false;
      return (allowed as string[]).includes(role);
    }
  }
  return true; // Public route
}

/**
 * Roles allowed to self-register via the public /register endpoint.
 * ADMIN accounts must be created by seeding or a secure internal tool.
 */
export const SELF_REGISTERABLE_ROLES: AppRole[] = ["CITIZEN", "SOLVER", "INDUSTRY"];

/**
 * Roles available in Demo Mode (ADMIN is intentionally excluded).
 * ADMIN always requires real credentials via /login.
 */
export const DEMO_ALLOWED_ROLES: AppRole[] = ["CITIZEN", "SOLVER", "INDUSTRY"];

/**
 * Centrally determines whether Demo Mode and unauthenticated fallbacks are permitted.
 * CRITICAL SECURITY INVARIANT:
 * Always returns false in production (NODE_ENV === "production").
 * Demo mode must fail-closed in production deployments.
 */
export function isDemoModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.DEMO_MODE === "true";
}
