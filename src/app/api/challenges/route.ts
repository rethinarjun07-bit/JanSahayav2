import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { ChallengeSchema } from "@/lib/validators";
import { classifyChallenge } from "@/lib/nlp/classifier";
import { evaluateDuplicates } from "@/lib/nlp/tfidf";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { safeLog } from "@/lib/safe-logger";
import { isDemoModeEnabled } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const district = searchParams.get("district") || "";
    const state = searchParams.get("state") || "";
    const category = searchParams.get("category") || "";
    const severity = searchParams.get("severity") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { district: { contains: search } },
        { address: { contains: search } },
      ];
    }

    if (district && district !== "All Districts") {
      where.district = district;
    }

    if (state && state !== "All States") {
      where.state = state;
    }

    if (category && category !== "All Categories") {
      where.category = category;
    }

    if (severity && severity !== "All Severities") {
      where.severity = severity;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const skip = (page - 1) * limit;

    const [totalCount, challenges] = await Promise.all([
      db.challenge.count({ where }),
      db.challenge.findMany({
        where,
        orderBy: [{ urgencyScore: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          createdBy: {
            select: { id: true, name: true, role: true, organization: true },
          },
          _count: {
            select: { solutions: true, upvotes: true, comments: true, duplicates: true },
          },
        },
      }),
    ]);

    const now = new Date().getTime();

    return NextResponse.json({
      challenges: challenges.map((c) => {
        const deadlineTime = c.slaDeadline
          ? new Date(c.slaDeadline).getTime()
          : new Date(c.createdAt).getTime() + 14 * 24 * 3600 * 1000;
        const diffHours = Math.round((deadlineTime - now) / (1000 * 60 * 60));

        let liveSlaStatus = c.slaStatus || "ON_TRACK";
        if (c.status === "SOLVED" || c.status === "MERGED") {
          liveSlaStatus = "RESOLVED";
        } else if (diffHours < -24) {
          liveSlaStatus = "ESCALATED";
        } else if (diffHours < 0) {
          liveSlaStatus = "BREACHED";
        } else if (diffHours <= 24) {
          liveSlaStatus = "APPROACHING";
        }

        return {
          ...c,
          slaStatus: liveSlaStatus,
          slaRemainingHours: diffHours,
          slaBreached: diffHours < 0,
          aiTags: c.aiTags ? JSON.parse(c.aiTags) : [],
          mediaUrls: c.mediaUrls ? JSON.parse(c.mediaUrls) : [],
          sdgGoals: c.sdgGoals ? JSON.parse(c.sdgGoals) : [],
        };
      }),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      total: totalCount,
    });
  } catch (error: unknown) {
    console.error("Fetch Challenges Error:", error);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    const clientIp = getClientIp(request);
    const identifier = session ? `user:${session.userId}` : `ip:${clientIp}`;

    // ── Rate Limiting Check ────────────────────────────────────────────────
    const rl = checkRateLimit(identifier, RATE_LIMIT_BUCKETS.CHALLENGE_CREATE);
    if (!rl.success) {
      return createRateLimitResponse(rl.reset, "Challenge creation limit reached. Please wait.");
    }

    let creatorId = session?.userId;

    if (!creatorId) {
      // In production, reject unauthenticated challenge submissions (fails closed)
      if (!isDemoModeEnabled()) {
        return NextResponse.json(
          { error: "Authentication required to submit challenges.", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }

      // Fallback to demo citizen user in demo mode
      const defaultCitizen = await db.user.findFirst({ where: { role: "CITIZEN" } });
      if (!defaultCitizen) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      creatorId = defaultCitizen.id;
    }

    const body = await request.json();
    const result = ChallengeSchema.safeParse(body);
    if (!result.success) {
      const fieldErrors = Object.entries(result.error.flatten().fieldErrors)
        .map(([field, msgs]) => Array.isArray(msgs) ? msgs.join(", ") : msgs)
        .filter(Boolean)
        .join(". ");
      return NextResponse.json(
        {
          error: fieldErrors ? `Validation failed: ${fieldErrors}` : "Validation failed",
          details: result.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Run Hybrid NLP Classifier with real ground evidence parameters
    const hasDetailedAddress = Boolean(data.address && data.address.trim().length >= 10);
    const classification = classifyChallenge(data.title, data.description, {
      hasGps: Boolean(data.latitude && data.longitude),
      latitude: data.latitude,
      longitude: data.longitude,
      mediaCount: data.mediaUrls?.length || 0,
      hasVoice: Boolean(data.audioUrl || data.voiceTranscript),
      hasDetailedAddress,
      corroborationCount: 0,
    });

    // Fetch existing challenges to run duplicate detection
    const existingChallenges = await db.challenge.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        district: true,
        category: true,
        latitude: true,
        longitude: true,
        createdAt: true,
      },
    });

    const duplicateCandidates = evaluateDuplicates(
      {
        title: data.title,
        description: data.description,
        district: data.district,
        category: data.category,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      existingChallenges,
      0.45
    );

    const highestDupScore = duplicateCandidates.length > 0 ? duplicateCandidates[0].similarityPercentage : 0;

    // Check if university matches
    const matchedUni = await db.university.findFirst({
      where: { code: classification.recommendedUniversity.code },
    });

    // Compute SLA Deadline
    const now = new Date();
    let slaHours = 24 * 14; // default 14 days
    if (classification.severity === "CRITICAL") slaHours = 48; // 48h
    else if (classification.severity === "HIGH") slaHours = 24 * 7; // 7 days
    else if (classification.severity === "LOW") slaHours = 24 * 30; // 30 days
    const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const newChallenge = await db.challenge.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category || classification.predictedCategory,
        severity: data.severity || classification.severity,
        urgencyScore: classification.urgencyScore,
        confidenceScore: classification.confidenceScore,
        duplicateProbability: highestDupScore,
        evidenceStrength: classification.evidenceStrength,
        priorityScore: classification.priorityScore,
        recommendedDepartment: classification.recommendedDepartment,
        sdgGoals: JSON.stringify(classification.sdgGoals),
        slaDeadline,
        slaStatus: "ON_TRACK",
        status: "SUBMITTED",
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
        mediaUrls: data.mediaUrls ? JSON.stringify(data.mediaUrls) : null,
        audioUrl: data.audioUrl,
        voiceTranscript: data.voiceTranscript,
        language: data.language || "en",
        aiTags: JSON.stringify(data.aiTags && data.aiTags.length > 0 ? data.aiTags : classification.tags),
        predictedSector: classification.predictedCategory,
        autoAssignedUniversity: classification.recommendedUniversity.name,
        assignedUniversityId: null, // Advisory only: Official institutional assignment requires Government verification
        createdById: creatorId,

        // Provenance Architecture (Citizen -> AI -> Official Government Determination)
        citizenReportedCategory: data.category,
        citizenReportedSeverity: data.severity,
        aiPredictedCategory: classification.predictedCategory,
        aiPredictedSeverity: classification.severity,
        aiUrgencyScore: classification.urgencyScore,
        officialGovernmentCategory: null,
        officialGovernmentSeverity: null,
      },
    });

    // Create Audit Log
    const creatorUser = await db.user.findUnique({ where: { id: creatorId } });
    await db.auditLog.create({
      data: {
        action: "CHALLENGE_CREATED",
        entityType: "Challenge",
        entityId: newChallenge.id,
        actorId: creatorId,
        actorName: creatorUser?.name || "Citizen Reporter",
        details: JSON.stringify({
          severity: newChallenge.severity,
          urgencyScore: newChallenge.urgencyScore,
          confidenceScore: newChallenge.confidenceScore,
          evidenceStrength: newChallenge.evidenceStrength,
          priorityScore: newChallenge.priorityScore,
          duplicateWarningCount: duplicateCandidates.length,
          slaDeadline: slaDeadline.toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      challenge: {
        ...newChallenge,
        aiTags: JSON.parse(newChallenge.aiTags || "[]"),
        sdgGoals: JSON.parse(newChallenge.sdgGoals || "[]"),
      },
      duplicatesDetected: duplicateCandidates,
    });
  } catch (error: unknown) {
    console.error("Create Challenge Error:", error);
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 });
  }
}
