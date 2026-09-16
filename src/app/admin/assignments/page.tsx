import React from "react";
import Link from "next/link";
import { ArrowLeft, Building2, ShieldAlert, Sparkles, CheckCircle2, UserCheck, Send } from "lucide-react";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuthorizedAuthorityGuard } from "@/components/authorized-authority-guard";
import { UniversityAssignmentClient } from "./university-assignment-client";
import { DEMO_CHALLENGES, DEMO_UNIVERSITIES } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function UniversityAssignmentsPage() {
  const currentUser = await getCurrentUser();

  let challenges: any[] = [];
  let universities: any[] = [];

  try {
    challenges = await db.challenge.findMany({
      where: { status: { in: ["SUBMITTED", "VERIFIED", "ASSIGNED"] } },
      orderBy: [{ urgencyScore: "desc" }, { createdAt: "desc" }],
      include: { createdBy: true },
    });

    universities = await db.university.findMany();
  } catch (err) {
    challenges = DEMO_CHALLENGES.filter((c) => ["SUBMITTED", "VERIFIED", "ASSIGNED"].includes(c.status));
    universities = DEMO_UNIVERSITIES;
  }

  return (
    <AuthorizedAuthorityGuard
      currentRole={currentUser?.role}
      resourceName="University Research Allocation & Dispatch Desk"
    >
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-navy transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Govt Command Center
          </Link>
          <span className="text-xs font-bold text-gov-navy bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Differentiator #9: University Assignment System
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2 font-serif text-slate-900 text-2xl font-bold">
            <Building2 className="w-7 h-7 text-gov-navy" />
            <span>Premier University & Research Lab Assignment Console</span>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
            Directly allocate vetted disaster and societal challenges to state and national centers of excellence (BIT Mesra, IIT ISM Dhanbad, NIT Jamshedpur, Birsa Agricultural University).
          </p>
        </div>

        <UniversityAssignmentClient
          challenges={challenges}
          universities={universities.map((u) => ({
            ...u,
            departments: JSON.parse(u.departments || "[]"),
            expertiseTags: JSON.parse(u.expertiseTags || "[]"),
          }))}
        />
      </div>
    </div>
    </AuthorizedAuthorityGuard>
  );
}
