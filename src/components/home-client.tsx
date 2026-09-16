"use client";

import React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ShieldAlert,
  Flame,
  Zap,
  Building2,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Sparkles,
  Mic,
  Search,
  Landmark,
  GraduationCap,
  Users,
  Compass,
  FileCheck2,
  TrendingUp,
  HeartHandshake,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "./language-provider";
import { PagePop, PopItem, PopCard } from "@/components/page-pop-transition";
import { AnimatedCounter } from "@/components/animated-counter";
import { QuadHelix } from "@/components/quad-helix";
import { ProblemIntelligenceCard } from "@/components/problem-intelligence-card";

interface FeaturedChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  district: string;
  state: string;
  aiTags: string | null;
  _count: {
    solutions: number;
    upvotes: number;
  };
}

interface HomeClientProps {
  totalChallenges: number;
  totalSolutions: number;
  totalSolvers: number;
  criticalCount: number;
  featuredChallenges: FeaturedChallenge[];
}

export function HomeClient({
  totalChallenges,
  totalSolutions,
  totalSolvers,
  criticalCount,
  featuredChallenges,
}: HomeClientProps) {
  const { t, language } = useLanguage();

  // Localized live ticker
  const tickerText =
    language === "hi"
      ? "🚨 रांची में मानसून जल निकासी निगरानी • झरिया में भूमिगत कोयला आग गैस टेलीमेट्री सक्रिय • पलामू फ्लोराइड जल शोधन पायलट स्वीकृत • साहिबगंज में गंगा नदी तट कटाव सर्वेक्षण • राज्य आपदा नियंत्रण कक्ष: 1070"
      : language === "ur"
      ? "🚨 رانچی میں مون سون نکاسی آب کی نگرانی • جھریا میں زیر زمین کوئلے کی آگ کی مانیٹرنگ • پلامو فلورائیڈ پانی صاف کرنے کا پائلٹ منظور • صاحب گنج میں کٹاؤ کا سروے • ہنگامی ہیلپ لائن: 1070"
      : "🚨 Ranchi Monsoon Urban Drainage Telemetry Active • Jharia Subterranean Coal Fire Gas Mitigation Pilot • Palamu Fluoride Water Purification Sanctioned • Sahibganj Ganga Riverbank Soil Erosion Survey • State Disaster Control Room: 1070";

  // Problem lifecycle steps
  const lifecycleSteps = [
    { num: "01", name: t("stepProblem"), desc: t("stepProblemDesc"), role: t("helixCitizenTitle") },
    { num: "02", name: t("stepUnderstand"), desc: t("stepUnderstandDesc"), role: "JanSahaya AI" },
    { num: "03", name: t("stepVerify"), desc: t("stepVerifyDesc"), role: t("helixGovtTitle") },
    { num: "04", name: t("stepMatch"), desc: t("stepMatchDesc"), role: "AI & Govt" },
    { num: "05", name: t("stepSolve"), desc: t("stepSolveDesc"), role: t("helixAcademiaTitle") },
    { num: "06", name: t("stepFund"), desc: t("stepFundDesc"), role: t("helixIndustryTitle") },
    { num: "07", name: t("stepImplement"), desc: t("stepImplementDesc"), role: "Multi-Party" },
    { num: "08", name: t("stepImpact"), desc: t("stepImpactDesc"), role: "Community" },
  ];

  return (
    <PagePop className="flex flex-col min-h-screen bg-[#FAF7F2]">
      {/* 1. Emergency Live Alert Ticker */}
      <PopItem delay={0.05} className="bg-[#EFE8DF] text-slate-900 font-semibold text-xs py-2 px-4 border-b border-[#E0D5C3]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C05621] animate-ping" />
            <span className="uppercase tracking-wider font-extrabold text-[11px] bg-[#C05621] text-white px-2 py-0.5 rounded">
              {language === "hi" ? "आपदा सतर्कता" : language === "ur" ? "اعلیٰ الرٹ" : "Civic Notice"}
            </span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-xs font-medium flex-1 group/ticker cursor-pointer">
            <span className="inline-block animate-marquee group-hover/ticker:[animation-play-state:paused] text-slate-800">
              {tickerText}
            </span>
          </div>
          <Link
            href="/map"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#1A3D2F] hover:text-[#2D6A4F] transition-colors shrink-0 group"
          >
            <span>{t("navMap")}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </PopItem>

      {/* 2. Jharkhand-Grounded Warm Civic Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#15291F] via-[#1A3D2F] to-[#244533] text-white py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        {/* Jharkhand State Silhouette — low-opacity identity layer */}
        <div className="absolute inset-0 flex items-center justify-end pr-8 md:pr-16 pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 340 380"
            className="jh-state-silhouette absolute right-0 top-1/2 -translate-y-1/2 w-[380px] md:w-[480px] opacity-[0.055] select-none"
            aria-hidden="true"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Approximate Jharkhand state outline — Chota Nagpur Plateau shape */}
            <path d="M 168 12 L 198 18 L 228 10 L 256 22 L 278 14 L 298 30 L 310 52 L 320 78 L 318 106 L 330 128 L 328 154 L 316 172 L 308 196 L 318 218 L 314 244 L 296 262 L 278 270 L 258 284 L 240 298 L 220 312 L 202 328 L 182 338 L 162 340 L 142 326 L 122 310 L 104 294 L 88 274 L 74 256 L 62 236 L 52 212 L 44 188 L 40 162 L 36 136 L 38 110 L 44 86 L 54 64 L 68 44 L 86 28 L 108 16 L 132 10 L 152 10 Z" />
          </svg>
        </div>
        {/* Chota Nagpur Plateau contour lines — organic horizontal depth */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 900 320"
            className="jh-plateau-layer absolute bottom-0 left-0 right-0 w-full opacity-[0.04] select-none"
            preserveAspectRatio="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 0 240 Q 120 190 240 210 Q 360 228 480 200 Q 600 172 720 195 Q 820 215 900 205 L 900 320 L 0 320 Z" fill="white" opacity="0.6" />
            <path d="M 0 270 Q 100 248 220 260 Q 360 274 500 252 Q 640 232 760 248 Q 840 258 900 244 L 900 320 L 0 320 Z" fill="white" opacity="0.4" />
            <path d="M 0 295 Q 200 280 380 288 Q 560 296 740 282 Q 830 276 900 282 L 900 320 L 0 320 Z" fill="white" opacity="0.25" />
          </svg>
        </div>
        <div className="absolute -bottom-24 left-0 right-0 h-48 bg-gradient-to-t from-[#FAF7F2] to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <PopItem delay={0.1}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-amber-200 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>SIH26043 &bull; Govt. of Jharkhand Disaster Management Cell</span>
            </div>
          </PopItem>

          <PopItem delay={0.15}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-serif max-w-4xl mx-auto leading-tight sm:leading-none mb-6 text-white drop-shadow-sm">
              Real Problems.<br />Real Solutions.
            </h1>
          </PopItem>

          <PopItem delay={0.2}>
            <p className="text-base sm:text-xl text-emerald-100/90 max-w-3xl mx-auto mb-3 leading-relaxed font-normal">
              JanSahaya connects citizens, government, universities and industry to turn local problems into measurable impact.
            </p>
            <p className="text-sm text-emerald-200/50 mb-8 font-medium tracking-wide">
              Built for Jharkhand. Powered by its people.
            </p>
          </PopItem>

          <PopItem delay={0.25} className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Link
                href="/challenges/new"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#C05621] hover:bg-[#A94418] text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group tracking-wide uppercase"
              >
                <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>REPORT A PROBLEM</span>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/25 font-bold text-sm transition-all flex items-center justify-center gap-2 group tracking-wide uppercase"
              >
                <Search className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                <span>SEE HOW IT WORKS</span>
              </a>
            </motion.div>
          </PopItem>

          {/* Key Metrics Counter Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <PopItem delay={0.28} hoverEffect className="bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 p-4 sm:p-5 rounded-2xl text-left transition-all">
              <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider mb-1">
                {t("statsTotalChallenges")}
              </div>
              <div className="text-3xl font-extrabold text-white">
                <AnimatedCounter value={totalChallenges} />
              </div>
              <div className="text-[11px] text-amber-300 font-medium mt-1 flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400" /> {criticalCount} {t("criticalBadge")}
              </div>
            </PopItem>

            <PopItem delay={0.32} hoverEffect className="bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 p-4 sm:p-5 rounded-2xl text-left transition-all">
              <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider mb-1">
                {t("statsActiveResolutions")}
              </div>
              <div className="text-3xl font-extrabold text-white">
                <AnimatedCounter value={totalSolutions} />
              </div>
              <div className="text-[11px] text-emerald-300 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {t("fieldPilotsDeployed")}
              </div>
            </PopItem>

            <PopItem delay={0.36} hoverEffect className="bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 p-4 sm:p-5 rounded-2xl text-left transition-all">
              <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider mb-1">
                {t("partnerResearchers")}
              </div>
              <div className="text-3xl font-extrabold text-white">
                <AnimatedCounter value={totalSolvers} />
              </div>
              <div className="text-[11px] text-amber-200 font-medium mt-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> BIT Mesra &bull; IIT ISM
              </div>
            </PopItem>

            <PopItem delay={0.4} hoverEffect className="bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/30 p-4 sm:p-5 rounded-2xl text-left transition-all">
              <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider mb-1">
                {t("statsPledgedFunds")}
              </div>
              <div className="text-3xl font-extrabold text-amber-300">₹4.85 Cr</div>
              <div className="text-[11px] text-slate-300 font-medium mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {t("csrPledgedSubtitle")}
              </div>
            </PopItem>
          </div>
        </div>
      </section>

      {/* 3. Jharkhand Civic Pulse — District Activity Strip */}
      <section className="py-12 bg-white border-b border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900 font-serif">{t("jharkhandCivicPulse")}</h2>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                {t("platformDemoData")}
              </span>
            </div>
            <Link
              href="/map"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1A3D2F] hover:text-[#2D6A4F] transition-colors group"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t("exploreOnGisMap")}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {([
              { district: "Ranchi", icon: "🏛️", desc: "Capital · Urban Drainage", share: 0.28, urgency: "HIGH", color: "#C05621" },
              { district: "Jamshedpur", icon: "🏭", desc: "Steel Belt · Industrial", share: 0.22, urgency: "MEDIUM", color: "#1A3D2F" },
              { district: "Dhanbad", icon: "⛏️", desc: "Coalfields · Subsidence", share: 0.20, urgency: "CRITICAL", color: "#dc2626" },
              { district: "Hazaribagh", icon: "🌲", desc: "Plateau · Groundwater", share: 0.16, urgency: "MEDIUM", color: "#1A3D2F" },
              { district: "Deoghar", icon: "🕌", desc: "Santhal Pargana · Rural", share: 0.14, urgency: "LOW", color: "#059669" },
            ] as const).map(({ district, icon, desc, share, urgency, color }, idx) => {
              const count = Math.round(totalChallenges * share);
              const barPct = Math.round(share * 100);
              return (
                <motion.div
                  key={district}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.3, delay: idx * 0.06 }}
                  className="bg-[#FAF7F2] border border-[#E8DFC8] hover:border-[#1A3D2F] rounded-xl p-4 transition-all group cursor-default"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base" aria-hidden="true">{icon}</span>
                      <span className="text-xs font-bold text-slate-800">{district}</span>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wider ${
                        urgency === "CRITICAL"
                          ? "bg-red-100 text-red-700"
                          : urgency === "HIGH"
                          ? "bg-amber-100 text-amber-800"
                          : urgency === "LOW"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {urgency}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-3 leading-snug">{desc}</p>
                  {/* Activity bar */}
                  <div className="h-1.5 rounded-full bg-[#E8DFC8] overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${barPct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: 0.2 + idx * 0.08, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span><AnimatedCounter value={count} /> {t("problemsCount")}</span>
                    <span className="font-semibold" style={{ color }}>{barPct}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Quad-Helix Signature Interactive Component */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <QuadHelix />
      </section>

      {/* 4. Problem Lifecycle: Problem -> Understand -> Verify -> Match -> Solve -> Fund -> Implement -> Impact */}
      <section className="py-16 bg-[#F5EFE6] border-y border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#1A3D2F] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-[#E8DFC8]">
              {t("governanceLifecycleTag")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mt-3">
              {t("governanceLifecycleTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              {t("governanceLifecycleSub")}
            </p>
          </div>

          {/* Stepper Timeline Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {lifecycleSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E8DFC8] p-4 flex flex-col justify-between hover:border-[#1A3D2F] hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-[#C05621]">{step.num}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 font-serif tracking-tight group-hover:text-[#1A3D2F] transition-colors">
                    {step.name}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                    {step.desc}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[#FAF7F2] text-[10px] font-semibold text-[#1A3D2F]">
                  {step.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. How It Works: The 4 Core Stages */}
      <section id="how-it-works" className="py-16 bg-white border-b border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#C05621] uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Standard Operating Procedure
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-3 font-serif">
              {t("howItWorks")}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From on-ground citizen voice intake to official nodal officer verification and multi-institution deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8DFC8] hover:border-[#1A3D2F] hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-[#C05621] flex items-center justify-center font-extrabold text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t("step1Title")}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t("step1Desc")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8DFC8] hover:border-[#1A3D2F] hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#1A3D2F] flex items-center justify-center font-extrabold text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t("step2Title")}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t("step2Desc")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8DFC8] hover:border-[#1A3D2F] hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t("step3Title")}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t("step3Desc")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8DFC8] hover:border-[#1A3D2F] hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#B45309] flex items-center justify-center font-extrabold text-lg mb-4">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{t("step4Title")}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{t("step4Desc")}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. AI Problem Intelligence & Explainability Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#1A3D2F] uppercase tracking-wider bg-[#EFE8DF] px-3 py-1 rounded-full border border-[#E8DFC8]">
            AI Intelligence & Explainability
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 mt-3">
            Explainable AI Matrix: Analysis vs. Statutory Sanction
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            JanSahaya clearly demarcates statistical machine assistance from sovereign government authority.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <ProblemIntelligenceCard
            category="Urban Drainage & Flood Mitigation"
            severity="CRITICAL"
            urgencyScore={88}
            aiConfidence={94}
            duplicateProbability={6}
            evidenceStrength={85}
            district="Ranchi"
            state="Jharkhand"
            responsibleAuthority="Ranchi Municipal Corporation (RMC) & DDMA"
            requiredExpertise={["Hydrology Modeling", "Stormwater Civil Eng", "IoT Sensor Telemetry"]}
            isVerifiedByGovt={true}
            verifiedByOfficer="Executive Engineer (UD&HD) • Ranchi District"
            verifiedAt="Ground Inspection Logged"
          />
        </div>
      </section>

      {/* 7. Featured Priority Ground Challenges */}
      <section className="py-16 bg-[#F5EFE6] border-t border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                <h2 className="text-2xl font-bold text-slate-900 font-serif">
                  {language === "hi"
                    ? "उच्च प्राथमिकता वाली समस्याएं"
                    : language === "ur"
                    ? "اعلیٰ ترجیحی عوامی مسائل"
                    : "High-Priority Ground Challenges"}
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Real challenges requiring urgent multi-disciplinary research intervention and CSR grants.
              </p>
            </div>

            <Link
              href="/challenges"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E8DFC8] hover:bg-[#FAF7F2] text-slate-800 text-xs font-bold rounded-xl shadow-sm transition-colors group"
            >
              <span>Explore All {totalChallenges} Challenges</span>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredChallenges.map((item, idx) => {
              const tags = item.aiTags ? JSON.parse(item.aiTags) : [];
              const isCritical = item.severity === "CRITICAL";

              return (
                <PopCard
                  key={item.id}
                  delay={0.1 + idx * 0.05}
                  className="bg-white rounded-2xl border border-[#E8DFC8] hover:border-[#1A3D2F] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                          isCritical
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {item.severity} ALERT
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {item.district}, {item.state}
                      </span>
                    </div>

                    <Link href={`/challenges/${item.id}`} className="block group">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#1A3D2F] transition-colors line-clamp-2 leading-snug mb-2 font-serif">
                        {item.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                      {item.description}
                    </p>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {tags.slice(0, 3).map((tag: string, tidx: number) => (
                          <span
                            key={tidx}
                            className="text-[10px] px-2 py-0.5 bg-[#FAF7F2] border border-[#E8DFC8] text-slate-600 rounded font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#EFE8DF] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-slate-500 font-medium">
                      <span>💡 {item._count.solutions} Solutions</span>
                      <span>👍 {item._count.upvotes} Votes</span>
                    </div>

                    <Link
                      href={`/challenges/${item.id}`}
                      className="text-xs font-bold text-[#1A3D2F] hover:text-[#2D6A4F] flex items-center gap-1 group/btn"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </PopCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Interactive Civic Problem Map Callout */}
      <section className="py-16 bg-white border-b border-[#E8DFC8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1A3D2F] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-3 border border-white/20">
                <Compass className="w-3.5 h-3.5" />
                <span>Geospatial Disaster Telemetry</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif leading-tight">
                Explore the Live Jharkhand Civic Problem Map
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 leading-relaxed">
                Filter by flood corridors, subterranean coal fire hotspots, drought clusters, and municipal jurisdiction zones across all 24 districts.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/map"
                  className="px-6 py-3 rounded-xl bg-[#C05621] hover:bg-[#A94418] text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-2 uppercase tracking-wider"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Launch Interactive Map</span>
                </Link>
                <Link
                  href="/analytics"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/25 transition-all flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>District Analytics</span>
                </Link>
              </div>
            </div>

            <div className="w-full md:w-80 h-48 rounded-2xl bg-[#15291F] border border-white/15 p-4 flex flex-col justify-between shadow-inner">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  Live GIS Feed
                </span>
                <span className="text-[10px] text-slate-400">24 Districts</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-200">
                <div className="flex justify-between">
                  <span>Jharia Coal Fire Zone:</span>
                  <strong className="text-red-400">Active Telemetry</strong>
                </div>
                <div className="flex justify-between">
                  <span>Morabadi Catchment:</span>
                  <strong className="text-amber-300">Monitored</strong>
                </div>
                <div className="flex justify-between">
                  <span>Palamu Water Fluoride:</span>
                  <strong className="text-emerald-400">Pilot Online</strong>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-white/10 flex items-center justify-between">
                <span>Satellite Basemap &bull; Topo</span>
                <span className="text-amber-300 font-bold">2.4km Buffer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final Citizen Call to Action */}
      <section className="py-16 bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-bold text-[#C05621] uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Civic Participation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-900 mt-3 mb-2">
            &ldquo;By the People. For the People.&rdquo;
          </h2>
          <p className="text-xs text-[#1A3D2F] font-semibold mb-3 tracking-wide">
            Starting from Jharkhand&apos;s villages, coalfields and cities.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Every verified resolution begins with a citizen report. Log an on-ground problem in 60 seconds with photos, voice dictation, and GPS accuracy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/challenges/new"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#C05621] hover:bg-[#A94418] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Mic className="w-4 h-4" />
              <span>Report a Problem Now</span>
            </Link>
            <Link
              href="/challenges"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-[#FAF7F2] text-slate-800 border border-[#E8DFC8] font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Explore Verified Database</span>
            </Link>
          </div>
        </div>
      </section>
    </PagePop>
  );
}
