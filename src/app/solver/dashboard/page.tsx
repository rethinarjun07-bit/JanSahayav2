import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Zap,
  Building2,
  Award,
  Sparkles,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Flame,
  Layers,
} from "lucide-react";
import db from "@/lib/db";
import { SolverDashboardClient } from "./solver-dashboard-client";

export const dynamic = "force-dynamic";

export default async function SolverDashboardPage() {
  let solver: any = null;
  let challenges: any[] = [];

  try {
    // Get active solver (default to Dr. Aarav Mehta)
    solver = await db.user.findFirst({
      where: { role: "SOLVER", email: "solver@demo.in" },
      include: {
        solutions: {
          include: {
            challenge: true,
            milestones: { orderBy: { order: "asc" } },
            reviews: true,
          },
        },
      },
    });

    // Get active challenges to run match
    challenges = await db.challenge.findMany({
      where: { status: { not: "MERGED" } },
      orderBy: { urgencyScore: "desc" },
      take: 12,
    });
  } catch (err) {
    console.warn("Database query failed in SolverDashboardPage:", err);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Differentiator #3: Expertise-Based Solver Matching
            </span>
          </div>
          <Link
            href="/challenges"
            className="text-xs font-bold text-gov-navy hover:underline flex items-center gap-1"
          >
            <span>Browse All Ground Challenges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <SolverDashboardClient
          solver={solver}
          challenges={challenges.map((c) => ({
            ...c,
            aiTags: c.aiTags ? JSON.parse(c.aiTags) : [],
          }))}
        />
      </div>
    </div>
  );
}
