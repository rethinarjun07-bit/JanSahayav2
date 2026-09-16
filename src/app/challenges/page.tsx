"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Flame,
  Search,
  Filter,
  MapPin,
  Building2,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  Columns2,
  Radio,
  ThumbsUp,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  X,
} from "lucide-react";
import { JHARKHAND_DISTRICTS, CATEGORIES } from "@/lib/data/jharkhand-districts";
import { useLanguage } from "@/components/language-provider";
import { sound } from "@/lib/sound";
import { PagePop, PopItem, PopCard } from "@/components/page-pop-transition";
import type { LeafletMapProps } from "@/components/leaflet-map";

const LeafletMap = dynamic<LeafletMapProps>(() => import("@/components/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-900/10 rounded-2xl flex items-center justify-center animate-pulse text-slate-500 font-semibold text-xs border border-slate-200">
      Initializing JanSahaya GIS Satellite Engine...
    </div>
  ),
});

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  urgencyScore: number;
  status: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  aiTags: string[];
  autoAssignedUniversity?: string;
  createdAt?: string;
  _count: {
    solutions: number;
    upvotes: number;
    comments: number;
    duplicates?: number;
  };
}

export default function ChallengesCatalogPage() {
  const { t } = useLanguage();
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'split' | 'grid' | 'map'
  const [viewMode, setViewMode] = useState<"split" | "grid" | "map">("grid");

  // Sorting
  const [sortBy, setSortBy] = useState<"urgency" | "support" | "newest">("urgency");

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedSeverity, setSelectedSeverity] = useState("All Severities");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Live simulation alert state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simNotification, setSimNotification] = useState<string | null>(null);

  // Upvoting set to avoid double clicks
  const [upvotingIds, setUpvotingIds] = useState<Record<string, boolean>>({});

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (selectedDistrict !== "All Districts") params.set("district", selectedDistrict);
      if (selectedCategory !== "All Categories") params.set("category", selectedCategory);
      if (selectedSeverity !== "All Severities") params.set("severity", selectedSeverity);
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);

      const res = await fetch(`/api/challenges?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedDistrict, selectedCategory, selectedSeverity, selectedStatus]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChallenges();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchChallenges]);

  // Handle Judge Simulation Trigger
  const handleSimulateAlert = async () => {
    sound.playAlert();
    setIsSimulating(true);
    try {
      const res = await fetch("/api/challenges/simulate-alert", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        sound.playCelebration();
        setSimNotification(`🚨 Live Ingestion: "${data.challenge.title}" in ${data.challenge.district}`);
        await fetchChallenges();
        setTimeout(() => setSimNotification(null), 8000);
      } else {
        const data = await res.json().catch(() => ({}));
        setSimNotification(`⚠️ ${data.error || "Simulation restricted: Government Authority (Admin) authentication required."}`);
        setTimeout(() => setSimNotification(null), 6000);
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Upvote / Support Challenge
  const handleUpvote = async (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (upvotingIds[challengeId]) return;

    sound.playPop();
    setUpvotingIds((prev) => ({ ...prev, [challengeId]: true }));

    // Optimistic UI update
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? { ...c, _count: { ...c._count, upvotes: c._count.upvotes + 1 } }
          : c
      )
    );

    try {
      const res = await fetch(`/api/challenges/${challengeId}/upvote`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.count === "number") {
          setChallenges((prev) =>
            prev.map((c) =>
              c.id === challengeId
                ? { ...c, _count: { ...c._count, upvotes: data.count } }
                : c
            )
          );
        }
      }
    } catch (err) {
      console.error("Upvote error:", err);
    } finally {
      setUpvotingIds((prev) => ({ ...prev, [challengeId]: false }));
    }
  };

  // Sorted list
  const sortedChallenges = useMemo(() => {
    const list = [...challenges];
    if (sortBy === "urgency") {
      return list.sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0));
    }
    if (sortBy === "support") {
      return list.sort((a, b) => (b._count?.upvotes || 0) - (a._count?.upvotes || 0));
    }
    if (sortBy === "newest") {
      return list.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }
    return list;
  }, [challenges, sortBy]);

  // Format challenges for LeafletMap
  const mapChallenges = useMemo(() => {
    return sortedChallenges.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      severity: c.severity,
      urgencyScore: c.urgencyScore,
      latitude: c.latitude || 23.3441,
      longitude: c.longitude || 85.3096,
      district: c.district,
      state: c.state,
      status: c.status,
      address: c.address,
      upvotesCount: c._count?.upvotes || 0,
      mergedCount: c._count?.duplicates || 0,
    }));
  }, [sortedChallenges]);

  return (
    <PagePop className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Live Simulation Alert Banner */}
        {simNotification && (
          <div className="bg-red-600 text-white p-4 rounded-2xl shadow-lg border border-red-500 flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <Radio className="w-5 h-5 text-amber-300 animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-red-200">
                  Simulated Ingestion Alert Triggered
                </div>
                <div className="text-xs sm:text-sm font-bold">{simNotification}</div>
              </div>
            </div>
            <button
              onClick={() => setSimNotification(null)}
              className="p-1 hover:bg-white/20 rounded-lg text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Title Bar */}
        <PopItem delay={0.05} className="flex items-center justify-between flex-wrap gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gov-saffron bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                {t("disasterRepository")}
              </span>
              <span className="text-xs font-semibold text-slate-400">&bull;</span>
              <span className="text-xs font-medium text-slate-500">
                {t("allDistrictsActive")}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              {t("catalogTitle")}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher (Grid / Split Map / Full Map) */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewMode("grid");
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-gov-navy shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="3-Column Cards Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t("gridMode")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewMode("split");
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === "split"
                    ? "bg-white text-gov-navy shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Split Interactive Map & List"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>{t("splitMapMode")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setViewMode("map");
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  viewMode === "map"
                    ? "bg-white text-gov-navy shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Full GIS Map Mode"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>{t("fullMapMode")}</span>
              </button>
            </div>

            {/* Hackathon Simulation Trigger Button */}
            <button
              type="button"
              onClick={handleSimulateAlert}
              disabled={isSimulating}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50"
              title="Simulate live disaster intake for evaluation"
            >
              <Radio className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : "text-red-600"}`} />
              <span>{isSimulating ? t("simulating") : t("simulateIncident")}</span>
            </button>

            {/* Post New Challenge Button */}
            <Link
              href="/challenges/new"
              onClick={() => sound.playClick()}
              className="px-4 py-2 bg-gradient-to-r from-gov-saffron to-amber-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("postChallengeBtn")}</span>
            </Link>
          </div>
        </PopItem>

        {/* Filter Toolbar */}
        <PopItem delay={0.1} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none"
              />
            </div>

            {/* District Selector */}
            <div>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  sound.playClick();
                  setSelectedDistrict(e.target.value);
                }}
                className="w-full py-2.5 px-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none bg-white text-slate-700"
              >
                <option value="All Districts">{t("allDistricts")}</option>
                <optgroup label="Jharkhand Districts (24)">
                  {JHARKHAND_DISTRICTS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} ({d.vulnerabilityIndex} Risk)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Category Selector */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  sound.playClick();
                  setSelectedCategory(e.target.value);
                }}
                className="w-full py-2.5 px-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none bg-white text-slate-700"
              >
                <option value="All Categories">{t("allCategories")}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <div className="flex items-center gap-1.5 w-full py-1.5 px-3 border border-slate-200 rounded-xl bg-slate-50">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    sound.playClick();
                    setSortBy(e.target.value as "urgency" | "support" | "newest");
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-700 focus:outline-none font-medium cursor-pointer"
                >
                  <option value="urgency">{t("sortBy")}: {t("sortByUrgency")}</option>
                  <option value="support">{t("sortBy")}: {t("sortBySupport")}</option>
                  <option value="newest">{t("sortBy")}: {t("sortByNewest")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Severity & Status Pill Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-semibold uppercase text-[10px] mr-1">Severity:</span>
              {["All Severities", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => {
                    sound.playClick();
                    setSelectedSeverity(sev);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    selectedSeverity === sev
                      ? "bg-gov-navy text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sev === "All Severities" ? "All" : sev}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 font-semibold uppercase text-[10px] mr-1">Status:</span>
              {[
                { label: "All", val: "ALL" },
                { label: "Submitted", val: "SUBMITTED" },
                { label: "Govt Verified", val: "VERIFIED" },
                { label: "Assigned", val: "ASSIGNED" },
                { label: "In Progress", val: "IN_PROGRESS" },
                { label: "Solved", val: "SOLVED" },
              ].map((st) => (
                <button
                  key={st.val}
                  onClick={() => {
                    sound.playClick();
                    setSelectedStatus(st.val);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all ${
                    selectedStatus === st.val
                      ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </PopItem>

        {/* Results Counter & Fast Reset */}
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>
            Showing <strong>{sortedChallenges.length}</strong> challenges across Jharkhand
          </span>
          <div className="flex items-center gap-3">
            {(search || selectedDistrict !== "All Districts" || selectedCategory !== "All Categories" || selectedSeverity !== "All Severities" || selectedStatus !== "ALL") && (
              <button
                onClick={() => {
                  sound.playClick();
                  setSearch("");
                  setSelectedDistrict("All Districts");
                  setSelectedCategory("All Categories");
                  setSelectedSeverity("All Severities");
                  setSelectedStatus("ALL");
                }}
                className="text-red-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" /> Clear Filters
              </button>
            )}
            <Link href="/map" className="text-gov-navy font-bold hover:underline flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Full Command Center
            </Link>
          </div>
        </div>

        {/* VIEW MODE: MAP ONLY */}
        {viewMode === "map" && (
          <PopItem delay={0.15} className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm">
            <LeafletMap challenges={mapChallenges} height="700px" showAdvancedTools={true} />
          </PopItem>
        )}

        {/* VIEW MODE: SPLIT (MAP ON LEFT, CARDS ON RIGHT) */}
        {viewMode === "split" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sticky Interactive Map Column */}
            <div className="lg:col-span-6 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-sm">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-800">GIS Satellite Grid Sync</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {mapChallenges.length} Plotted Points
                  </span>
                </div>
                <LeafletMap challenges={mapChallenges} height="620px" showAdvancedTools={false} />
              </div>
            </div>

            {/* Scrollable Cards Feed Column */}
            <div className="lg:col-span-6 space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
                  ))}
                </div>
              ) : sortedChallenges.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                  <Flame className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800 mb-1">No challenges found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your search terms or filters.
                  </p>
                </div>
              ) : (
                sortedChallenges.map((item) => renderCard(item, handleUpvote, upvotingIds[item.id]))
              )}
            </div>
          </div>
        )}

        {/* VIEW MODE: GRID ONLY (3 COLUMNS) */}
        {viewMode === "grid" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
                ))}
              </div>
            ) : sortedChallenges.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                <Flame className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">No challenges found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Try adjusting your search terms, district filters, or severity selection.
                </p>
                <button
                  onClick={() => {
                    sound.playClick();
                    setSearch("");
                    setSelectedDistrict("All Districts");
                    setSelectedCategory("All Categories");
                    setSelectedSeverity("All Severities");
                    setSelectedStatus("ALL");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedChallenges.map((item) => renderCard(item, handleUpvote, upvotingIds[item.id]))}
              </div>
            )}
          </>
        )}
      </div>
    </PagePop>
  );
}

