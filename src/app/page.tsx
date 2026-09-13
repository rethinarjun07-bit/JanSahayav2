import React from "react";
import db from "@/lib/db";
import { HomeClient } from "@/components/home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let totalChallenges = 0;
  let totalSolutions = 0;
  let totalSolvers = 0;
  let criticalCount = 0;
  let featuredChallenges: any[] = [];

  try {
    totalChallenges = await db.challenge.count();
    totalSolutions = await db.solution.count();
    totalSolvers = await db.user.count({ where: { role: "SOLVER" } });
    criticalCount = await db.challenge.count({ where: { severity: "CRITICAL" } });

    featuredChallenges = await db.challenge.findMany({
      where: { status: { not: "MERGED" } },
      orderBy: [{ urgencyScore: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: {
        _count: {
          select: { solutions: true, upvotes: true },
        },
      },
    });
  } catch {
    // Database offline or unreachable; gracefully degrade with default initial values
  }

  return (
    <HomeClient
      totalChallenges={totalChallenges}
      totalSolutions={totalSolutions}
      totalSolvers={totalSolvers}
      criticalCount={criticalCount}
      featuredChallenges={featuredChallenges}
    />
  );
}
