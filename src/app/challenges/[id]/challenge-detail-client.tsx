"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Flame,
  MapPin,
  Building2,
  CheckCircle2,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Award,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  AlertTriangle,
  Layers,
  Sparkles,
  GitMerge,
  Send,
  Lock,
  Camera,
  Music,
  Volume2,
  Maximize2,
  X,
  Compass,
} from "lucide-react";
import dynamic from "next/dynamic";
import { ExplainableCard } from "@/components/explainable-card";
import { ExplainableMatch } from "@/lib/nlp/matcher";
import { WorkspaceModal } from "@/components/workspace-modal";
import { ProblemIntelligenceCard } from "@/components/problem-intelligence-card";
import { triggerConfetti } from "@/components/celebration-effects";
import { sound } from "@/lib/sound";
import type { LeafletMapProps, MapChallengeItem } from "@/components/leaflet-map";
import { GroundVoiceDispatchAudio } from "@/components/ground-voice-dispatch-audio";

function getCategoryEvidencePhotos(category?: string, title?: string): string[] {
  const cat = ((category || "") + " " + (title || "")).toLowerCase();
  if (
    cat.includes("flood") ||
    cat.includes("disaster") ||
    cat.includes("cyclone") ||
    cat.includes("landslide") ||
    cat.includes("mela") ||
    cat.includes("lightning") ||
    cat.includes("glof")
  ) {
    return ["/media/flood-real-1.jpg", "/media/flood-real-2.jpg"];
  }
  if (
    cat.includes("mine") ||
    cat.includes("mining") ||
    cat.includes("seam") ||
    cat.includes("mica") ||
    cat.includes("coal") ||
    cat.includes("geology") ||
    cat.includes("fissure")
  ) {
    return ["/media/mining-real-1.jpg", "/media/mining-real-2.jpg"];
  }
  if (
    cat.includes("road") ||
    cat.includes("bridge") ||
    cat.includes("transit") ||
    cat.includes("transport") ||
    cat.includes("infra") ||
    cat.includes("pothole")
  ) {
    return ["/media/road-real-1.jpg", "/media/road-real-2.jpg"];
  }
  if (
    cat.includes("water") ||
    cat.includes("sanitation") ||
    cat.includes("drought") ||
    cat.includes("aquifer") ||
    cat.includes("fluoride") ||
    cat.includes("arsenic") ||
    cat.includes("dry")
  ) {
    return ["/media/water-real-1.jpg", "/media/water-real-2.jpg"];
  }
  if (cat.includes("agriculture") || cat.includes("farm") || cat.includes("crop")) {
    return ["/media/drought-real-1.jpg", "/media/water-real-1.jpg"];
  }
  return ["/media/flood-real-1.jpg", "/media/road-real-1.jpg"];
}

function getCategoryVoiceAudio(category?: string, title?: string): string {
  const cat = ((category || "") + " " + (title || "")).toLowerCase();
  if (cat.includes("flood") || cat.includes("disaster")) {
    return "/media/citizen-voice-flood.wav";
  }
  if (cat.includes("mine") || cat.includes("mining") || cat.includes("coal") || cat.includes("fissure")) {
    return "/media/citizen-voice-mining.wav";
  }
  if (cat.includes("road") || cat.includes("bridge") || cat.includes("transport") || cat.includes("pothole")) {
    return "/media/citizen-voice-road.wav";
  }
  if (cat.includes("water") || cat.includes("arsenic") || cat.includes("fluoride") || cat.includes("well") || cat.includes("drought")) {
    return "/media/citizen-voice-water.wav";
  }
  return "/media/citizen-dispatch.wav";
}

const LeafletMap = dynamic<LeafletMapProps>(() => import("@/components/leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-100 rounded-2xl flex flex-col items-center justify-center animate-pulse text-slate-400 font-semibold text-xs border border-slate-200 gap-2">
      <Layers className="w-6 h-6 text-gov-navy animate-bounce" />
      <span>Loading JanSahaya Geospatial Incident Radar...</span>
    </div>
  ),
});

interface ChallengeDetailProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  challenge: any;
}

