import React from "react";
import Link from "next/link";
import {
  Building2,
  Award,
  Sparkles,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import db from "@/lib/db";
import { IndustryPortalClient } from "./industry-portal-client";
import { PagePop, PopItem } from "@/components/page-pop-transition";

export const dynamic = "force-dynamic";

export default async function IndustryPortalPage() {
  let vettedChallenges: any[] = [];
  let industryUsers: any[] = [];

  try {
    vettedChallenges = await db.challenge.findMany({
      where: { status: { in: ["VERIFIED", "ASSIGNED", "IN_PROGRESS"] } },
      include: {
        solutions: {
          include: {
            author: true,
            milestones: true,
          },
        },
      },
      take: 8,
    });

    industryUsers = await db.user.findMany({
      where: { role: "INDUSTRY" },
    });
  } catch (err) {
    console.warn("Database query failed in IndustryPortalPage, using fallback:", err);
  }

  return (
    <PagePop className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner */}
        <PopItem delay={0.05} className="bg-gradient-to-r from-purple-950 via-slate-900 to-gov-navy text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 mb-2">
            <Building2 className="w-4 h-4 text-purple-300" />
            <span>Corporate Social Responsibility (CSR) & Engineering Mentorship</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
            Industry CSR Collaboration Portal
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Co-sponsor university disaster mitigation pilots under Section 135 CSR mandates. Monitor milestone stage gates and verify real-world community impact.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total CSR Pledged</div>
              <div className="text-2xl font-extrabold text-amber-300">₹4.85 Cr</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Active Patrons</div>
              <div className="text-2xl font-extrabold text-white">4 Corporate Trusts</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Sponsored Pilots</div>
              <div className="text-2xl font-extrabold text-emerald-400">12 Deployments</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Tax Deductibility</div>
              <div className="text-2xl font-extrabold text-blue-300">100% 80G</div>
            </div>
          </div>
        </PopItem>

        {/* Client Interactions */}
        <IndustryPortalClient vettedChallenges={vettedChallenges} industryUsers={industryUsers} />
      </div>
    </PagePop>
  );
}
