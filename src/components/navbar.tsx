"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Flame,
  MapPin,
  Award,
  BarChart3,
  Building2,
  UserCheck,
  PlusCircle,
  Globe,
  LogIn,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  PhoneCall,
  Zap,
  FileText,
  GitMerge,
  Mic,
} from "lucide-react";
import { useLanguage } from "./language-provider";
import { useAuth } from "@/context/auth-context";
import { sound } from "@/lib/sound";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CITIZEN" | "SOLVER" | "INDUSTRY";
  organization?: string;
  district?: string;
  karmaPoints?: number;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user, switchDemoRole, logout } = useAuth();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Demo mode is gated by an env variable — never available in production
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const handleQuickLogin = async (role: string) => {
    sound.playClick();
    setSwitchingRole(true);
    try {
      await switchDemoRole(role);
      setRoleDropdownOpen(false);
      sound.playCelebration();
      // ADMIN is not available in demo switcher — requires real login
      if (role === "SOLVER") router.push("/solver/dashboard");
      else if (role === "INDUSTRY") router.push("/industry");
      else router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleLogout = async () => {
    sound.playClick();
    await logout();
    router.push("/");
    router.refresh();
  };

  // Build nav links based on the current user's role
  const allNavLinks = [
    { href: "/",               label: t("navHome"),       icon: ShieldAlert, roles: null },
    { href: "/challenges",     label: t("navChallenges"), icon: Flame,       roles: null },
    { href: "/map",            label: t("navMap"),        icon: MapPin,      roles: null },
    { href: "/ai-report",      label: t("navAiReport"),   icon: Mic,         roles: null, badge: "NEW" },
    { href: "/demo",           label: t("navDemo") || "Demo Hub", icon: Sparkles, roles: null, badge: "SIH" },
    { href: "/analytics",      label: t("navAnalytics"),  icon: BarChart3,   roles: null },
    { href: "/solver/dashboard", label: t("navSolver"),   icon: Zap,         roles: ["SOLVER", "ADMIN"] },
    { href: "/industry",       label: t("navIndustry"),   icon: Building2,   roles: ["INDUSTRY", "ADMIN"] },
    { href: "/admin/merge",    label: t("navMerge"),      icon: GitMerge,    roles: ["ADMIN"], badge: "NLP" },
    { href: "/admin",          label: t("navAdmin"),      icon: UserCheck,   roles: ["ADMIN"], badge: "Govt" },
  ];

  // Show link if: no role restriction, OR user has the required role
  const navLinks = allNavLinks.filter(
    (link) => !link.roles || (user && link.roles.includes(user.role))
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAF7F2] border-b border-[#E8DFC8] shadow-sm">
      {/* 1. Official National Tricolor Top Banner */}
      <div className="bg-[#15291F] text-[#E8DFC8] text-xs py-1.5 px-4 border-b border-[#244533]">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-300 font-bold tracking-wide">
              🇮🇳 {t("jharkhandGovtBanner")}
            </span>
            <span className="hidden md:inline text-emerald-700">|</span>
            <span className="hidden md:inline text-slate-300 font-medium">
              {t("sihBanner")}
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 text-emerald-300 bg-[#1E3B2C] px-2 py-0.5 rounded border border-[#2D5A43]">
              <PhoneCall className="w-3 h-3" /> {t("helplineText")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Demo Role Switcher — only visible when NEXT_PUBLIC_DEMO_MODE=true */}
            {/* ADMIN is intentionally excluded — requires real credentials at /login */}
            {isDemoMode && (
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-gov-navyLight/80 hover:bg-gov-navyLight text-amber-300 text-[11px] font-bold border border-amber-500/40 transition-colors"
                  title="Switch demo accounts for SIH evaluation (CITIZEN/SOLVER/INDUSTRY only)"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Demo: {user ? user.role : "Select"}</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
                      {t("demoPersonaTitle")}
                    </div>
                    <button
                      onClick={() => handleQuickLogin("SOLVER")}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-blue-300 flex items-center justify-between"
                    >
                      <span>🔬 {t("demoSolver")}</span>
                      <span className="text-[10px] text-slate-500">BIT Mesra</span>
                    </button>
                    <button
                      onClick={() => handleQuickLogin("CITIZEN")}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-300 flex items-center justify-between"
                    >
                      <span>👤 {t("demoCitizen")}</span>
                      <span className="text-[10px] text-slate-500">Reporter</span>
                    </button>
                    <button
                      onClick={() => handleQuickLogin("INDUSTRY")}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-purple-300 flex items-center justify-between"
                    >
                      <span>🏭 {t("demoIndustry")}</span>
                      <span className="text-[10px] text-slate-500">Patron</span>
                    </button>
                    {/* ADMIN requires real login — no demo bypass */}
                    <div className="px-2.5 py-2 rounded-lg bg-red-950/40 border border-red-800/40 text-red-300 flex items-center gap-2 mt-1">
                      <span className="text-[10px] leading-tight">
                        🔒 <strong>Admin</strong> requires official credentials —{" "}
                        <a href="/login?required=ADMIN" className="underline hover:text-red-200">Login here</a>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3-Language Switcher (English, हिन्दी, اردو) */}
            <div className="relative">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold border border-slate-700 transition-colors"
                title="Change Website Language / भाषा बदलें / زبان تبدیل کریں"
              >
                <Globe className="w-3 h-3 text-amber-400" />
                <span>
                  {language === "hi"
                    ? "🇮🇳 हिन्दी (HI)"
                    : language === "ur"
                    ? "🇵🇰/🇮🇳 اردو (UR)"
                    : "🇬🇧 English (EN)"}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">
                    {t("selectLanguage")}
                  </div>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setLanguage("en");
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      language === "en"
                        ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                        : "hover:bg-slate-800 text-slate-200"
                    }`}
                  >
                    <span>🇬🇧 English</span>
                    <span className="text-[10px] text-slate-400 font-mono">EN</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setLanguage("hi");
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      language === "hi"
                        ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                        : "hover:bg-slate-800 text-slate-200"
                    }`}
                  >
                    <span>🇮🇳 हिन्दी</span>
                    <span className="text-[10px] text-slate-400 font-mono">HI</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setLanguage("ur");
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      language === "ur"
                        ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30"
                        : "hover:bg-slate-800 text-slate-200"
                    }`}
                  >
                    <span>🇵🇰/🇮🇳 اردو</span>
                    <span className="text-[10px] text-slate-400 font-mono">UR</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Branding */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#1A3D2F] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-[#1A3D2F] tracking-tight font-serif">
                  {t("portalName")}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-[#C05621] font-bold border border-amber-300">
                  SIH26043
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-medium tracking-wide">
                National Societal Innovation & Disaster Mitigation Portal
              </p>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => sound.playClick()}
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-[#1A3D2F] text-white shadow-sm"
                      : "text-slate-700 hover:bg-[#EFE8DF] hover:text-[#1A3D2F]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-0.5 text-[9px] px-1.5 py-0.2 bg-amber-400 text-slate-900 font-bold rounded">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/challenges/new"
              onClick={() => sound.playClick()}
              className="px-4 py-2 rounded-xl bg-[#C05621] hover:bg-[#A94418] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("navPostChallenge")}</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 line-clamp-1">{user.name}</div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium">
                      {user.role}
                    </span>
                    {user.karmaPoints && (
                      <span className="text-amber-600 font-bold">⭐ {user.karmaPoints}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => sound.playClick()}
                className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-slate-500" />
                <span>{t("login")}</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white p-4 space-y-2 shadow-lg">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    sound.playClick();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2"
                >
                  <Icon className="w-4 h-4 text-gov-navy" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Language Switcher */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-gov-navy" /> Language:
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  sound.playClick();
                  setLanguage("en");
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  language === "en" ? "bg-gov-navy text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setLanguage("hi");
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  language === "hi" ? "bg-gov-navy text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setLanguage("ur");
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded text-xs font-bold ${
                  language === "ur" ? "bg-gov-navy text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                اردو
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
