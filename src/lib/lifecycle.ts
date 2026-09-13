/**
 * JanSahaya Authoritative Challenge & Solution Lifecycle State Machine
 *
 * Enforces strictly permitted transitions across the civic problem and solution lifecycles.
 * Centralizes database status updates and audit logging to eliminate transition bypass paths.
 */

import db from "./db";

export const CHALLENGE_STATUSES = [
  "SUBMITTED",
  "NEEDS_MORE_EVIDENCE",
  "VERIFIED",
  "ASSIGNED",
  "IN_PROGRESS",
  "DEPLOYED",
  "FIELD_VERIFIED",
  "SOLVED",
  "CLOSED",
  "REJECTED",
  "DUPLICATE",
  "MERGED",
  "ESCALATED",
] as const;

export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

/**
 * Permitted status transitions map:
 * Key = current status, Value = array of allowed target statuses
 */
export const PERMITTED_LIFECYCLE_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["VERIFIED", "NEEDS_MORE_EVIDENCE", "REJECTED", "DUPLICATE", "MERGED", "ESCALATED"],
  NEEDS_MORE_EVIDENCE: ["SUBMITTED", "REJECTED", "CLOSED"],
  VERIFIED: ["ASSIGNED", "IN_PROGRESS", "REJECTED", "ESCALATED", "DEPLOYED"],
  ASSIGNED: ["IN_PROGRESS", "VERIFIED", "ESCALATED"],
  IN_PROGRESS: ["DEPLOYED", "FIELD_VERIFIED", "ASSIGNED", "ESCALATED"],
  DEPLOYED: ["FIELD_VERIFIED", "SOLVED", "IN_PROGRESS"],
  FIELD_VERIFIED: ["SOLVED", "IN_PROGRESS", "CLOSED"],
  SOLVED: ["CLOSED", "IN_PROGRESS"], // Reopen to IN_PROGRESS allowed if citizen feedback reports NOT_SOLVED
  CLOSED: ["SUBMITTED"],             // Re-opening closed ticket
  REJECTED: ["SUBMITTED"],           // Citizen appealing with new evidence
  DUPLICATE: ["SUBMITTED"],          // Re-opened if proved distinct
  MERGED: [],                        // Terminal state: subsumed by master challenge
  ESCALATED: ["VERIFIED", "ASSIGNED", "IN_PROGRESS", "SOLVED", "FIELD_VERIFIED"],
};

/**
 * Validates whether a challenge state transition from `fromStatus` to `toStatus` is permitted.
 */
export function isValidChallengeTransition(fromStatus: string, toStatus: string): boolean {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true;

  const allowed = PERMITTED_LIFECYCLE_TRANSITIONS[fromStatus];
  if (!allowed) return false;

  return allowed.includes(toStatus);
}

export interface TransitionActor {
  userId: string;
  name: string;
  role: string;
}

export interface TransitionOptions {
  challengeId: string;
  toStatus: string;
  actor: TransitionActor;
  notes?: string;
  additionalData?: Record<string, unknown>;
}

export interface TransitionResult {
  success: boolean;
  challenge?: any;
  error?: string;
  code?: string;
  statusHttp?: number;
}

/**
 * Centralized server-side function to transition a challenge's status.
 * Validates current status, target status, actor permissions, updates DB, and writes audit log
 * within a single transaction.
 */
