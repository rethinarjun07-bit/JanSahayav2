import React from "react";
import Link from "next/link";
import {
  Award,
  Trophy,
  Medal,
  Star,
  Zap,
  Building2,
  CheckCircle2,
  Sparkles,
  Flame,
} from "lucide-react";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  let solvers: any[] = [];
  let universities: any[] = [];

  try {
    solvers = await db.user.findMany({
      where: { role: "SOLVER" },
      orderBy: { karmaPoints: "desc" },
      include: {
        _count: { select: { solutions: true } },
      },
    });

    universities = await db.university.findMany();
  } catch (err) {
    console.warn("Database query failed in LeaderboardPage, using fallback:", err);
  }

  const topThree = solvers.slice(0, 3);
  const restSolvers = solvers.slice(3);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>National Societal Innovation League &bull; SIH26043</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif">
            Innovation Hall of Fame & Leaderboard
          </h1>
          <p className="text-xs text-slate-500">
            Recognizing researcher labs, universities, and student teams engineering impactful disaster mitigation solutions.
          </p>
        </div>

        {/* Podium for Top 3 Solvers */}
        {topThree.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8 max-w-4xl mx-auto">
            {/* 2nd Place: Silver */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-md text-center flex flex-col items-center order-2 md:order-1 relative">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-lg mb-3 shadow">
                🥈 2
              </div>
              <h3 className="font-bold text-slate-900 text-base">{topThree[1].name}</h3>
              <p className="text-xs text-slate-500 mb-2">{topThree[1].organization}</p>
              <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                ⭐ {topThree[1].karmaPoints} Karma
              </div>
              <div className="mt-3 text-[11px] text-slate-400">
                {topThree[1]._count.solutions} Active Solutions
              </div>
            </div>

            {/* 1st Place: Gold (Elevated) */}
            <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl border-4 border-amber-400 p-8 shadow-xl text-center flex flex-col items-center order-1 md:order-2 transform md:-translate-y-4 relative">
              <div className="absolute -top-5 px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider shadow">
                Grand Champion
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-2xl mb-3 shadow-lg">
                🥇 1
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{topThree[0].name}</h3>
              <p className="text-xs text-slate-500 mb-3">{topThree[0].organization}</p>
              <div className="px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 text-sm font-extrabold shadow-sm">
                ⭐ {topThree[0].karmaPoints} Karma Points
              </div>
              <div className="mt-4 text-xs text-slate-500 font-medium">
                {topThree[0]._count.solutions} Verified Field Deployments
              </div>
            </div>

            {/* 3rd Place: Bronze */}
            <div className="bg-white rounded-3xl border-2 border-amber-200/80 p-6 shadow-md text-center flex flex-col items-center order-3 md:order-3 relative">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg mb-3 shadow">
                🥉 3
              </div>
              <h3 className="font-bold text-slate-900 text-base">{topThree[2].name}</h3>
              <p className="text-xs text-slate-500 mb-2">{topThree[2].organization}</p>
              <div className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
                ⭐ {topThree[2].karmaPoints} Karma
              </div>
              <div className="mt-3 text-[11px] text-slate-400">
                {topThree[2]._count.solutions} Active Solutions
              </div>
            </div>
          </div>
        )}

        {/* Ranking Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Full Researcher & Solver Rankings
            </h2>
            <span className="text-xs text-slate-400 font-mono">Real-time Karma Engine</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {solvers.map((s, idx) => (
              <div
                key={s.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-400 w-6 text-center font-mono">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      {s.organization} &bull; {s.district}, {s.state}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Solutions</span>
                    <span className="font-bold text-slate-700">{s._count.solutions}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Score</span>
                    <span className="font-extrabold text-amber-600 text-sm">⭐ {s.karmaPoints}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* University Innovation Trophy Standings */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 font-serif mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gov-navy" />
            <span>Premier University Innovation Standings</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {universities.map((uni, i) => (
              <div key={uni.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gov-navy">#{i + 1} &bull; {uni.code}</span>
                  <span className="text-[10px] text-slate-500">{uni.district}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm line-clamp-1 mb-2">{uni.name}</div>
                <div className="text-[11px] text-slate-500">
                  Nodal Officer: <strong>{uni.nodalOfficerName}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
