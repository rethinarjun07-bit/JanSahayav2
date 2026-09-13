import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { VerificationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden: Only Authorized Government Authorities (ADMIN) can verify challenges and issue statutory certificates.",
          code: "AUTHORITY_REQUIRED",
        },
        { status: 403 }
      );
    }
    const adminId = session.userId;

    const body = await request.json();
    const result = VerificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { challengeId, status, officialNotes, verifiedSeverity, assignedUniversityId, assignedDepartment } = result.data;

    const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    const updated = await db.challenge.update({
      where: { id: challengeId },
      data: {
        status,
        officialNotes,
        severity: verifiedSeverity || challenge.severity,
        assignedUniversityId: assignedUniversityId || challenge.assignedUniversityId,
        assignedDepartment: assignedDepartment || challenge.assignedDepartment,
        officialGovernmentSeverity: verifiedSeverity || challenge.severity,
        officialGovernmentCategory: challenge.category,
        verifiedAt: new Date(),
        verifiedById: adminId,
      },
    });

    // Notify the citizen who posted the challenge
    await db.notification.create({
      data: {
        userId: challenge.createdById,
        title: `Challenge ${status === "VERIFIED" ? "Verified by Govt" : "Status Updated"}`,
        message: `Your reported challenge '${challenge.title.substring(0, 45)}...' has been officially reviewed and set to ${status}.`,
        type: "SUCCESS",
        link: `/challenges/${challenge.id}`,
      },
    });

    // Award karma to reporter for verified report
    await db.user.update({
      where: { id: challenge.createdById },
      data: { karmaPoints: { increment: 25 } },
    });

    const adminUser = await db.user.findUnique({ where: { id: adminId } });
    await db.auditLog.create({
      data: {
        action: `CHALLENGE_${status}`,
        entityType: "Challenge",
        entityId: challengeId,
        actorId: adminId,
        actorName: adminUser?.name || "Govt Triage Officer",
        details: JSON.stringify({
          previousStatus: challenge.status,
          newStatus: status,
          notes: officialNotes,
          previousSeverity: challenge.severity,
          verifiedSeverity: verifiedSeverity || challenge.severity,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      challenge: updated,
      message: "Challenge verification completed successfully.",
    });
  } catch (error: unknown) {
    console.error("Verification API Error:", error);
    return NextResponse.json({ error: "Failed to verify challenge" }, { status: 500 });
  }
}
