import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  User,
} from "lucide-react";
import db from "@/lib/db";
import { ChallengeDetailClient } from "./challenge-detail-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function ChallengeDetailPage({ params }: PageProps) {
  const { id } = params;

  let challenge: any = null;
  try {
    challenge = await db.challenge.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true, organization: true, district: true, state: true, karmaPoints: true },
        },
        solutions: {
          include: {
            author: {
              select: { id: true, name: true, organization: true, designation: true, role: true, karmaPoints: true },
            },
            milestones: {
              orderBy: { order: "asc" },
            },
            reviews: {
              include: {
                reviewer: { select: { id: true, name: true, role: true, organization: true } },
              },
            },
            _count: {
              select: { upvotes: true, comments: true },
            },
          },
        },
        duplicates: {
          select: { id: true, title: true, district: true, createdAt: true, status: true },
        },
        masterChallenge: {
          select: { id: true, title: true, district: true, status: true },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, role: true, organization: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        upvotes: true,
      },
    });
  } catch (err) {
    console.warn("Database query failed in ChallengeDetailPage:", err);
  }

  if (!challenge) {
    notFound();
  }

  const aiTags: string[] = challenge.aiTags ? JSON.parse(challenge.aiTags) : [];

  let mediaUrls: string[] = [];
  if (challenge.mediaUrls) {
    try {
      mediaUrls = typeof challenge.mediaUrls === "string" ? JSON.parse(challenge.mediaUrls) : challenge.mediaUrls;
    } catch {
      mediaUrls = [challenge.mediaUrls];
    }
  }

  return (
    <ChallengeDetailClient
      challenge={{
        ...challenge,
        aiTags,
        mediaUrls,
      }}
    />
  );
}
