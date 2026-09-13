import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getUserFromRequest(request);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden: Only Authorized Government Authorities (ADMIN) can assign research labs.",
          code: "AUTHORITY_REQUIRED",
        },
        { status: 403 }
      );
    }
    const adminId = session.userId;

    const { challengeId, universityId, department, notes } = await request.json();

    if (!challengeId || !universityId) {
      return NextResponse.json({ error: "Challenge and University IDs are required" }, { status: 400 });
    }

    const challenge = await db.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Official Government gate: Only verified challenges can be assigned to research universities
    if (!["VERIFIED", "ASSIGNED", "IN_PROGRESS"].includes(challenge.status)) {
      return NextResponse.json(
        {
          error: "Cannot assign research lab to an unverified challenge. Official Government statutory verification is required prior to institutional assignment.",
          code: "CHALLENGE_NOT_VERIFIED",
          currentStatus: challenge.status,
        },
        { status: 400 }
      );
    }

    const university = await db.university.findUnique({ where: { id: universityId } });
    if (!university) {
      return NextResponse.json({ error: "University not found" }, { status: 404 });
    }

    const updated = await db.challenge.update({
      where: { id: challengeId },
      data: {
        assignedUniversityId: university.id,
        assignedDepartment: department || (university.departments ? JSON.parse(university.departments)[0] : "Disaster Tech"),
        autoAssignedUniversity: university.name,
        status: "ASSIGNED",
        officialNotes: notes || `Directly assigned to ${university.name} for technical mitigation study.`,
      },
    });

    // Create notification for university nodal officer if registered
    const nodalUser = await db.user.findUnique({ where: { email: university.nodalOfficerEmail } });
    if (nodalUser) {
      await db.notification.create({
        data: {
          userId: nodalUser.id,
          title: "New Disaster Challenge Assigned to Your Institute",
          message: `Govt of Jharkhand has assigned '${updated.title}' to ${university.name}.`,
          type: "INFO",
          link: `/challenges/${updated.id}`,
        },
      });
    }

    const adminUser = await db.user.findUnique({ where: { id: adminId } });
    await db.auditLog.create({
      data: {
        action: "CHALLENGE_ASSIGNED_TO_UNIVERSITY",
        entityType: "Challenge",
        entityId: challengeId,
        actorId: adminId,
        actorName: adminUser?.name || "Govt Nodal Officer",
        details: JSON.stringify({ university: university.name, department }),
      },
    });

    return NextResponse.json({ success: true, challenge: updated });
  } catch (error: unknown) {
    console.error("Assign University Error:", error);
    return NextResponse.json({ error: "Failed to assign university" }, { status: 500 });
  }
}