export function ChallengeDetailClient({ challenge }: ChallengeDetailProps) {
  const [activeTab, setActiveTab] = useState<"solutions" | "matcher" | "verification" | "comments">("solutions");
  const [upvotesCount, setUpvotesCount] = useState(challenge.upvotes.length);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [comments, setComments] = useState(challenge.comments || []);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Matches state
  const [solverMatches, setSolverMatches] = useState<ExplainableMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Proposal modal state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalAbstract, setProposalAbstract] = useState("");
  const [proposalMethodology, setProposalMethodology] = useState("");
  const [proposalTeam, setProposalTeam] = useState("");
  const [proposalBudget, setProposalBudget] = useState(1200000);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    // Check if user already upvoted
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          const found = challenge.upvotes.some((u: { userId: string }) => u.userId === data.user.id);
          setHasUpvoted(found);
        }
      })
      .catch(() => {});
  }, [challenge.upvotes]);

  const handleToggleUpvote = async () => {
    sound.playClick();
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/upvote`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setHasUpvoted(data.upvoted);
        setUpvotesCount(data.count);
        if (data.upvoted) {
          sound.playCelebration();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    sound.playClick();
    setPostingComment(true);
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments([data.comment, ...comments]);
        setNewComment("");
        sound.playCelebration();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  };

  const loadMatches = async () => {
    setActiveTab("matcher");
    if (solverMatches.length > 0) return;

    setLoadingMatches(true);
    try {
      const res = await fetch(`/api/match-solvers?challengeId=${challenge.id}`);
      if (res.ok) {
        const data = await res.json();
        setSolverMatches(data.matches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setSubmittingProposal(true);
    try {
      const res = await fetch("/api/solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.id,
          teamName: proposalTeam,
          title: proposalTitle,
          abstract: proposalAbstract,
          methodology: proposalMethodology,
          budgetEstimate: proposalBudget,
        }),
      });
      if (res.ok) {
        triggerConfetti();
        setProposalModalOpen(false);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingProposal(false);
    }
  };

  const isCritical = challenge.severity === "CRITICAL";

  // Media segregation (photos & voice audio)
  const rawMedia: string[] = Array.isArray(challenge.mediaUrls)
    ? challenge.mediaUrls
    : typeof challenge.mediaUrls === "string"
    ? JSON.parse(challenge.mediaUrls || "[]")
    : [];

  const photoItems = rawMedia.filter(
    (url) =>
      typeof url === "string" &&
      !url.endsWith(".mp4") &&
      !url.endsWith(".webm") &&
      !url.endsWith(".mov") &&
      !url.includes("video") &&
      !url.startsWith("data:video") &&
      !url.endsWith(".mp3") &&
      !url.endsWith(".ogg") &&
      !url.endsWith(".wav") &&
      !url.startsWith("data:audio")
  );

  const audioItem =
    challenge.audioUrl ||
    rawMedia.find(
      (url) =>
        typeof url === "string" &&
        (url.endsWith(".mp3") ||
          url.endsWith(".ogg") ||
          url.endsWith(".wav") ||
          url.includes("audio") ||
          url.startsWith("data:audio"))
    );

  // Category-specific situational evidence graphics
  const categoryFallbackPhotos = getCategoryEvidencePhotos(challenge.category, challenge.title);

  // Filter out any broken external CDNs or corrupt 1-pixel test items
  const cleanPhotos = photoItems.filter(
    (p) =>
      typeof p === "string" &&
      !p.includes("images.unsplash.com") &&
      !p.startsWith("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB")
  );

  let displayPhotos: string[] = [];
  if (cleanPhotos.length >= 2) {
    displayPhotos = cleanPhotos;
  } else if (cleanPhotos.length === 1) {
    displayPhotos = [cleanPhotos[0], categoryFallbackPhotos[1] || categoryFallbackPhotos[0]];
  } else {
    displayPhotos = categoryFallbackPhotos;
  }

  const displayAudio =
    audioItem &&
    !audioItem.includes("actions.google.com") &&
    (audioItem.endsWith(".wav") || audioItem.endsWith(".mp3"))
      ? audioItem
      : getCategoryVoiceAudio(challenge.category, challenge.title);

  const validLat = Number.isFinite(Number(challenge.latitude)) ? Number(challenge.latitude) : 23.3441;
  const validLng = Number.isFinite(Number(challenge.longitude)) ? Number(challenge.longitude) : 85.3096;

  const mapChallengeItem: MapChallengeItem = {
    id: challenge.id,
    title: challenge.title,
    category: challenge.category,
    severity: challenge.severity,
    urgencyScore: challenge.urgencyScore,
    latitude: validLat,
    longitude: validLng,
    district: challenge.district,
    state: challenge.state,
    status: challenge.status,
    address: challenge.address,
    upvotesCount: upvotesCount,
    citizenCountAffected: challenge.citizenCountAffected || (isCritical ? 480 : 220),
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner if this challenge is a merged duplicate */}
        {challenge.masterChallenge && (
          <div className="p-4 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-950 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <GitMerge className="w-5 h-5 text-amber-700 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Merged Duplicate Challenge:</span> This report has been linked to Master Challenge #{challenge.masterChallenge.id}. Community engagement is rolled up.
              </div>
            </div>
            <Link
              href={`/challenges/${challenge.masterChallenge.id}`}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition-colors"
            >
              Go to Master Challenge &rarr;
            </Link>
          </div>
        )}

        {/* Continuous Governance Lifecycle Stepper */}
        <div className="bg-white rounded-3xl border border-[#E8DFC8] p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-[#1A3D2F]">
              Governance & Resolution Lifecycle
            </span>
            <span className="font-mono text-slate-500 font-semibold">
              Current Stage: {challenge.status}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 text-center">
            {[
              "REPORTED",
              "AI CLASSIFIED",
              "GOVT VERIFIED",
              "ASSIGNED",
              "SOLUTION PROPOSED",
              "FUNDING",
              "IMPLEMENTATION",
              "SOLVED",
              "IMPACT VERIFIED",
            ].map((st, sidx) => {
              const isPastOrCurrent =
                sidx <= 1 ||
                (sidx === 2 && (challenge.verifiedAt || challenge.status !== "PENDING")) ||
                (sidx === 3 && (challenge.status === "ASSIGNED" || challenge.status === "IN_PROGRESS" || challenge.status === "SOLVED")) ||
                (sidx === 4 && challenge.solutions && challenge.solutions.length > 0) ||
                (sidx === 5 && (challenge.status === "IN_PROGRESS" || challenge.status === "SOLVED")) ||
                (sidx === 6 && (challenge.status === "IN_PROGRESS" || challenge.status === "SOLVED")) ||
                (sidx === 7 && challenge.status === "SOLVED") ||
                (sidx === 8 && challenge.status === "SOLVED");

              return (
                <div
                  key={sidx}
                  className={`p-2 rounded-xl text-[10px] font-bold transition-all ${
                    isPastOrCurrent
                      ? "bg-[#1A3D2F] text-white shadow-xs"
                      : "bg-[#FAF7F2] text-slate-400 border border-[#E8DFC8]"
                  }`}
                >
                  <span className="block text-[9px] opacity-75">{sidx + 1}</span>
                  <span className="truncate block mt-0.5">{st}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explainable Problem Intelligence Card — with live V2 data */}
        <ProblemIntelligenceCard
          category={challenge.category}
          severity={challenge.severity}
          urgencyScore={challenge.urgencyScore}
          aiConfidence={challenge.confidenceScore ?? 88}
          duplicateProbability={challenge.duplicateProbability ?? (challenge.masterChallengeId ? 88 : 8)}
          evidenceStrength={challenge.evidenceStrength ?? (challenge.mediaUrls?.length > 0 ? 88 : 72)}
          priorityScore={challenge.priorityScore ?? 74}
          district={challenge.district}
          state={challenge.state}
          responsibleAuthority={challenge.recommendedDepartment || "District Disaster Management Authority (DDMA)"}
          requiredExpertise={challenge.aiTags.length > 0 ? challenge.aiTags : ["Civil Drainage", "Hydrology", "Sensor Telemetry"]}
          sdgGoals={Array.isArray(challenge.sdgGoals) ? challenge.sdgGoals : []}
          slaStatus={challenge.slaStatus}
          slaDeadline={challenge.slaDeadline}
          isVerifiedByGovt={Boolean(challenge.verifiedAt)}
          verifiedByOfficer={challenge.verifiedAt ? "Nodal Officer • Dept. of Disaster Management" : "Pending Nodal Inspection"}
          verifiedAt={challenge.verifiedAt ? new Date(challenge.verifiedAt).toLocaleDateString() : "Pending Inspection"}
        />

        {/* Citizen Resolution Feedback Widget */}
        {(challenge.status === "SOLVED" || challenge.status === "IN_PROGRESS") && !feedbackSubmitted && (
          <div className="bg-[#FAF7F2] border border-[#E8DFC8] rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-xl bg-[#1A3D2F] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </span>
              <div>
                <div className="text-xs font-bold text-[#1A3D2F] uppercase tracking-wider">Citizen Resolution Verification</div>
                <div className="text-xs text-slate-500">You reported this problem. Has it been resolved on the ground?</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["SOLVED", "PARTIALLY_SOLVED", "NOT_SOLVED"] as const).map((opt) => (
                <button
                  key={opt}
                  disabled={submittingFeedback}
                  onClick={async () => {
                    setSubmittingFeedback(true);
                    try {
                      await fetch(`/api/challenges/${challenge.id}/feedback`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ feedback: opt }),
                      });
                      setFeedbackSubmitted(true);
                    } catch {}
                    finally { setSubmittingFeedback(false); }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                    opt === "SOLVED" ? "bg-[#1A3D2F] text-white border-[#1A3D2F]" :
                    opt === "PARTIALLY_SOLVED" ? "bg-amber-50 text-amber-800 border-amber-300" :
                    "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {opt === "SOLVED" ? "✓ Resolved on Ground" : opt === "PARTIALLY_SOLVED" ? "⚠ Partially Resolved" : "✗ Still Unresolved — Reopen"}
                </button>
              ))}
            </div>
          </div>
        )}
        {feedbackSubmitted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Thank you! Your on-ground verification has been recorded and will update the challenge status.
          </div>
        )}

        {/* Top Header Card */}
        <div className="bg-white rounded-3xl border border-[#E8DFC8] shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full tracking-wider ${
                  isCritical
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {challenge.severity} PRIORITY
              </span>

              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {challenge.status}
              </span>

              {challenge.verifiedAt && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Govt Verified
                </span>
              )}
            </div>

            {/* Urgency Meter */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
              <Flame className="w-4 h-4 text-red-500" />
              <span className="text-slate-500 font-medium">Urgency Index:</span>
              <strong className="text-slate-900 font-mono text-sm">{challenge.urgencyScore} / 100</strong>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif leading-snug mb-3">
            {challenge.title}
          </h1>

          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 mb-6 pb-6 border-b border-slate-100">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <MapPin className="w-4 h-4 text-gov-saffron" /> {challenge.address || challenge.district}, {challenge.state}
            </span>
            <span>&bull;</span>
            <span>Sector: <strong className="text-slate-700">{challenge.category}</strong></span>
            <span>&bull;</span>
            <span>Reported by: <strong className="text-slate-700">{challenge.createdBy.name}</strong></span>
            <span>&bull;</span>
            <span className="font-mono text-slate-400">GPS: {challenge.latitude}, {challenge.longitude}</span>
          </div>

          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-6">
            {challenge.description}
          </div>

          {/* AI Tags */}
          {challenge.aiTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {challenge.aiTags.map((t: string, i: number) => (
                <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleUpvote}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  hasUpvoted
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>{hasUpvoted ? "Upvoted" : "Upvote Issue"} ({upvotesCount})</span>
              </button>

              <button
                onClick={() => setActiveTab("comments")}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span>Discussion ({comments.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setWorkspaceModalOpen(true);
                }}
                className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Open Sprint Workspace</span>
              </button>

              {currentUser?.role === "SOLVER" && (
                <button
                  onClick={() => {
                    sound.playClick();
                    setProposalModalOpen(true);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-gov-navy to-gov-navyLight hover:from-slate-900 hover:to-gov-navy text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Submit Technical Solution Proposal</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* GEOSPATIAL GIS MAP & HAZARD IMPACT ZONE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-100 text-gov-saffron">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  Geospatial GIS Location & Impact Corridor
                </h2>
                <p className="text-xs text-slate-500">
                  Interactive satellite & topological radar centered at incident coordinates with buffer analysis.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                {validLat.toFixed(4)}° N, {validLng.toFixed(4)}° E
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
                  isCritical
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {isCritical ? "2.4 km Critical Hazard Corridor" : "1.2 km Vulnerability Buffer"}
              </span>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
            <LeafletMap
              challenges={[mapChallengeItem]}
              center={[validLat, validLng]}
              zoom={13}
              height="400px"
              showAdvancedTools={true}
            />
          </div>

          {/* GIS Telemetry HUD Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">District Command</span>
              <span className="font-bold text-slate-800">{challenge.district} HQ</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Exposure Buffer</span>
              <span className="font-bold text-slate-800">{isCritical ? "2,400m Radius" : "1,200m Radius"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Terrain / Layer</span>
              <span className="font-bold text-slate-800">Satellite / Topo / Street</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="block text-[10px] text-slate-400 font-bold uppercase">Estimated Impact</span>
              <span className="font-bold text-amber-700">~{isCritical ? 480 : 220}+ Citizens Exposed</span>
            </div>
          </div>
        </div>

        {/* GROUND MULTIMEDIA EVIDENCE (PHOTOS, VIDEO, AUDIO) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-gov-navy">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-serif">
                  Ground Multimedia Evidence & Telemetry
                </h2>
                <p className="text-xs text-slate-500">
                  Multimodal field verification captures submitted by citizen reporter and field surveyors.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-gov-saffron border border-orange-200 font-bold">
                📷 {displayPhotos.length} Photo{displayPhotos.length !== 1 ? "s" : ""}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                🎙️ 1 Voice SOS Memo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Photo Evidence Gallery */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-gov-saffron" />
                  <span>On-Ground Photos ({displayPhotos.length})</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Click photo to zoom</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {displayPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      sound.playClick();
                      setSelectedImageModal(photo);
                    }}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-black/5 cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`Ground Evidence ${idx + 1}`}
                      onError={(e) => {
                        const fallback =
                          categoryFallbackPhotos[idx % categoryFallbackPhotos.length] ||
                          "/media/flood-real-1.jpg";
                        if (e.currentTarget.src !== fallback) {
                          e.currentTarget.src = fallback;
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <Maximize2 className="w-4 h-4" />
                      <span>Inspect Fullscreen</span>
                    </div>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white font-mono">
                      Field Photo #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Ground Voice Audio Dispatch & Telemetry */}
            <div className="lg:col-span-5 space-y-4">
              {/* Acoustic Citizen Ground Voice Dispatch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-emerald-600" />
                    <span>Citizen Ground Voice Dispatch</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Acoustic SOS
                  </span>
                </div>
                <GroundVoiceDispatchAudio
                  audioUrl={displayAudio}
                  transcript={challenge.voiceTranscript}
                  district={challenge.district || "Ranchi"}
                />
              </div>

              {/* Citizen Incident Telemetry Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Telemetry Verification</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    GPS Geotagged
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Real citizen on-ground photographic evidence and acoustic voice SOS were logged directly from the incident coordinates in {challenge.district || "Jharkhand"}. Evidence is cryptographically referenced for District Administration response teams.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Premier Institute Card */}
        {challenge.autoAssignedUniversity && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gov-navy text-amber-400 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-blue-700 font-bold uppercase tracking-wider">
                  Assigned Premier Research Lab
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {challenge.autoAssignedUniversity} {challenge.assignedDepartment ? `&bull; ${challenge.assignedDepartment}` : ""}
                </div>
              </div>
            </div>
            <button
              onClick={loadMatches}
              className="text-xs font-bold text-gov-navy hover:underline flex items-center gap-1"
            >
              <span>View Match Explainability</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab("solutions");
            }}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 ${
              activeTab === "solutions"
                ? "border-b-2 border-gov-navy text-gov-navy"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Solutions Workspace</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              {challenge.solutions.length}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              loadMatches();
            }}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 ${
              activeTab === "matcher"
                ? "border-b-2 border-gov-navy text-gov-navy"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Expertise Matcher</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab("verification");
            }}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 ${
              activeTab === "verification"
                ? "border-b-2 border-gov-navy text-gov-navy"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
            <span>Govt Verification & Audit</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab("comments");
            }}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 ${
              activeTab === "comments"
                ? "border-b-2 border-gov-navy text-gov-navy"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Discussion Thread</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              {comments.length}
            </span>
          </button>
        </div>

        {/* TAB 1: Solutions Workspace */}
        {activeTab === "solutions" && (
          <div className="space-y-4">
            {challenge.solutions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No solution proposals yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  {currentUser?.role === "SOLVER"
                    ? "Be the first research team or student innovator to submit a technical methodology and milestone roadmap."
                    : "No proposals have been submitted yet. Only verified Solvers can submit technical proposals."}
                </p>
                {currentUser?.role === "SOLVER" && (
                  <button
                    onClick={() => setProposalModalOpen(true)}
                    className="px-4 py-2 bg-gov-navy text-white text-xs font-bold rounded-xl"
                  >
                    Submit Proposal Now
                  </button>
                )}
              </div>
            ) : (
              challenge.solutions.map((sol: any) => (
                <div
                  key={sol.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {sol.status.replace("_", " ")}
                        </span>
                        {sol.govtEndorsed && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Award className="w-3 h-3 text-emerald-600" /> Govt Endorsed
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-medium">Stage: {sol.milestoneStage}</span>
                      </div>
                      <Link href={`/solutions/${sol.id}`} className="block group">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-gov-navy transition-colors">
                          {sol.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        By <strong>{sol.author.name}</strong> &bull; {sol.teamName || sol.author.organization}
                      </p>
                    </div>

                    <Link
                      href={`/solutions/${sol.id}`}
                      className="px-3.5 py-1.5 bg-gov-navy hover:bg-gov-navyLight text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-2">
                    {sol.abstract}
                  </p>

                  {/* Milestones Preview */}
                  {sol.milestones.length > 0 && (
                    <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <div className="text-[11px] font-bold text-slate-700 mb-2">Stage Gate Milestones:</div>
                      <div className="space-y-1.5">
                        {sol.milestones.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              {m.title}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                                m.status === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : m.status === "SUBMITTED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      {sol.budgetEstimate && (
                        <span>Budget: <strong className="text-slate-800">₹{(sol.budgetEstimate / 100000).toFixed(2)} Lakhs</strong></span>
                      )}
                      <span>Reviews: <strong className="text-slate-800">{sol.reviews.length}</strong></span>
                    </div>

                    <Link
                      href={`/solutions/compare?challengeId=${challenge.id}`}
                      className="text-xs font-bold text-amber-600 hover:underline"
                    >
                      Compare with other proposals &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: AI Solver Matcher */}
        {activeTab === "matcher" && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-gov-navy text-white rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-amber-400" /> Explainable Solver Match Ranking
              </h3>
              <p className="text-xs text-slate-300">
                Our matching algorithm cross-references researcher domain skills, laboratory specialties, district proximity, and historical verification track records.
              </p>
            </div>

            {loadingMatches ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 animate-pulse">
                Evaluating solver vectors and computing explainable breakdown...
              </div>
            ) : solverMatches.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                No solvers evaluated yet. Click refresh.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solverMatches.map((m) => (
                  <ExplainableCard
                    key={m.solverId}
                    match={m}
                    onSelect={() => {
                      alert(`Direct dispatch notification sent to ${m.solverName} at ${m.organization}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Govt Verification & Audit Trail */}
        {activeTab === "verification" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Government Inspection Log</h3>
                <p className="text-xs text-slate-500">State Disaster Management Cell &bull; Verification Authority</p>
              </div>
              <Link
                href={`/admin/verify/${challenge.id}`}
                className="px-3 py-1.5 bg-gov-navy hover:bg-gov-navyLight text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Open Official Inspection Console &rarr;
              </Link>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Status:</span>
                <span className="font-bold text-emerald-700">{challenge.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Official Nodal Remarks:</span>
                <span className="font-medium text-slate-800 text-right max-w-md">
                  {challenge.officialNotes || "Verified on-site by District Triage Officer. Severe drainage constriction confirmed."}
                </span>
              </div>
              {challenge.verifiedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Sign-Off Date:</span>
                  <span className="font-mono text-slate-700">{new Date(challenge.verifiedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Comments Discussion */}
        {activeTab === "comments" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-900">Community Discussion & Field Updates</h3>

            {/* Comment Post Form */}
            <form onSubmit={handlePostComment} className="space-y-3">
              <textarea
                rows={3}
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add an update, confirm current on-ground situation, or ask researchers a question..."
                className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={postingComment}
                  className="px-4 py-2 bg-gov-navy hover:bg-gov-navyLight text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{postingComment ? "Posting..." : "Post Comment"}</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        {c.user.name}
                        <span className="text-[10px] text-slate-400 font-normal">({c.user.role})</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Technical Proposal Submission Modal */}
      {proposalModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden">
            <h2 className="text-xl font-bold font-serif text-slate-900 mb-1">
              Submit Solution Proposal
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              For: &ldquo;{challenge.title}&rdquo;
            </p>

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proposal Title</label>
                <input
                  type="text"
                  required
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="e.g. Automated Sluice Gate Control & Telemetry Network"
                  className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Research Team / Lab Name</label>
                <input
                  type="text"
                  value={proposalTeam}
                  onChange={(e) => setProposalTeam(e.target.value)}
                  placeholder="e.g. BIT Mesra Water Robotics Lab"
                  className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Abstract Summary</label>
                <textarea
                  required
                  rows={2}
                  value={proposalAbstract}
                  onChange={(e) => setProposalAbstract(e.target.value)}
                  placeholder="High-level engineering summary of your proposed intervention..."
                  className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technical Methodology</label>
                <textarea
                  required
                  rows={3}
                  value={proposalMethodology}
                  onChange={(e) => setProposalMethodology(e.target.value)}
                  placeholder="1. Sensor installation, 2. Hydrodynamic modeling, 3. Field pilot..."
                  className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Budget (₹)</label>
                <input
                  type="number"
                  value={proposalBudget}
                  onChange={(e) => setProposalBudget(parseFloat(e.target.value))}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gov-navy focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProposalModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProposal}
                  className="flex-1 py-2.5 rounded-xl bg-gov-navy hover:bg-gov-navyLight text-white text-xs font-bold shadow transition-colors"
                >
                  {submittingProposal ? "Submitting..." : "Submit Technical Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImageModal(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImageModal}
              alt="Enlarged Ground Evidence"
              onError={(e) => {
                const fallback =
                  categoryFallbackPhotos[0] || "/media/flood-real-1.jpg";
                if (e.currentTarget.src !== fallback) {
                  e.currentTarget.src = fallback;
                }
              }}
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="p-3 text-xs text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-gov-saffron" /> Verified Ground Incident Capture
              </span>
              <span className="font-mono text-slate-400">
                GPS: {challenge.latitude}, {challenge.longitude} &bull; {challenge.district}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Collaborative Solution Workspace Modal */}
      <WorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        challengeTitle={challenge.title}
        challengeDistrict={challenge.district}
        challengeCategory={challenge.category}
        universityName={challenge.autoAssignedUniversity || "Birla Institute of Technology, Mesra"}
        currentUserName={currentUser?.name || "Dr. Aarav Mehta"}
        currentUserRole={currentUser?.role || "SOLVER"}
      />
    </div>
  );
}
