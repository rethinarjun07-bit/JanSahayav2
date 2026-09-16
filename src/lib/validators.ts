import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, "Full name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  role: z.enum(["CITIZEN", "SOLVER", "INDUSTRY", "ADMIN"]),
  organization: z.string().max(200).optional(),
  designation: z.string().max(200).optional(),
  phone: z.string().max(25).optional(),
  district: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  skills: z.array(z.string().max(80)).max(50).optional(),
  bio: z.string().max(1000).optional(),
});

export const ChallengeSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Please provide a description (at least 10 characters)").max(10000),
  category: z.string().min(1, "Please select a category").max(100),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  urgencyScore: z.number().min(1).max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().min(1, "Address is required").max(300),
  district: z.string().min(1, "District is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  pincode: z.string().max(12).optional().nullable(),
  mediaUrls: z.array(z.string().max(15_000_000)).max(20).optional(),
  audioUrl: z.string().max(15_000_000).optional().nullable(),
  voiceTranscript: z.string().max(10000).optional().nullable(),
  language: z.string().max(10).default("en"),
  aiTags: z.array(z.string().max(50)).max(20).optional(),
});

export const SolutionSchema = z.object({
  challengeId: z.string().min(1, "Challenge ID is required").max(100),
  teamName: z.string().max(150).optional(),
  title: z.string().min(6, "Solution title must be at least 6 characters").max(200),
  abstract: z.string().min(20, "Please provide an executive abstract").max(3000),
  methodology: z.string().min(30, "Please explain your technical methodology").max(15000),
  techStack: z.array(z.string().max(50)).max(30).optional(),
  budgetEstimate: z.number().positive().max(1000000000).optional(),
  timelineMonths: z.number().int().positive().max(120).optional(),
  prototypeUrl: z.string().url().max(1000).optional().or(z.literal("")),
  mediaUrls: z.array(z.string().max(15_000_000)).max(20).optional(),
  milestones: z
    .array(
      z.object({
        order: z.number().min(1).max(20),
        title: z.string().min(3).max(200),
        description: z.string().min(5).max(3000),
        targetDate: z.string().max(50).optional(),
      })
    )
    .max(20)
    .optional(),
});

export const DuplicateMergeSchema = z.object({
  masterChallengeId: z.string().min(1).max(100),
  duplicateChallengeId: z.string().min(1).max(100),
  reason: z.string().min(5, "Merge rationale is required").max(2000),
});

export const ReviewSchema = z.object({
  solutionId: z.string().min(1).max(100),
  rating: z.number().min(1).max(5),
  feasibilityScore: z.number().min(1).max(5),
  impactScore: z.number().min(1).max(5),
  costEffectiveness: z.number().min(1).max(5),
  scalabilityScore: z.number().min(1).max(5),
  feedback: z.string().min(10, "Review feedback must be at least 10 characters").max(4000),
});

export const VerificationSchema = z.object({
  challengeId: z.string().min(1).max(100),
  status: z.enum([
    "VERIFIED",
    "NEEDS_MORE_EVIDENCE",
    "REJECTED",
    "ASSIGNED",
    "DUPLICATE",
    "ESCALATED",
    "IN_PROGRESS",
    "SOLVED",
    "CLOSED",
  ]),
  officialNotes: z.string().min(5, "Official remarks required").max(5000),
  assignedUniversityId: z.string().max(100).optional(),
  assignedDepartment: z.string().max(150).optional(),
  verifiedSeverity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

export const SolutionSelectionSchema = z.object({
  challengeId: z.string().min(1).max(100),
  selectedSolutionId: z.string().min(1).max(100),
  governmentDecisionReason: z.string().min(10, "Statutory decision reason required").max(5000),
});

export const CitizenFeedbackSchema = z.object({
  challengeId: z.string().min(1).max(100),
  feedback: z.enum(["SOLVED", "PARTIALLY_SOLVED", "NOT_SOLVED"]),
  notes: z.string().max(2000).optional(),
  satisfactionRating: z.number().min(1).max(5).optional(),
});

export const CSRPledgeSchema = z.object({
  challengeId: z.string().min(1).max(100),
  solutionId: z.string().max(100).optional(),
  funderName: z.string().min(2).max(200),
  amountPledged: z.number().positive().max(1000000000),
  notes: z.string().max(2000).optional(),
});

export const CommentCreateSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty").max(2000),
  audioUrl: z.string().max(15_000_000).optional().nullable(),
});

export const ChatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().max(1000),
      })
    )
    .max(10)
    .optional(),
  previousIntent: z.string().max(100).optional(),
  previousEntities: z.record(z.unknown()).optional(),
});

export const VoiceReportInputSchema = z.object({
  transcript: z.string().min(1, "Transcript cannot be empty").max(5000),
  language: z.string().max(20).optional(),
});

export const SMSParseInputSchema = z.object({
  smsText: z.string().min(1, "SMS text cannot be empty").max(500),
  phone: z.string().max(25).optional(),
});
