import React from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Star, Award, CheckCircle2, Building2 } from "lucide-react";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { challengeId?: string };
}

export default async function CompareSolutionsPage({ searchParams }: Props) {
  const challengeId = searchParams.challengeId;

  let challenge: any = null;
  try {
    challenge = challengeId
      ? await db.challenge.findUnique({
          where: { id: challengeId },
          include: {
            solutions: {
              include: {
                author: true,
                milestones: true,
                reviews: true,
              },
            },
          },
        })
      : null;

    if (!challenge) {
      challenge = await db.challenge.findFirst({
        where: {
          solutions: {
            some: {},
          },
        },
        include: {
          solutions: {
            include: {
              author: true,
              milestones: true,
              reviews: true,
            },
          },
        },
      });
    }
  } catch (err) {
    console.warn("Database query failed in CompareSolutionsPage:", err);
  }

  const solutions = challenge?.solutions || [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={challengeId ? `/challenges/${challengeId}` : "/challenges"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-navy transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Challenge
          </Link>
          <span className="text-xs font-bold text-gov-saffron bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
            Differentiator #10: Multiple Solution Evaluation Matrix
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-bold font-serif text-slate-900 mb-1">
            Side-by-Side Solution Comparison Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Evaluating competing engineering proposals for: &ldquo;{challenge?.title || "All Challenges"}&rdquo;
          </p>
        </div>

        {solutions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
            No multiple proposals available for comparison on this challenge yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((s) => {
              const avgRating =
                s.reviews.length > 0
                  ? (s.reviews.reduce((acc, r) => acc + r.rating, 0) / s.reviews.length).toFixed(1)
                  : "Unrated";

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {s.status.replace("_", " ")}
                      </span>
                      {s.govtEndorsed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Endorsed
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{s.title}</h3>
                    <p className="text-xs text-slate-500">
                      Team: <strong>{s.teamName || s.author.name}</strong> ({s.author.organization})
                    </p>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{s.abstract}</p>

                    {/* Comparison Metrics */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Budget Estimate:</span>
                        <strong className="text-slate-800">
                          ₹{s.budgetEstimate ? (s.budgetEstimate / 100000).toFixed(2) : "0"} Lakhs
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Timeline:</span>
                        <strong className="text-slate-800">{s.timelineMonths || 3} Months</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Milestones:</span>
                        <strong className="text-slate-800">{s.milestones.length} Phases</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mentor Score:</span>
                        <strong className="text-amber-600 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> {avgRating}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/solutions/${s.id}`}
                    className="w-full mt-4 py-2.5 bg-gov-navy hover:bg-gov-navyLight text-white text-xs font-bold rounded-xl text-center shadow-sm transition-colors"
                  >
                    Open Full Proposal Workspace &rarr;
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
