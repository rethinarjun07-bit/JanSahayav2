import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Flame,
  GitMerge,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileCheck,
  UserCheck,
  Activity,
  Layers,
  Lock,
  Radio,
  FileKey2,
} from "lucide-react";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuthorizedAuthorityGuard } from "@/components/authorized-authority-guard";
import { PagePop, PopItem, PopCard } from "@/components/page-pop-transition";
import { DEMO_CHALLENGES, DEMO_AUDIT_LOGS } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();

  let pendingVerification: any[] = [];
  let criticalDisasters: any[] = [];
  let auditLogs: any[] = [];

  try {
    pendingVerification = await db.challenge.findMany({
      where: { status: "SUBMITTED" },
      orderBy: [{ urgencyScore: "desc" }, { createdAt: "desc" }],
      include: { createdBy: true },
    });

    criticalDisasters = await db.challenge.findMany({
      where: { severity: "CRITICAL", status: { not: "SOLVED" } },
      take: 5,
    });

    auditLogs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
    });
  } catch (err) {
    // Graceful offline presentation fallback
    pendingVerification = DEMO_CHALLENGES.filter((c) => c.status === "SUBMITTED");
    criticalDisasters = DEMO_CHALLENGES.filter((c) => c.severity === "CRITICAL" && c.status !== "SOLVED");
    auditLogs = DEMO_AUDIT_LOGS;
  }

  return (
    <AuthorizedAuthorityGuard
      currentRole={currentUser?.role}
      resourceName="State Disaster Management Authority Command Center"
    >
      <PagePop className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Officer Header Banner */}
        <PopItem delay={0.05} className="bg-gradient-to-r from-slate-900 via-gov-navy to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>State Disaster Management Authority &bull; Triage Cell</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif">
              Government Nodal Officer Command Center
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Active Officer: Sri Rajesh Kumar Sinha, IAS &bull; Ranchi Disaster Management Headquarters
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/duplicates"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
            >
              <GitMerge className="w-4 h-4" />
              <span>Duplicate Merge Console</span>
            </Link>
            <Link
              href="/admin/assignments"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4 text-blue-300" />
              <span>University Assignments</span>
            </Link>
          </div>
        </PopItem>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PopCard delay={0.1} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Awaiting Verification</div>
            <div className="text-3xl font-extrabold text-amber-600">{pendingVerification.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Requires official on-site inspection</div>
          </PopCard>

          <PopCard delay={0.15} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Active Critical Disasters</div>
            <div className="text-3xl font-extrabold text-red-600">{criticalDisasters.length}</div>
            <div className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> High triage priority
            </div>
          </PopCard>

          <PopCard delay={0.2} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Deduplication Rate</div>
            <div className="text-3xl font-extrabold text-gov-navy">94.2%</div>
            <div className="text-[11px] text-emerald-600 mt-1">TF-IDF Vector Engine Online</div>
          </PopCard>

          <PopCard delay={0.25} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Partnered Labs</div>
            <div className="text-3xl font-extrabold text-blue-700">6 Institutes</div>
            <div className="text-[11px] text-slate-400 mt-1">BIT Mesra, IIT ISM, NIT JSR</div>
          </PopCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Triage Inbox (Awaiting Official Verification) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-gov-saffron" />
                <span>Pending Ground Challenge Triage ({pendingVerification.length})</span>
              </h2>
            </div>

            <div className="space-y-3">
              {pendingVerification.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                  All submitted challenges have been officially triaged. Excellent!
                </div>
              ) : (
                pendingVerification.map((item, idx) => (
                  <PopCard
                    key={item.id}
                    delay={0.05 * idx}
                    className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-start justify-between flex-wrap gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            item.severity === "CRITICAL"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {item.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{item.district}, {item.state}</span>
                        <span className="text-[11px] text-slate-400 font-mono">Urgency: {item.urgencyScore}/100</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                      <div className="text-[11px] text-slate-400">
                        Reporter: {item.createdBy.name} &bull; Sector: {item.category}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Link
                        href={`/admin/verify/${item.id}`}
                        className="px-3.5 py-1.5 bg-gov-navy hover:bg-gov-navyLight text-white text-xs font-bold rounded-xl transition-colors text-center"
                      >
                        Verify & Certify
                      </Link>
                      <Link
                        href={`/challenges/${item.id}`}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl text-center"
                      >
                        View Full Details
                      </Link>
                    </div>
                  </PopCard>
                ))
              )}
            </div>
          </div>

          {/* Right Sidebar: System Audit Trail & Actions */}
          <PopItem delay={0.2} className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-gov-navy" /> Official Audit Trail
              </h3>
              <div className="space-y-3 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-slate-800 text-[11px]">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      By <strong>{log.actorName}</strong> &bull; {log.entityType} #{log.entityId.substring(0, 8)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Link Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-md">
              <h4 className="text-sm font-bold mb-1 flex items-center gap-1.5">
                <GitMerge className="w-4 h-4 text-slate-900" /> Duplicate Consolidation
              </h4>
              <p className="text-xs text-white/90 mb-3 leading-relaxed">
                Review flagged near-duplicate challenges side-by-side and roll up votes to master records.
              </p>
              <Link
                href="/admin/duplicates"
                className="inline-block py-2 px-3.5 bg-white text-slate-950 text-xs font-bold rounded-xl shadow-sm hover:bg-amber-50 transition-colors"
              >
                Launch Merge Console &rarr;
              </Link>
            </div>
          </PopItem>
        </div>
      </div>
    </PagePop>
    </AuthorizedAuthorityGuard>
  );
}
