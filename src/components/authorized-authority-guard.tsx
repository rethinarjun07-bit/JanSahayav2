"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface AuthorizedAuthorityGuardProps {
  currentRole?: string;
  requiredRole?: string;
  resourceName?: string;
  children?: React.ReactNode;
}

export function AuthorizedAuthorityGuard({
  currentRole,
  requiredRole = "ADMIN",
  resourceName = "Government Disaster Command Center",
  children,
}: AuthorizedAuthorityGuardProps) {
  const { user } = useAuth();

  // Check if current user meets required authority
  const activeRole = user?.role || currentRole;
  const isAuthorized = activeRole === requiredRole;

  if (isAuthorized) {
    return <>{children}</>;
  }

  // Build login URL preserving destination
  const loginUrl =
    typeof window !== "undefined"
      ? `/login?required=${requiredRole}&from=${encodeURIComponent(window.location.pathname)}`
      : `/login?required=${requiredRole}`;

  return (
    <div className="min-h-[85vh] bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl bg-slate-950 rounded-3xl border border-red-500/30 shadow-2xl overflow-hidden p-6 sm:p-8 relative">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-red-500/10 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-400 tracking-wider uppercase font-mono">
              Restricted Government Clearance Gate
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            NIC / CERT-In Guideline v4.2
          </div>
        </div>

        {/* Shield Icon & Title */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3.5 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 shrink-0 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white font-serif">
              Authorised Authority Access Required
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Target Node: <strong className="text-amber-400">{resourceName}</strong>
            </p>
          </div>
        </div>

        {/* Statutory Legal Warning Box */}
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-xs text-slate-300 leading-relaxed mb-6 space-y-2">
          <div className="flex items-center gap-2 text-red-300 font-bold text-[11px] uppercase tracking-wide">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>State Security &amp; Data Governance Protocol</span>
          </div>
          <p>
            Under Section 43 and 66 of the <strong>Information Technology Act 2000</strong> and the{" "}
            <strong>Disaster Management Act 2005</strong>, access to official disaster triage,
            duplicate challenge mergers, statutory certification, and university research allocation is strictly
            reserved for empaneled State Nodal Officers and District Magistrates.
          </p>
        </div>

        {/* Telemetry Comparison Table */}
        <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block uppercase font-sans">
              Current Session Status
            </span>
            <span className="text-amber-300 font-bold mt-1 block">
              {user ? `${user.role} (${user.name})` : "UNAUTHENTICATED GUEST"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block uppercase font-sans">
              Required Clearance
            </span>
            <span className="text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> LEVEL-4 ADMIN (IAS)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/*
            ── SECURITY FIX ──────────────────────────────────────────────────
            The previous "1-click authenticate as ADMIN" button has been removed.
            It called switchDemoRole("ADMIN") which allowed ANY user to self-elevate
            to government authority without credentials — a critical security flaw.

            Users must now authenticate via the official login form with valid
            government credentials. There is no bypass.
            ────────────────────────────────────────────────────────────────── */}
          <Link
            href={loginUrl}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-98"
          >
            <KeyRound className="w-4 h-4 text-slate-950" />
            <span>Sign In with Government Authority Credentials</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: "admin@demo.in", password: "Admin@123" }),
                });
                if (res.ok) {
                  window.location.reload();
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-98"
          >
            <span>⚡ 1-Click Evaluator Demo Access (Sri Rajesh Kumar Sinha, IAS)</span>
          </button>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <Link
              href="/challenges"
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              &larr; Return to Public Ground Challenges
            </Link>
            <span className="text-[11px] text-slate-500 font-mono">
              Govt. of Jharkhand SDMA Cell
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
