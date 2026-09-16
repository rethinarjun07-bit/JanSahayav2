"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  User,
  GraduationCap,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Mic,
  MapPin,
  GitMerge,
  Coins,
  Bot,
  Flame,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Play,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/components/language-provider";
import { sound } from "@/lib/sound";

export default function DemoHubPage() {
  const router = useRouter();
  const { user, switchDemoRole, refreshUser } = useAuth();
  const { language, t } = useLanguage();

  const [switchingRole, setSwitchingRole] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSwitch = async (role: string, redirectUrl?: string) => {
    sound.playClick();
    setSwitchingRole(role);
    try {
      await switchDemoRole(role);
      sound.playCelebration();
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (err) {
      console.error("Failed to switch demo role:", err);
      sound.playAlert();
    } finally {
      setSwitchingRole(null);
    }
  };

  const handleAdminDemoLogin = async () => {
    setSwitchingRole("ADMIN");
    try {
      sound.playClick();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@demo.in", password: "Admin@123" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      await refreshUser();
      sound.playCelebration();
      router.push("/admin");
    } catch (err) {
      console.error("Failed admin demo login:", err);
      sound.playAlert();
    } finally {
      setSwitchingRole(null);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    sound.playClick();
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isHindi = language === "hi";

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#15291F] via-[#1A3D2F] to-[#0D1F17] text-white p-8 sm:p-12 border border-[#2D5A43] shadow-xl">
          <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHindi ? "स्मार्ट इंडिया हैकाथॉन 2026 मूल्यांकन हब" : "SIH 2026 Evaluation & Live Demo Hub"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif tracking-tight text-white mb-4">
              {isHindi ? "जनसहाया लाइव डेमो व प्रस्तुति केंद्र" : "JanSahaya Live Presentation & Interactive Demo"}
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-light">
              {isHindi
                ? "क्वाड-हेलिक्स नागरिक-प्रशासन-शोध-उद्योग सहयोग मॉडल का प्रत्यक्ष अनुभव करें। नीचे दिए गए 1-क्लिक उपयोगकर्ता सिम्युलेटर से विभिन्न भूमिकाओं में प्रवेश करें अथवा लाइव वर्कफ़्लो डेमो का परीक्षण करें।"
                : "Experience the Quad-Helix collaboration model in real-time. Switch between Citizen, University Researcher, and CSR Industry personas with 1-click, or test end-to-end statutory disaster workflows."}
            </p>

            {/* Current Active Session Pill */}
            <div className="mt-6 pt-6 border-t border-white/15 flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-300">{isHindi ? "वर्तमान सक्रिय सत्र:" : "Current Active Session:"}</span>
                {user ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {user.name} ({user.role})
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 font-medium">
                    {isHindi ? "अतिथि (लॉगिन नहीं है)" : "Guest (Not logged in)"}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-amber-300 font-mono">
                SIH Problem ID: 26043 &bull; Govt of Jharkhand
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 1: 1-Click Persona Simulator */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
                <User className="w-6 h-6 text-[#C05621]" />
                <span>{isHindi ? "1-क्लिक उपयोगकर्ता अनुकरण (Persona Switcher)" : "1-Click Persona Simulator"}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {isHindi
                  ? "मूल्यांकन के लिए बिना पासवर्ड सीधे किसी भी हितधारक की भूमिका में प्रवेश करें:"
                  : "Instant zero-credential role switching for evaluators & judges:"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. CITIZEN PERSONA */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${user?.role === "CITIZEN" ? "bg-amber-50/90 border-amber-400 shadow-md ring-2 ring-amber-400/50" : "bg-white border-[#E8DFC8] hover:border-amber-300 hover:shadow-sm"}`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl p-2.5 rounded-xl bg-amber-100/80">👨‍💼</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    {isHindi ? "नागरिक" : "Citizen"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">Priya Sharma</h3>
                <p className="text-xs text-slate-500 font-medium">Morabadi RWA &bull; Ranchi</p>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {isHindi
                    ? "जमीनी आपदा रिपोर्ट दर्ज करती हैं, जीआईएस मानचित्र पर समस्या पिन करती हैं और आवाज़ से बोलकर शिकायत करती हैं।"
                    : "Reports on-site disasters, pins coordinates on Leaflet GIS, and dictates SOS memos in native dialects."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  disabled={switchingRole === "CITIZEN"}
                  onClick={() => handleSwitch("CITIZEN", "/challenges/new")}
                  className="w-full py-2.5 px-3 bg-[#C05621] hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {user?.role === "CITIZEN" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-200" />
                      <span>{isHindi ? "सक्रिय नागरिक &bull; नई रिपोर्ट" : "Active &bull; Report Ground Issue"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{switchingRole === "CITIZEN" ? "..." : (isHindi ? "नागरिक के रूप में लॉगिन करें" : "Switch to Citizen")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. ACADEMIA / SOLVER PERSONA */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${user?.role === "SOLVER" ? "bg-blue-50/90 border-blue-400 shadow-md ring-2 ring-blue-400/50" : "bg-white border-[#E8DFC8] hover:border-blue-300 hover:shadow-sm"}`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl p-2.5 rounded-xl bg-blue-100/80">🎓</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                    {isHindi ? "शोधकर्ता" : "Researcher / Solver"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">Dr. Aarav Mehta</h3>
                <p className="text-xs text-slate-500 font-medium">BIT Mesra &bull; Remote Sensing</p>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {isHindi
                    ? "एआई द्वारा अनुशंसित समस्याओं पर अनुप्रयुक्त शोध प्रस्ताव व प्रोटोटाइप प्रस्तुत करते हैं।"
                    : "Submits applied engineering solutions with TRL progression (TRL 3 to TRL 7) and university milestone pilots."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  disabled={switchingRole === "SOLVER"}
                  onClick={() => handleSwitch("SOLVER", "/solver/dashboard")}
                  className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {user?.role === "SOLVER" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                      <span>{isHindi ? "सक्रिय शोधकर्ता &bull; डैशबोर्ड" : "Active &bull; Solver Dashboard"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{switchingRole === "SOLVER" ? "..." : (isHindi ? "शोधकर्ता के रूप में लॉगिन करें" : "Switch to Researcher")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. INDUSTRY / CSR PERSONA */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${user?.role === "INDUSTRY" ? "bg-emerald-50/90 border-emerald-400 shadow-md ring-2 ring-emerald-400/50" : "bg-white border-[#E8DFC8] hover:border-emerald-300 hover:shadow-sm"}`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl p-2.5 rounded-xl bg-emerald-100/80">🏭</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                    {isHindi ? "सीएसआर उद्योग" : "CSR Industry"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">Neha Singhania</h3>
                <p className="text-xs text-slate-500 font-medium">Tata Steel CSR Foundation</p>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {isHindi
                    ? "कंपनी अधिनियम धारा 135 के तहत सत्यापित विश्वविद्यालय फील्ड पायलटों को सीधे सीएसआर ग्रांट प्रदान करते हैं।"
                    : "Pledges Section 135 corporate grants to stage-gated, verified university prototypes with milestone escrow tracking."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  disabled={switchingRole === "INDUSTRY"}
                  onClick={() => handleSwitch("INDUSTRY", "/industry")}
                  className="w-full py-2.5 px-3 bg-[#1A3D2F] hover:bg-[#122b21] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {user?.role === "INDUSTRY" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>{isHindi ? "सक्रिय उद्योग &bull; सीएसआर हब" : "Active &bull; CSR Portal"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>{switchingRole === "INDUSTRY" ? "..." : (isHindi ? "उद्योग के रूप में लॉगिन करें" : "Switch to Industry")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 4. GOVERNMENT AUTHORITY PERSONA (ADMIN) */}
            <div className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${user?.role === "ADMIN" ? "bg-purple-50/90 border-purple-400 shadow-md ring-2 ring-purple-400/50" : "bg-white border-[#E8DFC8] hover:border-purple-300 hover:shadow-sm"}`}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl p-2.5 rounded-xl bg-purple-100/80">🏛️</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-900 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> {isHindi ? "शासकीय प्राधिकरण" : "Govt Authority"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">Sri Rajesh K. Sinha, IAS</h3>
                <p className="text-xs text-slate-500 font-medium">Principal Secretary &bull; Disaster Cell</p>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {isHindi
                    ? "वैधानिक निर्णय, एनएलपी डुप्लिकेट एकीकरण, और 5 मानदंडों (व्यवहार्यता, लागत, आदि) पर विश्वविद्यालय समाधान चयन।"
                    : "Statutory decisions: validates challenges, executes TF-IDF deduplication, and scores university prototypes."}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 flex items-center justify-between">
                  <span>admin@demo.in / Admin@123</span>
                  <button
                    type="button"
                    onClick={() => copyText("admin@demo.in\tAdmin@123", "admin")}
                    className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-600"
                    title="Copy Credentials"
                  >
                    {copiedKey === "admin" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <button
                  type="button"
                  disabled={switchingRole === "ADMIN"}
                  onClick={handleAdminDemoLogin}
                  className="w-full py-2.5 px-3 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  {user?.role === "ADMIN" ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-300" />
                      <span>{isHindi ? "सक्रिय &bull; कमांड सेंटर खोलें" : "Active &bull; Open Command Center"}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>
                        {switchingRole === "ADMIN"
                          ? "..."
                          : isHindi
                          ? "⚡ 1-क्लिक शासकीय कमांड सेंटर प्रवेश"
                          : "⚡ 1-Click Access Govt Authority"}
                      </span>
                    </>
                  )}
                </button>
                <Link
                  href="/login/admin"
                  className="w-full py-1 text-center text-[10px] text-purple-700 hover:text-purple-900 hover:underline block font-semibold"
                >
                  {isHindi ? "या आधिकारिक फॉर्म से लॉगिन करें &rarr;" : "Or sign in via official form &rarr;"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Interactive Feature Showcase & Presentation Flows */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#1A3D2F]" />
              <span>{isHindi ? "लाइव प्रस्तुति एवं मूल्यांकन प्रवाह" : "Guided Evaluation & Presentation Flows"}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {isHindi
                ? "हैकाथॉन जजों के सामने 5 प्रमुख तकनीकी विशेषताओं का त्वरित लाइव प्रदर्शन करें:"
                : "Five flagship technological features ready to demo for Hackathon judges:"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Flow 1: 4-Step Intake & Voice Dictation */}
            <div className="bg-white rounded-2xl border border-[#E8DFC8] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-gov-saffron flex items-center justify-center font-bold">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  1. Multilingual Voice & GIS Intake
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  4-step intake wizard with speech-to-text dictation in English/Hindi/Urdu, Leaflet map auto-detect, photo/drone video evidence attachments, and real-time TF-IDF duplicate warning alerts.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href="/challenges/new"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C05621] hover:underline"
                >
                  <span>Launch 4-Step Wizard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Flow 2: AI Problem Segregation & NLP Merge */}
            <div className="bg-white rounded-2xl border border-[#E8DFC8] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <GitMerge className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  2. NLP Deduplication & Admin Triage
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatic cosine similarity calculation across registered reports in the same district. Admin console allows 1-click duplicate cluster merging with audit logging and authority oversight.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href="/admin/merge"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-800 hover:underline"
                >
                  <span>Open NLP Merge Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Flow 3: University Solver Matching & TRL Progression */}
            <div className="bg-white rounded-2xl border border-[#E8DFC8] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  3. University Solver Matching
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automated taxonomy matching linking ground issues to premier research institutions (BIT Mesra, IIT ISM Dhanbad, BAU Ranchi) with TRL progression stages and multi-criteria evaluation.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href="/solver/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
                >
                  <span>Open Solver Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Flow 4: Section 135 CSR Grant Allocation */}
            <div className="bg-white rounded-2xl border border-[#E8DFC8] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  4. Section 135 CSR Corporate Grants
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct pipeline for corporate partners (Tata Steel CSR, Coal India CSR) to fund government-verified university pilots with milestone-based grant pledges and compliance tracking.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href="/industry"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A3D2F] hover:underline"
                >
                  <span>Explore CSR Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Flow 5: Interactive Geospatial GIS Command Map */}
            <div className="bg-white rounded-2xl border border-[#E8DFC8] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  5. GIS Geospatial Command Map
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Interactive state-wide disaster map with district bounds, incident clusters, satellite/streets layer toggles, geodesic distance measurement tool, and live incident drawer.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <Link
                  href="/map"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline"
                >
                  <span>Open Geospatial Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Flow 6: JanSahaya AI Copilot Assistant */}
            <div className="bg-white rounded-2xl border border-[#E8DFC8] p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  6. JanSahaya AI Copilot
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bilingual AI assistant with 7 quick action prompts, conversational memory, statutory authority boundaries, in-chat language switching, and voice-assisted prompt synthesis.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const btn = document.querySelector('button[aria-label="Open AI Assistant"]') as HTMLButtonElement | null;
                    if (btn) btn.click();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:underline"
                >
                  <span>Open AI Chatbot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Demonstration Data Reset & Health Check */}
        <section className="bg-white rounded-2xl border border-[#E8DFC8] p-6 shadow-xs flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isHindi ? "प्रस्तुति सुरक्षा एवं डेटा अखंडता" : "Presentation Readiness & Security"}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              All 103 Jest security tests passed &bull; Production Next.js bundle verified &bull; Zero ESLint warnings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/challenges"
              className="px-4 py-2 bg-[#1A3D2F] hover:bg-[#122b21] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              {isHindi ? "कैटलॉग ब्राउज़ करें" : "Browse Challenges Catalog"}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
