import React from "react";
import Link from "next/link";
import { ShieldAlert, GitMerge, ArrowLeft, CheckCircle2, Sparkles, Layers } from "lucide-react";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuthorizedAuthorityGuard } from "@/components/authorized-authority-guard";
import { DuplicateMergeClient } from "./duplicate-merge-client";
import { PagePop, PopItem } from "@/components/page-pop-transition";
import { DEMO_CHALLENGES, DEMO_DUPLICATE_MERGES } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function DuplicateConsolePage() {
  const currentUser = await getCurrentUser();

  let challenges: any[] = [];
  let mergeHistory: any[] = [];

  try {
    challenges = await db.challenge.findMany({
      where: { status: { not: "MERGED" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        severity: true,
        district: true,
        state: true,
        status: true,
        urgencyScore: true,
        createdAt: true,
      },
    });

    mergeHistory = await db.duplicateMerge.findMany({
      orderBy: { mergedAt: "desc" },
      take: 5,
    });
  } catch (err) {
    challenges = DEMO_CHALLENGES.filter((c) => c.status !== "MERGED");
    mergeHistory = DEMO_DUPLICATE_MERGES;
  }

  return (
    <AuthorizedAuthorityGuard
      currentRole={currentUser?.role}
      resourceName="Authorised Duplicate Merge & Deconfliction Console"
    >
      <PagePop className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <PopItem delay={0.05} className="flex items-center justify-between">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-navy transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Govt Command Center
            </Link>
            <span className="text-xs font-bold text-gov-saffron bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
              Differentiator #1: NLP Duplicate Resolution Engine
            </span>
          </PopItem>

          <PopItem delay={0.1} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2 font-serif text-slate-900 text-2xl font-bold">
              <GitMerge className="w-7 h-7 text-gov-saffron" />
              <span>Intelligent Duplicate Detection & Merge Console</span>
            </div>
            <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
              Consolidate duplicate reports to eliminate administrative fragmentation, pool community upvotes, and provide researchers with an aggregated dossier of ground evidence.
            </p>
          </PopItem>

          <DuplicateMergeClient challenges={challenges} mergeHistory={mergeHistory} />
        </div>
      </PagePop>
    </AuthorizedAuthorityGuard>
  );
}