// Reusable card renderer
function renderCard(
  item: ChallengeItem,
  onUpvote: (e: React.MouseEvent, id: string) => void,
  isUpvoting?: boolean
) {
  const isCritical = item.severity === "CRITICAL";

  return (
    <PopCard
      key={item.id}
      className="bg-white rounded-3xl border border-slate-200 hover:border-gov-navyLight/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between p-5 group"
    >
      <div>
        {/* Header meta */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
              isCritical
                ? "bg-red-100 text-red-700 border border-red-200 animate-pulse"
                : item.severity === "HIGH"
                ? "bg-orange-100 text-orange-700 border border-orange-200"
                : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            {item.severity} ALERT {item.urgencyScore ? `(${item.urgencyScore})` : ""}
          </span>

          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {item.district}
          </span>
        </div>

        <Link href={`/challenges/${item.id}`} className="block">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-gov-navy transition-colors line-clamp-2 leading-snug mb-2">
            {item.title}
          </h3>
        </Link>

        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {item.description}
        </p>

        {/* Auto Assigned University Badge */}
        {item.autoAssignedUniversity && (
          <div className="mb-3 px-2.5 py-1 bg-blue-50/80 border border-blue-100 rounded-xl text-[11px] text-blue-900 font-medium flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gov-navy shrink-0" />
            <span className="line-clamp-1">Assigned: {item.autoAssignedUniversity}</span>
          </div>
        )}

        {/* AI Tags */}
        {item.aiTags && item.aiTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {item.aiTags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Interactive +1 Support Button */}
          <button
            type="button"
            onClick={(e) => onUpvote(e, item.id)}
            disabled={isUpvoting}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 font-bold text-[11px] flex items-center gap-1 transition-all active:scale-90"
            title="Support this ground challenge"
          >
            <ThumbsUp className="w-3 h-3 text-gov-saffron" />
            <span>{item._count?.upvotes || 0}</span>
          </button>

          <span className="text-slate-400 text-[11px] font-medium">
            💡 {item._count?.solutions || 0} Sol.
          </span>
        </div>

        <Link
          href={`/challenges/${item.id}`}
          className="text-xs font-bold text-gov-navy hover:text-gov-navyLight flex items-center gap-1"
        >
          <span>{item.category ? "View Details" : "View"}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </PopCard>
  );
}
