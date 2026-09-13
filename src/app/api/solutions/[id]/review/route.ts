import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { ReviewSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: solutionId } = params;
    const session = await getUserFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to submit technical evaluations.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const allowedReviewerRoles = ["SOLVER", "INDUSTRY", "ADMIN"];
    if (!allowedReviewerRoles.includes(session.role)) {
      return NextResponse.json(
        {
          error: "Forbidden: Only Technical Evaluators (SOLVER, INDUSTRY, ADMIN) can submit proposal reviews.",
          code: "INSUFFICIENT_PRIVILEGES",
        },
        { status: 403 }
      );
    }

    const reviewerId = session.userId;
    const reviewerRole = session.role;

    // ── 1. Fetch Solution & Enforce Anti-Self-Review ───────────────────────
    const solution = await db.solution.findUnique({
      where: { id: solutionId },
    });
    if (!solution) {
      return NextResponse.json({ error: "Solution proposal not found" }, { status: 404 });
    }

    if (solution.authorId === reviewerId) {
      return NextResponse.json(
        {
          error: "Forbidden: Solvers and proposal authors cannot review or evaluate their own proposals.",
          code: "SELF_REVIEW_BLOCKED",
        },
        { status: 403 }
      );
    }

    // ── 2. Check for Duplicate Review ──────────────────────────────────────
    const existingReview = await db.review.findUnique({
      where: {
        reviewerId_solutionId: {
          reviewerId,
          solutionId,
        },
      },
    });
    if (existingReview) {
      return NextResponse.json(
        {
          error: "Conflict: You have already submitted a formal technical review for this proposal. Duplicate reviews are not permitted.",
          code: "DUPLICATE_REVIEW_BLOCKED",
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const result = ReviewSchema.safeParse({ ...body, solutionId });
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const review = await db.review.create({
      data: {
        solutionId,
        reviewerId,
        role: reviewerRole,
        rating: data.rating,
        feasibilityScore: data.feasibilityScore,
        impactScore: data.impactScore,
        costEffectiveness: data.costEffectiveness,
        scalabilityScore: data.scalabilityScore,
        feedback: data.feedback,
      },
      include: {
        reviewer: { select: { id: true, name: true, role: true, organization: true } },
      },
    });

    // Update solution status to MENTOR_REVIEW if in PROPOSED stage
    if (solution.status === "PROPOSED") {
      await db.solution.update({
        where: { id: solutionId },
        data: { status: "MENTOR_REVIEW" },
      });
    }

    return NextResponse.json({ success: true, review });
  } catch (error: unknown) {
    console.error("Post Review Error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
