"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, LogIn, Lock, AlertTriangle, CheckCircle2, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sound } from "@/lib/sound";

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const isExpired = searchParams.get("expired") === "1";
  const isUnauthorized = searchParams.get("unauthorized") === "1";
  const currentRole = searchParams.get("currentRole");

  const [email, setEmail] = useState("admin@demo.in");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQuickAdminDemo = async () => {
    setEmail("admin@demo.in");
    setPassword("Admin@123");
    sound.playClick();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@demo.in", password: "Admin@123" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      sound.playCelebration();
      router.push(from && from !== "/login" ? from : "/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      sound.playAlert();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      // Verify the logged-in user actually has ADMIN role
      if (data.user.role !== "ADMIN") {
        throw new Error(`Access denied: Your account has role '${data.user.role}'. Government Authority (ADMIN) credentials required.`);
      }

      sound.playCelebration();
      router.push(from && from !== "/login" ? from : "/admin");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      sound.playAlert();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl shadow-2xl overflow-hidden border border-slate-700"
      >
        {/* Left — Security Identity Panel */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white flex flex-col justify-between border-r border-slate-700"
        >
          <div>
            {/* Restricted badge */}
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-bold text-red-400 tracking-widest uppercase font-mono">
                Restricted Government Access
              </span>
            </div>

            <motion.div
              whileHover={{ rotate: 8, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-5"
            >
              <ShieldAlert className="w-7 h-7 text-amber-400" />
            </motion.div>

            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400 mb-2">
              Government Authority Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif mb-3 leading-tight">
              State Disaster Management Command Center
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Exclusive access for empaneled State Nodal Officers, District Magistrates, and designated IAS officers under the Disaster Management Act 2005.
            </p>

            {/* Clearance info */}
            <div className="space-y-2 mb-6">
              {[
                "Verify & certify ground challenges",
                "Assign challenges to research institutes",
                "Merge duplicate challenge records",
                "View full audit trail & logs",
              ].map((item, idx) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.08 }}
                  className="flex items-center gap-2 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-300">{item}</span>
                </motion.div>
              ))}
            </div>

            {/* Legal notice */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-slate-400 leading-relaxed"
            >
              <div className="flex items-center gap-1.5 text-red-400 font-bold text-[10px] uppercase mb-1">
                <Lock className="w-3 h-3" /> Statutory Notice
              </div>
              Unauthorized access to this system is an offence under Section 43 &amp; 66 of the
              Information Technology Act, 2000 and the Disaster Management Act, 2005.
            </motion.div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-700 text-[10px] text-slate-500 font-mono">
            <span>NIC / CERT-In v4.2</span>
            <span>·</span>
            <span>Govt. of Jharkhand SDMA</span>
          </div>
        </motion.div>

        {/* Right — Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="bg-slate-950 p-8 flex flex-col justify-center"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Official Sign In</h2>
          </div>
          <p className="text-xs text-slate-500 mb-5">Enter your official government credentials to authenticate.</p>

          {/* Clearance required / session context */}
          <AnimatePresence>
            {isExpired && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="p-3 rounded-xl bg-orange-950/40 border border-orange-700/40 text-orange-300 text-xs mb-4 flex items-center gap-2 overflow-hidden"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" /> Session expired. Please re-authenticate with your credentials.
              </motion.div>
            )}
            {isUnauthorized && currentRole && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="p-3 rounded-xl bg-red-950/40 border border-red-700/40 text-red-300 text-xs mb-4 flex items-center gap-2 overflow-hidden"
              >
                <Lock className="w-4 h-4 shrink-0" />
                Your account role ({currentRole}) does not have ADMIN clearance.
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="p-3 rounded-xl bg-red-950/40 border border-red-700/40 text-red-300 text-xs font-semibold mb-4 flex items-center gap-2 overflow-hidden"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Official Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@jharkhand.gov.in"
                className="w-full text-sm p-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-amber-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-400">Password</label>
                <span className="text-[10px] text-amber-600 font-mono">Demo: Admin@123</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm p-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-amber-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Verifying Official Credentials..." : "Sign In as Government Authority"}
            </motion.button>

            <button
              type="button"
              disabled={loading}
              onClick={handleQuickAdminDemo}
              className="w-full py-2.5 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-300" />
              <span>⚡ 1-Click SIH Judge Demo Access (admin@demo.in)</span>
            </button>
          </form>

          {/* No self-registration for admin */}
          <div className="mt-6 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-500 text-center">
            Government Authority accounts are provisioned by the SDMA IT Cell.
            Contact <span className="text-amber-500">sdma-it@jharkhand.gov.in</span> for access.
          </div>

          <div className="text-center mt-4">
            <Link href="/login" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              ← Return to portal selection
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense><AdminLoginInner /></Suspense>;
}
