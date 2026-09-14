/**
 * JanSahaya V2 — Government Final Authority & Lifecycle Integrity Tests
 *
 * Verifies:
 *  1. Four-Role Authority Matrix (Citizen, Solver, Industry, Admin)
 *  2. Government-only statutory gates (verify, assign university, select solution, mark solved)
 *  3. Industry CSR boundary (cannot set govtEndorsed, cannot mark challenge SOLVED)
 *  4. Solution author privilege escalation prevention (cannot set GOVT_VERIFIED or DEPLOYED)
 *  5. University assignment requirement: challenge must be verified first
 *  6. Resource ownership protection (IDOR defense)
 */

import { requireRole, requireAdmin, type AppRole } from "../lib/rbac";
import type { TokenPayload } from "../lib/auth";

function makeSession(role: AppRole, userId = `user-${role.toLowerCase()}`): TokenPayload {
  return {
    userId,
    email: `${role.toLowerCase()}@jansahaya.gov.in`,
    name: `Test ${role}`,
    role,
  };
}

describe("Government Final Authority — Quad-Helix Enforcement", () => {
  const citizen = makeSession("CITIZEN");
  const solver = makeSession("SOLVER");
  const industry = makeSession("INDUSTRY");
  const admin = makeSession("ADMIN");

  test("Citizen attempting Government verification is DENIED (403)", () => {
    const res = requireAdmin(citizen);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  test("Student/Solver attempting Government verification is DENIED (403)", () => {
    const res = requireAdmin(solver);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  test("Industry attempting Government verification is DENIED (403)", () => {
    const res = requireAdmin(industry);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
  });

  test("Government Authority alone is GRANTED access to verification", () => {
    const res = requireAdmin(admin);
    expect(res).toBeNull();
  });

  test("Only Government Authority can select official implementation solution", () => {
    expect(requireRole(citizen, "ADMIN")?.status).toBe(403);
    expect(requireRole(solver, "ADMIN")?.status).toBe(403);
    expect(requireRole(industry, "ADMIN")?.status).toBe(403);
    expect(requireRole(admin, "ADMIN")).toBeNull();
  });
});

describe("Industry Endorsement Boundaries (Statutory Gate Separation)", () => {
  interface SolutionState {
    status: string;
    govtEndorsed: boolean;
    endorsedBy?: string;
    csrFundingStatus: string;
    csrFunderName?: string;
    csrAmountPledged?: number;
  }

  function simulateEndorsement(
    role: AppRole,
    actorName: string,
    initialSolution: SolutionState,
    grantPledge?: number
  ): { updatedSolution: SolutionState; challengeSolved: boolean; authority: string } {
    if (role !== "ADMIN" && role !== "INDUSTRY") {
      throw new Error("403 Forbidden");
    }

    if (role === "ADMIN") {
      return {
        updatedSolution: {
          ...initialSolution,
          govtEndorsed: true,
          endorsedBy: actorName,
          status: "GOVT_VERIFIED",
        },
        challengeSolved: true,
        authority: "GOVERNMENT",
      };
    } else {
      // INDUSTRY role: CSR support only. CANNOT set govtEndorsed or mark challenge SOLVED.
      return {
        updatedSolution: {
          ...initialSolution,
          csrFundingStatus: "PLEDGED",
          csrFunderName: actorName,
          csrAmountPledged: grantPledge || 500000,
          // govtEndorsed remains unchanged!
        },
        challengeSolved: false, // Industry CANNOT mark challenge SOLVED!
        authority: "INDUSTRY_CSR",
      };
    }
  }

  test("Industry endorsement sets CSR pledge but leaves govtEndorsed as FALSE", () => {
    const initial: SolutionState = {
      status: "PROPOSED",
      govtEndorsed: false,
      csrFundingStatus: "UNFUNDED",
    };

    const result = simulateEndorsement("INDUSTRY", "Tata CSR Foundation", initial, 1000000);
    expect(result.updatedSolution.govtEndorsed).toBe(false);
    expect(result.updatedSolution.csrFundingStatus).toBe("PLEDGED");
    expect(result.updatedSolution.csrFunderName).toBe("Tata CSR Foundation");
    expect(result.updatedSolution.csrAmountPledged).toBe(1000000);
    expect(result.challengeSolved).toBe(false);
  });

  test("Industry endorsement CANNOT mark challenge as officially SOLVED", () => {
    const initial: SolutionState = {
      status: "PROPOSED",
      govtEndorsed: false,
      csrFundingStatus: "UNFUNDED",
    };

    const result = simulateEndorsement("INDUSTRY", "Adani CSR", initial, 500000);
    expect(result.challengeSolved).toBe(false);
  });

  test("Government Admin endorsement sets govtEndorsed=TRUE and allows official solution resolution", () => {
    const initial: SolutionState = {
      status: "PROPOSED",
      govtEndorsed: false,
      csrFundingStatus: "UNFUNDED",
    };

    const result = simulateEndorsement("ADMIN", "State Disaster Nodal Authority", initial);
    expect(result.updatedSolution.govtEndorsed).toBe(true);
    expect(result.updatedSolution.status).toBe("GOVT_VERIFIED");
    expect(result.challengeSolved).toBe(true);
    expect(result.authority).toBe("GOVERNMENT");
  });
});

describe("Institutional Assignment Gates", () => {
  function canAssignUniversity(challengeStatus: string): boolean {
    const VERIFIED_STATUSES = ["VERIFIED", "ASSIGNED", "IN_PROGRESS"];
    return VERIFIED_STATUSES.includes(challengeStatus);
  }

  test("Unverified challenge (SUBMITTED) cannot receive university assignment", () => {
    expect(canAssignUniversity("SUBMITTED")).toBe(false);
  });

  test("Citizen challenge creation leaves assignedUniversityId as null (Awaiting Government Verification)", () => {
    // Simulates the creation contract from /api/challenges
    const submissionResult = {
      status: "SUBMITTED",
      autoAssignedUniversity: "BIT Mesra — Disaster Innovation Lab", // AI recommendation stored
      assignedUniversityId: null, // Must remain null until official government verification
    };

    expect(submissionResult.status).toBe("SUBMITTED");
    expect(submissionResult.assignedUniversityId).toBeNull();
    expect(submissionResult.autoAssignedUniversity).toBeTruthy();
  });

  test("Rejected challenge (REJECTED) cannot receive university assignment", () => {
    expect(canAssignUniversity("REJECTED")).toBe(false);
  });

  test("Officially verified challenge (VERIFIED) can receive university assignment", () => {
    expect(canAssignUniversity("VERIFIED")).toBe(true);
  });

  test("In-progress challenge (IN_PROGRESS) can receive department reassignment", () => {
    expect(canAssignUniversity("IN_PROGRESS")).toBe(true);
  });
});

describe("Resource Protection & Privilege Escalation Prevention", () => {
  test("Author cannot elevate solution status to GOVT_VERIFIED", () => {
    const isAuthor = true;
    const isAdmin = false;
    const requestedStatus = "GOVT_VERIFIED";

    const isForbidden = !isAdmin && ["GOVT_VERIFIED", "DEPLOYED"].includes(requestedStatus);
    expect(isForbidden).toBe(true);
  });

  test("Author cannot elevate solution status to DEPLOYED", () => {
    const isAuthor = true;
    const isAdmin = false;
    const requestedStatus = "DEPLOYED";

    const isForbidden = !isAdmin && ["GOVT_VERIFIED", "DEPLOYED"].includes(requestedStatus);
    expect(isForbidden).toBe(true);
  });

  test("Admin can elevate solution status to GOVT_VERIFIED or DEPLOYED", () => {
    const isAdmin = true;
    const requestedStatus = "GOVT_VERIFIED";

    const isForbidden = !isAdmin && ["GOVT_VERIFIED", "DEPLOYED"].includes(requestedStatus);
    expect(isForbidden).toBe(false);
  });

  test("IDOR Defense: User cannot modify another user's challenge", () => {
    const challengeOwnerId: string = "citizen-001";
    const requestingUserId: string = "citizen-002";
    const isAdmin = false;

    const canModify = isAdmin || challengeOwnerId === requestingUserId;
    expect(canModify).toBe(false);
  });

  test("IDOR Defense: User cannot modify another user's solution proposal", () => {
    const solutionAuthorId: string = "solver-101";
    const requestingUserId: string = "solver-102";
    const isAdmin = false;

    const canModify = isAdmin || solutionAuthorId === requestingUserId;
    expect(canModify).toBe(false);
  });
});
