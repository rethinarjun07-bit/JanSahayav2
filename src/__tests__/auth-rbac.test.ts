/**
 * JanSahaya V2 — Authentication & RBAC Security Test Suite
 *
 * Tests the "AI recommends. Government verifies and decides." security tenet:
 *  - Self-registration role blocking (ADMIN cannot be self-registered)
 *  - RBAC enforcement across all Quad-Helix roles
 *  - Route access control via the canAccessRoute helper
 *  - Error response shape validation
 */

import {
  requireRole,
  requireAdmin,
  requireAnyRole,
  canAccessRoute,
  SELF_REGISTERABLE_ROLES,
  DEMO_ALLOWED_ROLES,
  type AppRole,
} from "../lib/rbac";
import type { TokenPayload } from "../lib/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSession(role: AppRole, extras?: Partial<TokenPayload>): TokenPayload {
  return {
    userId: `user-${role.toLowerCase()}-test`,
    email: `${role.toLowerCase()}@test.jansahaya.in`,
    name: `Test ${role}`,
    role,
    ...extras,
  };
}

/**
 * Extract the JSON body from a NextResponse.
 * NextResponse.body is a ReadableStream; we need to consume it.
 */
async function parseResponseBody(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  return JSON.parse(text);
}

// ---------------------------------------------------------------------------
// Section 1: Self-Registration Role Policy
// ---------------------------------------------------------------------------

describe("Self-Registration Role Policy", () => {
  test("CITIZEN is allowed to self-register", () => {
    expect(SELF_REGISTERABLE_ROLES).toContain("CITIZEN");
  });

  test("SOLVER is allowed to self-register", () => {
    expect(SELF_REGISTERABLE_ROLES).toContain("SOLVER");
  });

  test("INDUSTRY is allowed to self-register", () => {
    expect(SELF_REGISTERABLE_ROLES).toContain("INDUSTRY");
  });

  test("ADMIN is NOT in SELF_REGISTERABLE_ROLES", () => {
    expect(SELF_REGISTERABLE_ROLES).not.toContain("ADMIN");
  });

  test("ADMIN is NOT in DEMO_ALLOWED_ROLES", () => {
    expect(DEMO_ALLOWED_ROLES).not.toContain("ADMIN");
  });
});

// ---------------------------------------------------------------------------
// Section 2: requireRole Guard — response status codes
// ---------------------------------------------------------------------------

