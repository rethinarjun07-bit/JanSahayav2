import { NextResponse } from "next/server";
import db from "@/lib/db";
import { detectCivicClusters } from "@/lib/nlp/tfidf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const radiusParam = searchParams.get("radiusKm");
    const rawRadius = radiusParam ? parseFloat(radiusParam) : 2.5;
    // Enforce safe radius bounds between 0.5 km and 50.0 km to prevent DoS
    const radiusKm = isNaN(rawRadius) ? 2.5 : Math.min(50.0, Math.max(0.5, rawRadius));

    const challenges = await db.challenge.findMany({
      where: { status: { not: "MERGED" } },
      select: {
        id: true,
        title: true,
        category: true,
        district: true,
        latitude: true,
        longitude: true,
        urgencyScore: true,
        status: true,
      },
      take: 200,
      orderBy: { urgencyScore: "desc" },
    });

    const clusters = detectCivicClusters(challenges, radiusKm);

    return NextResponse.json({
      totalChallengesAnalyzed: challenges.length,
      clustersFound: clusters.length,
      clusters,
    });
  } catch (error: unknown) {
    console.error("Clusters API Error:", error);
    return NextResponse.json({ error: "Failed to detect civic clusters" }, { status: 500 });
  }
}
