import React from "react";
import Link from "next/link";
import { ArrowLeft, Award, Building2, Zap, Star, Flame, CheckCircle2, Sparkles } from "lucide-react";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SolverProfilePage() {
  let solver: any = null;
  try {
    solver = await db.user.findFirst({
      where: { email: "solver@demo.in" },
      include: {
        solutions: {
          include: { challenge: true, milestones: true, reviews: true },
        },
      },
    });
  } catch (err) {
    console.warn("Database query failed in SolverProfilePage:", err);
  }

  const solverSkills: string[] = solver?.skills ? JSON.parse(solver.skills) : [];
  const solverBadges: { id: string; name: string; icon: string }[] = solver?.badges
    ? JSON.parse(solver.badges)
    : [];

  const totalReviews = solver?.solutions.flatMap((s) => s.reviews) || [];
  const avgRating =
    totalReviews.length > 0
      ? (totalReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews.length).toFixed(1)
      : "N/A";

  const totalMilestones = solver?.solutions.flatMap((s) => s.milestones) || [];
  const approvedMilestones = totalMilestones.filter((m) => m.status === "APPROVED").length;

  const specializations = [
    { label: "Primary Domain", value: "Disaster Risk Reduction & Remote Sensing" },
    { label: "Field Specialization", value: "IoT Flood Monitoring, UAV Surveillance" },
    { label: "Geographic Focus", value: "Jharkhand Tribal Districts" },
    { label: "Preferred Scale", value: "State → National Replication" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/solver/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-navy transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Solver Dashboard
          </Link>
          <span className="text-xs font-bold text-gov-navy bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Verified Innovation Researcher &bull; SIH26043
          </span>
        </div>

        {/* Profile Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-gov-navy to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl">
          <div className="flex items-start gap-6 flex-wrap">
            {/* Avatar Initials */}
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-3xl font-extrabold text-white font-serif select-none">
              AM
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase">
                  Verified Researcher
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                  Top 3% Nationally
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
                {solver?.name || "Dr. Aarav Mehta"}
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                {solver?.designation || "Associate Professor"} &bull;{" "}
                <strong>{solver?.organization || "BIT Mesra, Disaster Tech Lab"}</strong>
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {solver?.district || "Ranchi"}, {solver?.state || "Jharkhand"} &bull;{" "}
                <a href={`mailto:${solver?.email}`} className="underline hover:text-amber-300">
                  {solver?.email || "solver@demo.in"}
                </a>
              </p>
            </div>

            {/* Karma Score */}
            <div className="text-center min-w-[120px]">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                  Total Karma
                </div>
                <div className="text-3xl font-extrabold text-white">⭐ {solver?.karmaPoints || 640}</div>
              </div>
            </div>
          </div>

          {/* Skills Chips */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">
              Certified Expertise Areas
            </div>
            <div className="flex flex-wrap gap-2">
              {solverSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-white/10 text-slate-200 text-xs font-medium border border-white/10"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-extrabold text-gov-navy">{solver?.solutions.length || 2}</div>
            <div className="text-xs text-slate-500 mt-0.5">Solutions Proposed</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-extrabold text-amber-600">⭐ {avgRating}</div>
            <div className="text-xs text-slate-500 mt-0.5">Avg Mentor Rating</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-extrabold text-emerald-600">{approvedMilestones}</div>
            <div className="text-xs text-slate-500 mt-0.5">Stage Gates Cleared</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <div className="text-2xl font-extrabold text-purple-600">{solverBadges.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Badges Earned</div>
          </div>
        </div>

        {/* Earned Badges */}
        {solverBadges.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 font-serif mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Achievement Badges & Recognition Seals</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {solverBadges.map((b, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-200 text-center shadow-sm"
                >
                  <div className="text-3xl mb-2">{b.icon || "🏆"}</div>
                  <div className="text-xs font-bold text-slate-900">{b.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specialization & Research Areas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 font-serif mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Research Specialization Matrix</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {specializations.map((spec, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                  {spec.label}
                </span>
                <span className="font-bold text-slate-900 text-sm">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Solutions Portfolio */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gov-navy" />
            <span>Solution Portfolio</span>
          </h3>

          {solver?.solutions.map((sol) => (
            <div key={sol.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      {sol.status.replace("_", " ")}
                    </span>
                    {sol.govtEndorsed && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Endorsed
                      </span>
                    )}
                  </div>
                  <Link href={`/solutions/${sol.id}`} className="block group">
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-gov-navy transition-colors">
                      {sol.title}
                    </h4>
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Challenge: <strong>{sol.challenge.title}</strong>
                  </p>
                </div>
                <Link
                  href={`/solutions/${sol.id}`}
                  className="px-3.5 py-1.5 bg-gov-navy hover:bg-gov-navyLight text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  Open Workspace →
                </Link>
              </div>

              {sol.milestones.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {sol.milestones.map((m) => (
                    <span
                      key={m.id}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        m.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {m.status === "APPROVED" ? "✓" : "○"} Phase {m.order}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
