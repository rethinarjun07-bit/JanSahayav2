import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, FileCheck } from "lucide-react";
import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AuthorizedAuthorityGuard } from "@/components/authorized-authority-guard";
import { VerificationClient } from "./verification-client";
import { DEMO_CHALLENGES, DEMO_UNIVERSITIES } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function VerifyChallengePage({ params }: Props) {
  const currentUser = await getCurrentUser();
  const { id } = params;

  let challenge: any = null;
  let universities: any[] = [];

  try {
    challenge = await db.challenge.findUnique({
      where: { id },
      include: {
        createdBy: true,
      },
    });
    universities = await db.university.findMany();
  } catch (err) {
    challenge = DEMO_CHALLENGES.find((c) => c.id === id) || DEMO_CHALLENGES[0];
    universities = DEMO_UNIVERSITIES;
  }

  if (!challenge) {
    challenge = DEMO_CHALLENGES.find((c) => c.id === id) || DEMO_CHALLENGES[0];
  }

  if (!universities || universities.length === 0) {
    universities = DEMO_UNIVERSITIES;
  }

  return (
    <AuthorizedAuthorityGuard
      currentRole={currentUser?.role}
      resourceName="Statutory Challenge Verification & Certification Desk"
    >
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-navy transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Triage Command Center
            </Link>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Differentiator #5: Government-Aided Verification
            </span>
          </div>

          <VerificationClient challenge={challenge} universities={universities} />
        </div>
      </div>
    </AuthorizedAuthorityGuard>
  );
}
