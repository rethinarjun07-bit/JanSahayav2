import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const universities = await db.university.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      universities: universities.map((u) => ({
        ...u,
        departments: JSON.parse(u.departments || "[]"),
        expertiseTags: JSON.parse(u.expertiseTags || "[]"),
      })),
    });
  } catch (error: unknown) {
    console.error("Fetch Universities Error:", error);
    return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
  }
}
