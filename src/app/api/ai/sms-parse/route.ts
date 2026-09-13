import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import db from "@/lib/db";
import { hashPassword, getUserFromRequest } from "@/lib/auth";
import { SMSParseInputSchema } from "@/lib/validators";
import { getClientIp, checkRateLimit, createRateLimitResponse, RATE_LIMIT_BUCKETS } from "@/lib/rate-limiter";
import { safeLog } from "@/lib/safe-logger";
import crypto from "crypto";

// Parses SMS like: "FLOOD RANCHI HIGH" or "MINING FIRE DHANBAD CRITICAL"
// Also understands Hindi: "बाढ़ रांची गंभीर"
export async function POST(request: NextRequest) {
  try {
    // ── 1. Webhook Authentication Gate ──────────────────────────────────────
    const webhookSecret = process.env.SMS_WEBHOOK_SECRET || process.env.SMS_GATEWAY_KEY || "jansahaya-sih-sms-webhook-secure-key";
    const providedSecret =
      request.headers.get("x-sms-webhook-secret") ||
      request.headers.get("x-webhook-token") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    let isSecretValid = false;
    if (providedSecret && webhookSecret && providedSecret.length === webhookSecret.length) {
      isSecretValid = crypto.timingSafeEqual(
        Buffer.from(providedSecret),
        Buffer.from(webhookSecret)
      );
    }

    const session = await getUserFromRequest(request);
    const isAdmin = session?.role === "ADMIN";

    if (!isSecretValid && !isAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized: Valid SMS gateway webhook secret (x-sms-webhook-secret) or ADMIN authentication required.",
          code: "WEBHOOK_UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    // ── 2. Rate Limiting ────────────────────────────────────────────────────
    const clientIp = getClientIp(request);
    const rl = checkRateLimit(clientIp, RATE_LIMIT_BUCKETS.AI_ANON);
    if (!rl.success) {
      return createRateLimitResponse(rl.reset, "SMS intake rate limit exceeded. Please wait.");
    }

    // ── 2. Input Validation ────────────────────────────────────────────────
    const body = await request.json();
    const valResult = SMSParseInputSchema.safeParse(body);
    if (!valResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: valResult.error.flatten() },
        { status: 400 }
      );
    }

    const { smsText, phone } = valResult.data;

    let parsed: ParsedSMS;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("Demo")) {
      // Rule-based fallback parser
      parsed = ruleBasedParser(smsText);
    } else {
      parsed = await geminiParser(smsText);
    }

    if (!parsed.category || !parsed.district) {
      return NextResponse.json({
        error: "Could not parse SMS. Format: FLOOD RANCHI HIGH or FIRE DHANBAD CRITICAL",
        parsed,
      }, { status: 422 });
    }

    // Find or create a SMS reporter user with unguessable bcrypt password
    let reporterUser = await db.user.findFirst({ where: { email: "sms-bot@jansahaya.in" } });
    if (!reporterUser) {
      const secureRandomPassword = await hashPassword(crypto.randomBytes(32).toString("hex"));
      reporterUser = await db.user.create({
        data: {
          email: "sms-bot@jansahaya.in",
          password: secureRandomPassword,
          name: "SMS/WhatsApp Reporter",
          role: "CITIZEN",
          organization: "JanSahaya SMS Gateway",
          designation: "Automated Reporter",
          district: "Ranchi",
          state: "Jharkhand",
          isVerified: true,
        },
      });
    }

    // Create challenge from SMS
    const challenge = await db.challenge.create({
      data: {
        title: parsed.title,
        description: `📱 Reported via SMS${phone ? ` from ${phone}` : ""}.\n\nAuto-parsed report: ${smsText}\n\nThis challenge was automatically created from an SMS/WhatsApp message and requires verification by a field officer.`,
        category: parsed.category,
        severity: parsed.severity,
        urgencyScore: severityToScore(parsed.severity),
        district: parsed.district,
        state: "Jharkhand",
        status: "SUBMITTED",
        createdById: reporterUser.id,
        latitude: DISTRICT_COORDS[parsed.district]?.[0] || 23.6102,
        longitude: DISTRICT_COORDS[parsed.district]?.[1] || 85.2799,
        address: `${parsed.district} District, Jharkhand`,
        aiTags: JSON.stringify(["sms-report", "auto-parsed", "needs-verification"]),
      },
    });

    return NextResponse.json({
      success: true,
      challengeId: challenge.id,
      parsed,
      message: `✅ Challenge created from SMS: "${parsed.title}" in ${parsed.district}`,
    });
  } catch (error) {
    console.error("SMS parse error:", error);
    return NextResponse.json({ error: "Failed to parse SMS" }, { status: 500 });
  }
}

interface ParsedSMS {
  category: string;
  district: string;
  severity: string;
  title: string;
  language?: string;
}

