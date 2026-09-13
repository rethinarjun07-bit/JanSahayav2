/**
 * JanSahaya Authoritative Challenge Lifecycle State Machine
 *
 * Enforces strictly permitted transitions across the civic problem lifecycle.
 * Prevents arbitrary status jumps from unverified clients or invalid state escalations.
 */

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
  SOLVED: ["CLOSED", "IN_PROGRESS"], // IN_PROGRESS allowed if citizen feedback reports NOT_SOLVED
  CLOSED: ["SUBMITTED"],             // Re-opening closed ticket
  REJECTED: ["SUBMITTED"],           // Citizen appealing with new evidence
  DUPLICATE: ["SUBMITTED"],          // Re-opened if proved distinct
  MERGED: [],                        // Terminal state: subsumed by master challenge
  ESCALATED: ["VERIFIED", "ASSIGNED", "IN_PROGRESS", "SOLVED", "FIELD_VERIFIED"],
};

/**
 * Validates whether a state transition from `fromStatus` to `toStatus` is permitted.
 */
export function isValidChallengeTransition(fromStatus: string, toStatus: string): boolean {
  if (!fromStatus || !toStatus) return false;
  // Idempotent: transitioning to the same status is always allowed
  if (fromStatus === toStatus) return true;

  const allowed = PERMITTED_LIFECYCLE_TRANSITIONS[fromStatus];
  if (!allowed) return false;

  return allowed.includes(toStatus);
}