describe("requireRole — access guard helper", () => {
  test("returns 401 when session is null", async () => {
    const result = requireRole(null, "CITIZEN");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
    const json = await parseResponseBody(result!);
    expect(json.code).toBe("AUTH_REQUIRED");
  });

  describe("Role: CITIZEN", () => {
    const session = makeSession("CITIZEN");

    test("CITIZEN is allowed on CITIZEN-only routes", () => {
      expect(requireRole(session, "CITIZEN")).toBeNull();
    });

    test("CITIZEN is blocked from ADMIN-only routes with 403", async () => {
      const result = requireRole(session, "ADMIN");
      expect(result!.status).toBe(403);
      const json = await parseResponseBody(result!);
      expect(json.code).toBe("INSUFFICIENT_PRIVILEGES");
    });

    test("CITIZEN is blocked from SOLVER-only routes", () => {
      const result = requireRole(session, "SOLVER");
      expect(result!.status).toBe(403);
    });

    test("CITIZEN is allowed on mixed CITIZEN+ADMIN routes", () => {
      expect(requireRole(session, "CITIZEN", "ADMIN")).toBeNull();
    });
  });

  describe("Role: SOLVER", () => {
    const session = makeSession("SOLVER");

    test("SOLVER is allowed on SOLVER-only routes", () => {
      expect(requireRole(session, "SOLVER")).toBeNull();
    });

    test("SOLVER is allowed on SOLVER+ADMIN routes", () => {
      expect(requireRole(session, "SOLVER", "ADMIN")).toBeNull();
    });

    test("SOLVER is blocked from ADMIN-only routes", () => {
      expect(requireRole(session, "ADMIN")!.status).toBe(403);
    });
  });

  describe("Role: ADMIN", () => {
    const session = makeSession("ADMIN");

    test("ADMIN is allowed on ADMIN-only routes", () => {
      expect(requireAdmin(session)).toBeNull();
    });

    test("ADMIN is allowed on SOLVER+ADMIN routes", () => {
      expect(requireRole(session, "SOLVER", "ADMIN")).toBeNull();
    });

    test("ADMIN is allowed on CITIZEN+ADMIN routes", () => {
      expect(requireRole(session, "CITIZEN", "ADMIN")).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Section 3: requireAdmin helper (shorthand)
// ---------------------------------------------------------------------------

describe("requireAdmin — Government authority guard", () => {
  test("returns null (pass) for ADMIN session", () => {
    expect(requireAdmin(makeSession("ADMIN"))).toBeNull();
  });

  test("returns 403 for CITIZEN session", () => {
    expect(requireAdmin(makeSession("CITIZEN"))!.status).toBe(403);
  });

  test("returns 403 for SOLVER session", () => {
    expect(requireAdmin(makeSession("SOLVER"))!.status).toBe(403);
  });

  test("returns 401 for null session", () => {
    expect(requireAdmin(null)!.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Section 4: requireAnyRole helper
// ---------------------------------------------------------------------------

describe("requireAnyRole — multi-role guard", () => {
  test("SOLVER passes SOLVER+INDUSTRY check", () => {
    expect(requireAnyRole(makeSession("SOLVER"), "SOLVER", "INDUSTRY")).toBeNull();
  });

  test("INDUSTRY passes SOLVER+INDUSTRY check", () => {
    expect(requireAnyRole(makeSession("INDUSTRY"), "SOLVER", "INDUSTRY")).toBeNull();
  });

  test("CITIZEN fails SOLVER+INDUSTRY check", () => {
    expect(requireAnyRole(makeSession("CITIZEN"), "SOLVER", "INDUSTRY")!.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Section 5: canAccessRoute — Page-level route guard
// ---------------------------------------------------------------------------

describe("canAccessRoute — middleware page guard", () => {
  test("ADMIN can access /admin", () => {
    expect(canAccessRoute("ADMIN", "/admin")).toBe(true);
  });

  test("CITIZEN cannot access /admin", () => {
    expect(canAccessRoute("CITIZEN", "/admin")).toBe(false);
  });

  test("SOLVER cannot access /admin", () => {
    expect(canAccessRoute("SOLVER", "/admin")).toBe(false);
  });

  test("SOLVER can access /solver/dashboard", () => {
    expect(canAccessRoute("SOLVER", "/solver/dashboard")).toBe(true);
  });

  test("CITIZEN cannot access /solver/dashboard", () => {
    expect(canAccessRoute("CITIZEN", "/solver/dashboard")).toBe(false);
  });

  test("ADMIN can access /solver/dashboard (elevated role)", () => {
    expect(canAccessRoute("ADMIN", "/solver/dashboard")).toBe(true);
  });

  test("INDUSTRY can access /industry", () => {
    expect(canAccessRoute("INDUSTRY", "/industry")).toBe(true);
  });

  test("CITIZEN cannot access /industry", () => {
    expect(canAccessRoute("CITIZEN", "/industry")).toBe(false);
  });

  test("Any role can access public routes", () => {
    expect(canAccessRoute("CITIZEN", "/challenges")).toBe(true);
    expect(canAccessRoute("SOLVER", "/challenges")).toBe(true);
    expect(canAccessRoute(undefined, "/challenges")).toBe(true);
  });

  test("Undefined role cannot access /admin", () => {
    expect(canAccessRoute(undefined, "/admin")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Section 6: Error response shape validation
// ---------------------------------------------------------------------------

describe("RBAC error response shape", () => {
  test("403 response has requiredRoles and currentRole fields", async () => {
    const result = requireRole(makeSession("CITIZEN"), "ADMIN");
    const json = await parseResponseBody(result!);
    expect(json).toHaveProperty("requiredRoles");
    expect(json).toHaveProperty("currentRole");
    expect(Array.isArray(json.requiredRoles)).toBe(true);
    expect((json.requiredRoles as string[]).includes("ADMIN")).toBe(true);
    expect(json.currentRole).toBe("CITIZEN");
  });

  test("401 response has AUTH_REQUIRED code", async () => {
    const result = requireRole(null, "CITIZEN");
    const json = await parseResponseBody(result!);
    expect(json.code).toBe("AUTH_REQUIRED");
  });
});
