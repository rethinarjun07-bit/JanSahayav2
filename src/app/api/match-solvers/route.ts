import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { computeSolverMatch, SolverProfile, ChallengeTarget } from "@/lib/nlp/matcher";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to access solver matching.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const challengeId = searchParams.get("challengeId");
    const solverId = searchParams.get("solverId");

    // Mode 1: Match solvers for a specific challenge
    if (challengeId) {
      const challenge = await db.challenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge) {
        return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
      }

      const solvers = await db.user.findMany({
        where: { role: "SOLVER" },
        select: {
          id: true,
          name: true,
          organization: true,
          designation: true,
          district: true,
          state: true,
          skills: true,
          karmaPoints: true,
          _count: {
            select: { solutions: true },
          },
        },
        take: 50,
      });

      const challengeTarget: ChallengeTarget = {
        id: challenge.id,
        title: challenge.title,
        category: challenge.category,
        district: challenge.district,
        state: challenge.state,
        aiTags: challenge.aiTags ? JSON.parse(challenge.aiTags) : [],
        description: challenge.description,
        urgencyScore: challenge.urgencyScore,
      };

      const matches = solvers.map((s) => {
        const profile: SolverProfile = {
          id: s.id,
          name: s.name,
          organization: s.organization,
          designation: s.designation,
          district: s.district,
          state: s.state,
          skills: s.skills ? JSON.parse(s.skills) : [],
          karmaPoints: s.karmaPoints,
          solvedCount: s._count.solutions,
        };
        return computeSolverMatch(profile, challengeTarget);
      });

      // Sort by match percentage descending
      matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

      return NextResponse.json({
        challengeId,
        totalSolversEvaluated: solvers.length,
        matches,
      });
    }

    // Mode 2: Match challenges for a specific solver
    if (solverId) {
      const solver = await db.user.findUnique({
        where: { id: solverId },
        include: {
          _count: {
            select: { solutions: true },
          },
        },
      });

      if (!solver) {
        return NextResponse.json({ error: "Solver not found" }, { status: 404 });
      }

      const profile: SolverProfile = {
        id: solver.id,
        name: solver.name,
        organization: solver.organization,
        designation: solver.designation,
        district: solver.district,
        state: solver.state,
        skills: solver.skills ? JSON.parse(solver.skills) : [],
        karmaPoints: solver.karmaPoints,
        solvedCount: solver._count.solutions,
      };

      const challenges = await db.challenge.findMany({
        where: { status: { not: "MERGED" } },
        orderBy: { urgencyScore: "desc" },
        take: 50,
      });

      const matchedChallenges = challenges.map((c) => {
        const challengeTarget: ChallengeTarget = {
          id: c.id,
          title: c.title,
          category: c.category,
          district: c.district,
          state: c.state,
          aiTags: c.aiTags ? JSON.parse(c.aiTags) : [],
          description: c.description,
          urgencyScore: c.urgencyScore,
        };
        const match = computeSolverMatch(profile, challengeTarget);
        return {
          challenge: {
            ...c,
            aiTags: challengeTarget.aiTags,
          },
          match,
        };
      });

      // Sort by match percentage descending
      matchedChallenges.sort((a, b) => b.match.matchPercentage - a.match.matchPercentage);

      return NextResponse.json({
        solverId,
        solverName: solver.name,
        totalChallenges: challenges.length,
        matches: matchedChallenges,
      });
    }

    return NextResponse.json({ error: "Provide either challengeId or solverId parameter" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Match Solvers Error:", error);
    return NextResponse.json({ error: "Failed to calculate expertise matches" }, { status: 500 });
  }
}
