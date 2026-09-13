import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getUserFromRequest, hashPassword } from "@/lib/auth";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { classifyChallenge } from "@/lib/nlp/classifier";
import crypto from "crypto";

const SIMULATED_TEMPLATES = [
  {
    title: "Flash Flood & Swarnarekha Water Crest Warning at Namkum Lowlands",
    description: "Rapid cloudburst over Ranchi watershed causing sudden 2.2m surge in Swarnarekha river basin. 4 tribal hamlet access culverts submersed; livestock and water pumps submerged. Urgent hydrological telemetry and barrier sandbagging needed.",
    category: "FLOOD",
    severity: "CRITICAL" as const,
    urgencyScore: 96,
    district: "Ranchi",
    state: "Jharkhand",
    address: "Swarnarekha River Basin, Namkum Block, Ranchi",
    latitude: 23.3480 + (Math.random() - 0.5) * 0.04,
    longitude: 85.3400 + (Math.random() - 0.5) * 0.04,
    autoAssignedUniversity: "BIT Mesra (Civil & Water Resources Dept)",
    tags: ["Flood", "Swarnarekha", "Emergency Evacuation", "Hydrology"],
  },
  {
    title: "Jharia Coalfield Seam #14 Ground Subsidence & Toxic Gas Fume Outflow",
    description: "Underground mine fire seam #14 has breached surface soil near Kusunda basti. Visible cracks measuring 18cm width emitting sulfur monoxide fumes. Immediate thermal trench isolation and resident evacuation required.",
    category: "FIRE",
    severity: "CRITICAL" as const,
    urgencyScore: 98,
    district: "Dhanbad",
    state: "Jharkhand",
    address: "Kusunda Colliery Ward 14, Jharia, Dhanbad",
    latitude: 23.7740 + (Math.random() - 0.5) * 0.03,
    longitude: 86.4180 + (Math.random() - 0.5) * 0.03,
    autoAssignedUniversity: "IIT (ISM) Dhanbad (Mining & Disaster Centre)",
    tags: ["Underground Fire", "Mining Subsidence", "Jharia", "Toxic Gas"],
  },
  {
    title: "Severe Lightning Cluster & Micro-Grid Tripping in Khunti Tribal Belt",
    description: "Multi-point ground lightning strike cluster detected along Murhu ridge. Two 33kV distribution transformers ruptured; local primary healthcare clinic running on depleted solar backups. Early warning siren active.",
    category: "WEATHER",
    severity: "HIGH" as const,
    urgencyScore: 89,
    district: "Khunti",
    state: "Jharkhand",
    address: "Murhu Block Ridge, Khunti District",
    latitude: 23.0720 + (Math.random() - 0.5) * 0.04,
    longitude: 85.2780 + (Math.random() - 0.5) * 0.04,
    autoAssignedUniversity: "NIT Jamshedpur (Electrical & Grid Safety)",
    tags: ["Lightning", "Grid Failure", "Khunti", "Rural Power"],
  },
];

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rl = checkRateLimit(clientIp, RATE_LIMIT_BUCKETS.AI_ANON);
    if (!rl.success) {
      return createRateLimitResponse(rl.reset, "Rate limit exceeded for simulation actions.");
    }

    const session = await getUserFromRequest(request);
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden: Only authorized Government Administrators can trigger simulated civic alerts.",
          code: "ADMIN_REQUIRED",
        },
        { status: 403 }
      );
    }

    let citizenUser = await db.user.findFirst({
      where: { role: "CITIZEN" },
    });

    if (!citizenUser) {
      const secureRandomPassword = await hashPassword(crypto.randomBytes(32).toString("hex"));
      citizenUser = await db.user.create({
        data: {
          name: "Suresh Mahto (Field Volunteer)",
          email: `volunteer.${Date.now()}@jharkhand.gov.in`,
          password: secureRandomPassword,
          role: "CITIZEN",
          district: "Ranchi",
          state: "Jharkhand",
        },
      });
    }

    const template = SIMULATED_TEMPLATES[Math.floor(Math.random() * SIMULATED_TEMPLATES.length)];

    const challenge = await db.challenge.create({
      data: {
        title: template.title,
        description: template.description,
        category: template.category,
        severity: template.severity,
        urgencyScore: template.urgencyScore,
        status: "SUBMITTED",
        district: template.district,
        state: template.state,
        address: template.address,
        latitude: template.latitude,
        longitude: template.longitude,
        aiTags: JSON.stringify(template.tags),
        autoAssignedUniversity: template.autoAssignedUniversity,
        createdById: citizenUser.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
        _count: {
          select: { solutions: true, upvotes: true, comments: true },
        },
      },
    });

    // Also write to audit log
    await db.auditLog.create({
      data: {
        action: "SIMULATED_ALERT_CREATED",
        entityType: "Challenge",
        entityId: challenge.id,
        actorId: citizenUser.id,
        actorName: citizenUser.name,
        details: JSON.stringify({
          title: challenge.title,
          district: challenge.district,
          severity: challenge.severity,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      challenge: {
        ...challenge,
        aiTags: template.tags,
      },
    });
  } catch (error) {
    console.error("Simulate alert error:", error);
    return NextResponse.json({ error: "Failed to simulate alert" }, { status: 500 });
  }
}