async function geminiParser(smsText: string): Promise<ParsedSMS> {
  const apiKey = (process.env.GEMINI_API_KEY || "").replace(/^["']|["']$/g, "").trim();
  const client = new GoogleGenAI({ apiKey });

  const prompt = `Parse this disaster SMS report and return JSON only.

SMS: "${smsText}"

Rules:
- category: one of ["Flood & Inundation", "Mining & Geology", "Health & Hazardous Waste", "Infrastructure & Municipal", "Environment & Forestry", "Disaster Management", "Water & Sanitation", "Drought & Groundwater Depletion", "Agriculture & Rural Development", "Mining Subsidence & Underground Fires"]
- district: one of Jharkhand's 24 districts (Ranchi, Dhanbad, Jamshedpur/East Singhbhum, Bokaro, Hazaribagh, Giridih, Deoghar, Dumka, Palamu, Garhwa, Latehar, Chatra, Koderma, Jamtara, Sahebganj, Pakur, Godda, Khunti, West Singhbhum, Seraikela, Simdega, Lohardaga, Gumla, Ramgarh)
- severity: CRITICAL, HIGH, MEDIUM, or LOW
- title: a short descriptive challenge title
- language: "en", "hi", or "santali"

Return valid JSON:
{"category":"...","district":"...","severity":"...","title":"...","language":"..."}`;

  const response = await client.models.generateContent({
    model: "gemini-3.7-flash",
    contents: prompt,
    config: { responseMimeType: "application/json", maxOutputTokens: 200 },
  });

  return JSON.parse(response.text || "{}");
}

function ruleBasedParser(smsText: string): ParsedSMS {
  const upper = smsText.toUpperCase();

  const categoryMap: Record<string, string> = {
    FLOOD: "Flood & Inundation",
    बाढ़: "Flood & Inundation",
    FIRE: "Mining Subsidence & Underground Fires",
    आग: "Mining Subsidence & Underground Fires",
    MINE: "Mining & Geology",
    DROUGHT: "Drought & Groundwater Depletion",
    WATER: "Water & Sanitation",
    ROAD: "Infrastructure & Municipal",
    HEALTH: "Health & Hazardous Waste",
    DISEASE: "Health & Hazardous Waste",
    LANDSLIDE: "Disaster Management",
  };

  const severityMap: Record<string, string> = {
    CRITICAL: "CRITICAL", गंभीर: "CRITICAL",
    HIGH: "HIGH", तेज: "HIGH",
    MEDIUM: "MEDIUM", मध्यम: "MEDIUM",
    LOW: "LOW", कम: "LOW",
  };

  const districts = ["RANCHI", "DHANBAD", "BOKARO", "JAMSHEDPUR", "HAZARIBAGH", "GIRIDIH", "DEOGHAR", "DUMKA", "PALAMU", "GARHWA", "LATEHAR", "CHATRA", "KODERMA", "JAMTARA", "SAHEBGANJ", "PAKUR", "GODDA", "KHUNTI", "SIMDEGA", "LOHARDAGA", "GUMLA", "RAMGARH"];

  let category = "Disaster Management";
  let district = "Ranchi";
  let severity = "HIGH";

  for (const [key, val] of Object.entries(categoryMap)) {
    if (upper.includes(key)) { category = val; break; }
  }
  for (const [key, val] of Object.entries(severityMap)) {
    if (upper.includes(key)) { severity = val; break; }
  }
  for (const d of districts) {
    if (upper.includes(d)) { district = d.charAt(0) + d.slice(1).toLowerCase(); break; }
  }

  return {
    category,
    district,
    severity,
    title: `${category} reported in ${district}`,
    language: /[\u0900-\u097F]/.test(smsText) ? "hi" : "en",
  };
}

function severityToScore(severity: string): number {
  return { CRITICAL: 95, HIGH: 75, MEDIUM: 50, LOW: 25 }[severity] || 50;
}

const DISTRICT_COORDS: Record<string, [number, number]> = {
  Ranchi: [23.3441, 85.3096], Dhanbad: [23.7957, 86.4304],
  Bokaro: [23.6693, 86.1511], Jamshedpur: [22.8046, 86.2029],
  Hazaribagh: [23.9925, 85.3637], Giridih: [24.1885, 86.2992],
  Deoghar: [24.4826, 86.6975], Dumka: [24.2677, 87.2484],
  Palamu: [24.0384, 84.0706], Garhwa: [24.1560, 83.8172],
  Latehar: [23.7423, 84.5021], Chatra: [24.2104, 84.8735],
  Koderma: [24.4630, 85.5960], Jamtara: [23.9604, 86.8013],
  Sahebganj: [25.2394, 87.6450], Pakur: [24.6350, 87.8432],
  Godda: [24.8296, 87.2094], Khunti: [23.0710, 85.2791],
  Simdega: [22.6113, 84.5025], Lohardaga: [23.4382, 84.6872],
  Gumla: [23.0437, 84.5404], Ramgarh: [23.6325, 85.5148],
};
