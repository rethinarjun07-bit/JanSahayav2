"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Building2,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ThumbsUp,
  Star,
  ShieldCheck,
  Send,
} from "lucide-react";
import { triggerConfetti } from "@/components/celebration-effects";
import { sound } from "@/lib/sound";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  solution: any;
}

export function SolutionWorkspaceClient({ solution }: Props) {
  const [milestones, setMilestones] = useState(solution.milestones);
  const [reviews, setReviews] = useState(solution.reviews);
  const [govtEndorsed, setGovtEndorsed] = useState(solution.govtEndorsed);
  const [status, setStatus] = useState(solution.status);

  // Review Form
  const [rating, setRating] = useState(5);
  const [feasibility, setFeasibility] = useState(4.8);
  const [impact, setImpact] = useState(4.9);
  const [cost, setCost] = useState(4.6);
  const [scalability, setScalability] = useState(4.8);
  const [feedback, setFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Milestone action
  const handleApproveMilestone = async (milestoneId: string) => {
    sound.playClick();
    try {
      const res = await fetch(`/api/solutions/${solution.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId,
          milestoneStatus: "APPROVED",
        }),
      });

      if (res.ok) {
        triggerConfetti();
        setMilestones(
          milestones.map((m: { id: string }) =>
            m.id === milestoneId ? { ...m, status: "APPROVED" } : m
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndorseSolution = async () => {
    sound.playClick();
    try {
      const res = await fetch(`/api/solutions/${solution.id}/endorse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "GOVT_VERIFIED",
          remarks: "Officially endorsed by Joint Government-Industry Review Board.",
          grantPledge: "₹12 Lakhs Co-Sponsorship Approved",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        triggerConfetti();
        if (data.solution?.govtEndorsed) {
          setGovtEndorsed(true);
        }
        if (data.solution?.status) {
          setStatus(data.solution.status);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    sound.playClick();
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/solutions/${solution.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feasibilityScore: feasibility,
          impactScore: impact,
          costEffectiveness: cost,
          scalabilityScore: scalability,
          feedback,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        triggerConfetti();
        setReviews([data.review, ...reviews]);
        setFeedback("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Solution Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full uppercase bg-blue-100 text-blue-800">
              {status.replace("_", " ")}
            </span>
            {govtEndorsed && (
              <span className="text-xs font-bold px-3 py-1 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Officially Endorsed
              </span>
            )}
            <span className="text-xs text-slate-500 font-medium">Stage: {solution.milestoneStage}</span>
          </div>

          {!govtEndorsed && (
            <button
              onClick={handleEndorseSolution}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Issue Official Endorsement</span>
            </button>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif leading-snug mb-2">
          {solution.title}
        </h1>

        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 mb-6 pb-6 border-b border-slate-100">
          <span>
            Lead: <strong>{solution.author.name}</strong> ({solution.author.organization})
          </span>
          <span>&bull;</span>
          <span>Team: <strong>{solution.teamName || "Research Taskforce"}</strong></span>
          <span>&bull;</span>
          <span>
            Budget: <strong className="text-slate-800">₹{(solution.budgetEstimate / 100000).toFixed(2)} Lakhs</strong>
          </span>
          <span>&bull;</span>
          <span>Timeline: <strong className="text-slate-800">{solution.timelineMonths || 4} Months</strong></span>
        </div>

        {/* Abstract */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-wider">
              Executive Abstract
            </h3>
            <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
              {solution.abstract}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1 uppercase tracking-wider">
              Technical Methodology
            </h3>
            <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line">
              {solution.methodology}
            </p>
          </div>

          {solution.techStack.length > 0 && (
            <div>
              <h3 className="font-bold text-slate-900 text-xs mb-1 uppercase tracking-wider">
                Technology Stack & Components
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {solution.techStack.map((t: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stage Gate Milestones Tracker */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 font-serif mb-1">
          Stage Gate Milestone Progress
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Milestones must be signed off by technical mentors and district authorities prior to disbursement.
        </p>

        <div className="space-y-4">
          {milestones.map((m: any) => (
            <div
              key={m.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start justify-between flex-wrap gap-3"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gov-navy text-white text-xs font-bold flex items-center justify-center">
                    {m.order}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded uppercase ${
                      m.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : m.status === "SUBMITTED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-8 leading-relaxed">{m.description}</p>
                {m.notes && <div className="text-[11px] text-slate-400 pl-8 italic">Remarks: {m.notes}</div>}
              </div>

              {m.status !== "APPROVED" && (
                <button
                  onClick={() => handleApproveMilestone(m.id)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Milestone</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Factor Rubric Reviews */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 font-serif">
          Expert & Industry Mentor Rubric Reviews ({reviews.length})
        </h3>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((r: any) => (
            <div key={r.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900">{r.reviewer.name}</span>
                  <span className="text-[11px] text-slate-500 ml-1.5">
                    ({r.role} &bull; {r.reviewer.organization})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{r.rating.toFixed(1)} / 5.0</span>
                </div>
              </div>

              {/* Rubric Score Bars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Feasibility</span>
                  <strong className="text-slate-800">{r.feasibilityScore} / 5</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Impact</span>
                  <strong className="text-slate-800">{r.impactScore} / 5</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Cost-Efficiency</span>
                  <strong className="text-slate-800">{r.costEffectiveness} / 5</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">Scalability</span>
                  <strong className="text-slate-800">{r.scalabilityScore} / 5</strong>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed pt-1">&ldquo;{r.feedback}&rdquo;</p>
            </div>
          ))}
        </div>

        {/* Add Mentor Review Form */}
        <form onSubmit={handleSubmitReview} className="pt-6 border-t border-slate-100 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Submit Expert / Industry Review
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Feasibility (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={feasibility}
                onChange={(e) => setFeasibility(parseFloat(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Impact (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={impact}
                onChange={(e) => setImpact(parseFloat(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Cost (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Scalability (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={scalability}
                onChange={(e) => setScalability(parseFloat(e.target.value))}
                className="w-full p-2 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <textarea
              rows={3}
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide technical appraisal, recommendations, or co-funding commitments..."
              className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingReview}
              className="px-4 py-2 bg-gov-navy hover:bg-gov-navyLight text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingReview ? "Submitting..." : "Submit Technical Review"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
