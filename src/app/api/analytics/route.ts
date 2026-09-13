import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const totalChallenges = await db.challenge.count();
    const resolvedChallenges = await db.challenge.count({ where: { status: "SOLVED" } });
    const inProgressChallenges = await db.challenge.count({ where: { status: "IN_PROGRESS" } });
    const verifiedChallenges = await db.challenge.count({ where: { status: "VERIFIED" } });
    const assignedChallenges = await db.challenge.count({ where: { status: "ASSIGNED" } });
    const mergedChallenges = await db.challenge.count({ where: { status: "MERGED" } });

    const totalSolutions = await db.solution.count();
    const verifiedSolutions = await db.solution.count({ where: { govtEndorsed: true } });
    const totalSolvers = await db.user.count({ where: { role: "SOLVER" } });
    const totalCitizens = await db.user.count({ where: { role: "CITIZEN" } });
    const totalIndustry = await db.user.count({ where: { role: "INDUSTRY" } });

    // Database-level Aggregation via Prisma groupBy (O(1) memory footprint)
    const [categoryGroups, severityGroups, districtGroups] = await Promise.all([
      db.challenge.groupBy({
        by: ["category"],
        _count: { id: true },
      }),
      db.challenge.groupBy({
        by: ["severity"],
        _count: { id: true },
      }),
      db.challenge.groupBy({
        by: ["district"],
        _count: { id: true },
      }),
    ]);

    const categoryData = categoryGroups.map((g) => ({ name: g.category, value: g._count.id }));
    const severityData = severityGroups.map((g) => ({ name: g.severity, value: g._count.id }));
    const districtData = districtGroups
      .map((g) => ({ name: g.district, count: g._count.id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const statusFunnel = [
      { stage: "Submitted", count: totalChallenges },
      { stage: "Verified by Govt", count: verifiedChallenges + assignedChallenges + inProgressChallenges + resolvedChallenges },
      { stage: "Institute Assigned", count: assignedChallenges + inProgressChallenges + resolvedChallenges },
      { stage: "Active Solutions", count: inProgressChallenges + resolvedChallenges },
      { stage: "Deployed & Solved", count: resolvedChallenges },
    ];

    return NextResponse.json({
      summary: {
        totalChallenges,
        resolvedChallenges,
        activeSolutions: totalSolutions,
        verifiedSolutions,
        totalSolvers,
        totalCitizens,
        totalIndustry,
        districtsCovered: districtGroups.length,
        csrPledgedCrores: "₹4.85 Cr",
        duplicateMergesCount: mergedChallenges,
      },
      categoryData,
      severityData,
      districtData,
      statusFunnel,
    });
  } catch (error: unknown) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 });
  }
}
