import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: solutionId } = params;
    const session = await getUserFromRequest(request);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: Authentication required to endorse solutions.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN" && session.role !== "INDUSTRY") {
      return NextResponse.json(
        {
          error: "Forbidden: Only Government Authorities (ADMIN) or Industry CSR Partners (INDUSTRY) can endorse solutions.",
          code: "INSUFFICIENT_PRIVILEGES",
        },
        { status: 403 }
      );
    }

    const endorserId = session.userId;
    const endorserName = session.name || (session.role === "ADMIN" ? "Govt Nodal Authority" : "Industry CSR Partner");
    const isAdmin = session.role === "ADMIN";
    const isIndustry = session.role === "INDUSTRY";

    const { status, remarks, grantPledge } = await request.json();

    const solution = await db.solution.findUnique({
      where: { id: solutionId },
      include: { author: true, challenge: true },
    });

    if (!solution) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    let updated;

    if (isAdmin) {
      // Government Authority: Official statutory endorsement & lifecycle control
      const newStatus = status || "GOVT_VERIFIED";
      updated = await db.solution.update({
        where: { id: solutionId },
        data: {
          govtEndorsed: true,
          endorsedBy: endorserName,
          endorsedAt: new Date(),
          status: newStatus,
        },
      });

      // Award bonus karma to solution author
      await db.user.update({
        where: { id: solution.authorId },
        data: {
          karmaPoints: { increment: 150 },
        },
      });

      // When solution is officially endorsed and deployed, challenge advances to DEPLOYED
      // (Government endorsement != field resolution; remains DEPLOYED until field verification)
      if (newStatus === "DEPLOYED" || newStatus === "GOVT_VERIFIED") {
        await db.challenge.update({
          where: { id: solution.challengeId },
          data: {
            status: "DEPLOYED",
            selectedSolutionId: solution.id,
          },
        });
      }

      // Create Notification
      await db.notification.create({
        data: {
          userId: solution.authorId,
          title: "Official Government Endorsement",
          message: `Congratulations! Your solution '${solution.title}' has been officially endorsed by Government Authority (${endorserName}).`,
          type: "SUCCESS",
          link: `/solutions/${solution.id}`,
        },
      });

      // Create Audit Log
      await db.auditLog.create({
        data: {
          action: "SOLUTION_OFFICIALLY_ENDORSED",
          entityType: "Solution",
          entityId: solution.id,
          actorId: endorserId || "SYSTEM",
          actorName: endorserName,
          details: JSON.stringify({ remarks, grantPledge, status: updated.status, authority: "GOVERNMENT" }),
        },
      });

      return NextResponse.json({
        success: true,
        solution: updated,
        message: "Solution officially endorsed by Government Authority.",
      });
    } else {
      // Industry CSR Partner: Support & funding endorsement ONLY
      // CRITICAL: Industry CANNOT mark challenge SOLVED or set govtEndorsed
      const parsedPledge = typeof grantPledge === "number" ? grantPledge : parseFloat(grantPledge) || 0;
      updated = await db.solution.update({
        where: { id: solutionId },
        data: {
          csrFundingStatus: parsedPledge > 0 ? "PLEDGED" : (solution.csrFundingStatus === "UNFUNDED" ? "PLEDGED" : solution.csrFundingStatus),
          csrFunderName: endorserName,
          csrAmountPledged: parsedPledge > 0 ? parsedPledge : solution.csrAmountPledged,
        },
      });

      // Create Notification for solution author
      await db.notification.create({
        data: {
          userId: solution.authorId,
          title: "Industry CSR Endorsement & Pledge",
          message: `Your solution '${solution.title}' has received an industry endorsement and CSR pledge from ${endorserName}.`,
          type: "SUCCESS",
          link: `/solutions/${solution.id}`,
        },
      });

      // Create Audit Log
      await db.auditLog.create({
        data: {
          action: "SOLUTION_INDUSTRY_ENDORSED",
          entityType: "Solution",
          entityId: solution.id,
          actorId: endorserId || "SYSTEM",
          actorName: endorserName,
          details: JSON.stringify({ remarks, grantPledge, csrFundingStatus: updated.csrFundingStatus }),
        },
      });

      return NextResponse.json({
        success: true,
        solution: updated,
        message: "Industry endorsement and CSR pledge recorded. Note: Statutory verification and final resolution remain under official Government authority.",
      });
    }
  } catch (error: unknown) {
    console.error("Endorse Solution Error:", error);
    return NextResponse.json({ error: "Failed to endorse solution" }, { status: 500 });
  }
}
