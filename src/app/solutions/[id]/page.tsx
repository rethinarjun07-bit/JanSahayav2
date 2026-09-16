import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldAlert,
  Award,
  Building2,
  CheckCircle2,
  Calendar,
  DollarSign,
  Layers,
  ArrowLeft,
  Sparkles,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import db from "@/lib/db";
import { SolutionWorkspaceClient } from "./solution-workspace-client";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function SolutionDetailPage({ params }: Props) {
  const { id } = params;

  let solution: any = null;
  try {
    solution = await db.solution.findUnique({
      where: { id },
      include: {
        author: true,
        challenge: {
          include: {
            createdBy: true,
          },
        },
        milestones: {
          orderBy: { order: "asc" },
        },
        reviews: {
          include: {
            reviewer: true,
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: {
            user: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { upvotes: true, comments: true },
        },
      },
    });
  } catch (err) {
    console.warn("Database query failed in SolutionDetailPage:", err);
  }

  if (!solution) {
    notFound();
  }

  const techStack: string[] = solution.techStack ? JSON.parse(solution.techStack) : [];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/challenges/${solution.challengeId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-gov-navy transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Ground Challenge
          </Link>
          <span className="text-xs font-bold text-gov-navy bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Solution Workspace &bull; SIH26043
          </span>
        </div>

        <SolutionWorkspaceClient solution={{ ...solution, techStack }} />
      </div>
    </div>
  );
}