export async function transitionChallengeStatus(
  options: TransitionOptions
): Promise<TransitionResult> {
  const { challengeId, toStatus, actor, notes, additionalData = {} } = options;

  const existing = await db.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!existing) {
    return {
      success: false,
      error: "Challenge not found",
      code: "CHALLENGE_NOT_FOUND",
      statusHttp: 404,
    };
  }

  // 1. Validate lifecycle transition
  if (!isValidChallengeTransition(existing.status, toStatus)) {
    return {
      success: false,
      error: `Invalid challenge lifecycle transition: Cannot transition from '${existing.status}' to '${toStatus}'.`,
      code: "INVALID_LIFECYCLE_TRANSITION",
      statusHttp: 409,
    };
  }

  // 2. Validate role authorization
  const isAdmin = actor.role === "ADMIN";
  const isSolver = actor.role === "SOLVER";

  if (!isAdmin) {
    // Solvers can only transition ASSIGNED -> IN_PROGRESS or IN_PROGRESS -> DEPLOYED
    const solverPermitted =
      isSolver &&
      ((existing.status === "ASSIGNED" && toStatus === "IN_PROGRESS") ||
       (existing.status === "VERIFIED" && toStatus === "IN_PROGRESS") ||
       (existing.status === "IN_PROGRESS" && toStatus === "DEPLOYED"));

    if (!solverPermitted) {
      return {
        success: false,
        error: `Forbidden: Role '${actor.role}' is not authorized to transition challenge to '${toStatus}'.`,
        code: "INSUFFICIENT_PRIVILEGES",
        statusHttp: 403,
      };
    }
  }

  // 3. Execute atomic update and audit log in transaction
  const updated = await db.$transaction(async (tx) => {
    const challengeUpdateData: Record<string, unknown> = {
      status: toStatus,
      ...additionalData,
    };

    if (toStatus === "VERIFIED" && !existing.verifiedAt) {
      challengeUpdateData.verifiedAt = new Date();
      challengeUpdateData.verifiedById = actor.userId;
    }

    if (notes) {
      challengeUpdateData.officialNotes = notes;
    }

    const updatedChallenge = await tx.challenge.update({
      where: { id: challengeId },
      data: challengeUpdateData,
    });

    await tx.auditLog.create({
      data: {
        action: `CHALLENGE_STATUS_${toStatus}`,
        entityType: "Challenge",
        entityId: challengeId,
        actorId: actor.userId,
        actorName: actor.name,
        details: JSON.stringify({
          previousStatus: existing.status,
          newStatus: toStatus,
          notes,
          role: actor.role,
        }),
      },
    });

    return updatedChallenge;
  });

  return {
    success: true,
    challenge: updated,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Solution Lifecycle State Machine
// ─────────────────────────────────────────────────────────────────────────────

export const SOLUTION_STATUSES = [
  "DRAFT",
  "PROPOSED",
  "MENTOR_REVIEW",
  "PILOT_DEPLOYED",
  "GOVT_VERIFIED",
  "DEPLOYED",
] as const;

export type SolutionStatus = (typeof SOLUTION_STATUSES)[number];

export const PERMITTED_SOLUTION_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PROPOSED"],
  PROPOSED: ["MENTOR_REVIEW", "PILOT_DEPLOYED", "DRAFT"],
  MENTOR_REVIEW: ["PILOT_DEPLOYED", "PROPOSED"],
  PILOT_DEPLOYED: ["GOVT_VERIFIED", "DEPLOYED", "MENTOR_REVIEW"],
  GOVT_VERIFIED: ["DEPLOYED"],
  DEPLOYED: [],
};

/**
 * Validates whether a solution state transition is valid and authorized for the user role.
 */
export function isValidSolutionTransition(
  fromStatus: string,
  toStatus: string,
  userRole: string
): { valid: boolean; error?: string } {
  if (!fromStatus || !toStatus) return { valid: false, error: "Status missing" };
  if (fromStatus === toStatus) return { valid: true };

  // Statutory gates: only ADMIN can set GOVT_VERIFIED or DEPLOYED
  if (["GOVT_VERIFIED", "DEPLOYED"].includes(toStatus) && userRole !== "ADMIN") {
    return {
      valid: false,
      error: `Forbidden: Only Government Authority (ADMIN) can elevate solution status to '${toStatus}'.`,
    };
  }

  const allowed = PERMITTED_SOLUTION_TRANSITIONS[fromStatus];
  if (!allowed || !allowed.includes(toStatus)) {
    return {
      valid: false,
      error: `Invalid solution transition from '${fromStatus}' to '${toStatus}'.`,
    };
  }

  return { valid: true };
}
