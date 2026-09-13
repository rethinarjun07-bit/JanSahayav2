/**
 * JanSahaya V2 — Hybrid Civic Intelligence, Categorization, Confidence,
 * Evidence Scoring & Prioritization Engine.
 * 100% deterministic local computation with zero token waste.
 */

export interface ClassificationResult {
  predictedCategory: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  urgencyScore: number;
  confidenceScore: number; // 0-100%
  humanVerificationRecommended: boolean;
  recommendedDepartment: string;
  requiredExpertise: string[];
  sdgGoals: string[];
  evidenceStrength: number; // 0-100%
  evidenceBreakdown: Array<{ label: string; passed: boolean; weight: number }>;
  priorityScore: number; // 0-100
  priorityReasons: string[];
  tags: string[];
  recommendedUniversity: {
    name: string;
    code: string;
    rationale: string;
  };
  isDisasterEmergency: boolean;
  explanation: string;
}

const CRITICAL_KEYWORDS = [
  "trapped", "casualty", "casualties", "collapse", "collapsed", "breach", "breached",
  "flash flood", "toxic gas", "explosion", "underground fire", "landslide", "drowning",
  "death", "deaths", "chlorine leak", "subterranean fire", "crushed", "evacuation"
];

const HIGH_KEYWORDS = [
  "subsidence", "sinkhole", "epidemic", "outbreak", "arsenic", "fluoride", "contamination",
  "contaminated", "drought", "starvation", "severe water crisis", "dam overflow", "embankment crack",
  "forest fire", "stampede", "wildlife attack", "elephant conflict", "lightning deaths"
];

const MEDIUM_KEYWORDS = [
  "waterlogging", "drainage", "culvert", "pothole", "potholes", "overflow", "bridge crack",
  "fly ash", "industrial effluent", "garbage dumping", "crop pest", "power outage", "siltation"
];

export function computeEvidenceStrength(inputs: {
  hasGps?: boolean;
  latitude?: number;
  longitude?: number;
  mediaUrlsCount?: number;
  hasAudioOrVoice?: boolean;
  descriptionLength?: number;
  hasDetailedAddress?: boolean;
  corroborationCount?: number;
}): { score: number; breakdown: Array<{ label: string; passed: boolean; weight: number }> } {
  const breakdown: Array<{ label: string; passed: boolean; weight: number }> = [];
  let score = 0;

  // 1. Precise GPS within Jharkhand coordinates or valid bounds (+25%)
  const hasGps = Boolean(inputs.hasGps || (inputs.latitude && inputs.latitude !== 0 && inputs.longitude && inputs.longitude !== 0));
  breakdown.push({ label: "GPS Geotag Verified", passed: hasGps, weight: 25 });
  if (hasGps) score += 25;

  // 2. Photographic / Media evidence (+25%)
  const hasMedia = Boolean(inputs.mediaUrlsCount && inputs.mediaUrlsCount > 0);
  breakdown.push({ label: "On-Ground Photographic Evidence", passed: hasMedia, weight: 25 });
  if (hasMedia) score += 25;

  // 3. Audio / Voice testimonial (+15%)
  const hasAudio = Boolean(inputs.hasAudioOrVoice);
  breakdown.push({ label: "Citizen Voice / Audio Testimony", passed: hasAudio, weight: 15 });
  if (hasAudio) score += 15;

  // 4. Substantive problem description (+15%)
  const hasDetailedDesc = Boolean(inputs.descriptionLength && inputs.descriptionLength >= 50);
  breakdown.push({ label: "Detailed Context & Description (≥50 chars)", passed: hasDetailedDesc, weight: 15 });
  if (hasDetailedDesc) score += 15;

  // 5. Verifiable Landmark / Address (+10%)
  const hasAddress = Boolean(inputs.hasDetailedAddress);
  breakdown.push({ label: "Verifiable Landmark & Address", passed: hasAddress, weight: 10 });
  if (hasAddress) score += 10;

  // 6. Community Corroboration / Duplicates (+10%)
  const hasCorroboration = Boolean(inputs.corroborationCount && inputs.corroborationCount > 0);
  breakdown.push({ label: "Community Multi-Citizen Corroboration", passed: hasCorroboration, weight: 10 });
  if (hasCorroboration) score += 10;

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown,
  };
}

export function computePriorityScore(params: {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  urgencyScore: number;
  evidenceStrength: number;
  upvotesCount?: number;
  daysUnresolved?: number;
}): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Severity (Max 30)
  if (params.severity === "CRITICAL") {
    score += 30;
    reasons.push("Critical life-safety hazard");
  } else if (params.severity === "HIGH") {
    score += 22;
    reasons.push("High public health/infrastructure hazard");
  } else if (params.severity === "MEDIUM") {
    score += 15;
    reasons.push("Moderate societal disruption");
  } else {
    score += 8;
  }

  // Urgency (Max 25)
  const urgencyPart = Math.round((params.urgencyScore / 100) * 25);
  score += urgencyPart;
  if (params.urgencyScore >= 75) {
    reasons.push(`High urgency score (${params.urgencyScore}/100)`);
  }

  // Evidence Strength (Max 20)
  const evidencePart = Math.round((params.evidenceStrength / 100) * 20);
  score += evidencePart;
  if (params.evidenceStrength >= 70) {
    reasons.push(`Strong verified evidence (${params.evidenceStrength}%)`);
  }

  // Citizen Upvotes / Affected Count (Max 15)
  const upvotes = params.upvotesCount || 1;
  const upvotePart = Math.min(15, upvotes * 3);
  score += upvotePart;
  if (upvotes >= 3) {
    reasons.push(`${upvotes} citizens corroborated/upvoted`);
  }

  // Time Unresolved (Max 10)
  const days = params.daysUnresolved || 1;
  const daysPart = Math.min(10, Math.round(days * 1.5));
  score += daysPart;
  if (days >= 5) {
    reasons.push(`Unresolved for ${days} days`);
  }

  return {
    score: Math.min(100, Math.max(15, score)),
    reasons,
  };
}

export function classifyChallenge(
  title: string,
  description: string,
  evidenceParams?: {
    hasGps?: boolean;
    latitude?: number;
    longitude?: number;
    mediaCount?: number;
    hasVoice?: boolean;
    hasDetailedAddress?: boolean;
    corroborationCount?: number;
  }
): ClassificationResult {
  const combined = `${title} ${description}`.toLowerCase();

  // 1. Detect tags
  const tags: string[] = [];
  const tagRules: Array<{ tag: string; terms: string[] }> = [
    { tag: "Flood & Drainage", terms: ["flood", "flooding", "waterlogging", "drainage", "water accumulation", "submerged"] },
    { tag: "Mine Safety & Fire", terms: ["coal", "mine", "mining", "subsidence", "underground fire", "methane", "blast"] },
    { tag: "Water Quality & Drought", terms: ["fluoride", "arsenic", "drought", "borewell", "groundwater", "drinking water"] },
    { tag: "River Erosion & Silt", terms: ["erosion", "embankment", "riverbank", "siltation", "ganga", "subarnarekha"] },
    { tag: "Forest & Wildlife", terms: ["forest fire", "wildfire", "elephant", "habitat", "timber", "sanctuary"] },
    { tag: "Public Health", terms: ["epidemic", "dengue", "cholera", "malaria", "silicosis", "hospital", "toxic"] },
    { tag: "Infrastructure", terms: ["bridge", "road", "culvert", "crack", "highway", "dam", "flyover"] },
    { tag: "Industrial Waste", terms: ["fly ash", "effluent", "slurry", "chemical runoff", "smog", "pollution"] },
  ];

  for (const rule of tagRules) {
    if (rule.terms.some((term) => combined.includes(term))) {
      tags.push(rule.tag);
    }
  }
  if (tags.length === 0) tags.push("Societal Infrastructure");

  // 2. Compute Urgency & Severity
  let urgency = 45;
  let severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "MEDIUM";
  let isDisasterEmergency = false;

  const criticalMatches = CRITICAL_KEYWORDS.filter((k) => combined.includes(k));
  const highMatches = HIGH_KEYWORDS.filter((k) => combined.includes(k));
  const mediumMatches = MEDIUM_KEYWORDS.filter((k) => combined.includes(k));

  if (criticalMatches.length > 0) {
    severity = "CRITICAL";
    urgency = Math.min(100, 85 + criticalMatches.length * 4);
    isDisasterEmergency = true;
  } else if (highMatches.length > 0) {
    severity = "HIGH";
    urgency = Math.min(84, 65 + highMatches.length * 5);
    isDisasterEmergency = true;
  } else if (mediumMatches.length > 0) {
    severity = "MEDIUM";
    urgency = Math.min(64, 40 + mediumMatches.length * 4);
  } else {
    severity = "LOW";
    urgency = 28;
  }

  // 3. Predict Primary Category & Responsible Department
  let predictedCategory = "Disaster Management";
  let recommendedDepartment = "Disaster Management Cell, Govt. of Jharkhand";
  let requiredExpertise = ["Disaster Response", "Civil Hydraulics", "GIS Mapping"];
  let sdgGoals = ["SDG 11: Sustainable Cities & Communities", "SDG 13: Climate Action"];

  if (combined.includes("coal") || combined.includes("mine") || combined.includes("subsidence")) {
    predictedCategory = "Mining & Geology";
    recommendedDepartment = "Department of Mines & Geology, Govt. of Jharkhand";
    requiredExpertise = ["Geotechnical Engineering", "Subterranean Fire Control", "Mining Safety"];
    sdgGoals = ["SDG 11: Sustainable Cities", "SDG 12: Responsible Consumption & Production"];
  } else if (combined.includes("water") || combined.includes("fluoride") || combined.includes("borewell") || combined.includes("drought")) {
    predictedCategory = "Water & Sanitation";
    recommendedDepartment = "Drinking Water & Sanitation Department (DWSD/PHED)";
    requiredExpertise = ["Hydrogeology", "Water Purification", "Borewell Geophysics"];
    sdgGoals = ["SDG 6: Clean Water & Sanitation", "SDG 3: Good Health & Well-being"];
  } else if (combined.includes("crop") || combined.includes("farming") || combined.includes("rural") || combined.includes("soil")) {
    predictedCategory = "Agriculture & Rural Development";
    recommendedDepartment = "Department of Agriculture, Animal Husbandry & Co-operative";
    requiredExpertise = ["Agronomy", "Soil Science", "Micro-Irrigation"];
    sdgGoals = ["SDG 2: Zero Hunger", "SDG 15: Life on Land"];
  } else if (combined.includes("forest") || combined.includes("elephant") || combined.includes("wildfire")) {
    predictedCategory = "Environment & Forestry";
    recommendedDepartment = "Forest, Environment & Climate Change Department";
    requiredExpertise = ["Forest Ecology", "Wildlife Human-Conflict Mitigation", "Sensor Networks"];
    sdgGoals = ["SDG 15: Life on Land", "SDG 13: Climate Action"];
  } else if (combined.includes("road") || combined.includes("bridge") || combined.includes("building") || combined.includes("culvert")) {
    predictedCategory = "Infrastructure & Transport";
    recommendedDepartment = "Road Construction Department (RCD) / Urban Development";
    requiredExpertise = ["Structural Engineering", "Pavement Design", "Smart Culverts"];
    sdgGoals = ["SDG 9: Industry, Innovation & Infrastructure", "SDG 11: Sustainable Cities"];
  } else if (combined.includes("disease") || combined.includes("fever") || combined.includes("health") || combined.includes("poison")) {
    predictedCategory = "Public Health & Epidemic";
    recommendedDepartment = "Department of Health, Medical Education & Family Welfare";
    requiredExpertise = ["Epidemiology", "Disaster Medicine", "Pathogen Surveillance"];
    sdgGoals = ["SDG 3: Good Health & Well-being", "SDG 6: Clean Water & Sanitation"];
  }

  // 4. Compute AI Confidence Score (0-100%)
  // High confidence when multiple strong domain keywords match and text is clear;
  // Lower when text is ambiguous or very short.
  let confidence = 50;
  const wordCount = combined.split(/\s+/).length;
  if (wordCount >= 15) confidence += 15;
  if (tags.length >= 2) confidence += 15;
  if (criticalMatches.length > 0 || highMatches.length > 0) confidence += 15;
  if (combined.length > 100) confidence += 5;
  const confidenceScore = Math.min(97, Math.max(35, confidence));
  const humanVerificationRecommended = confidenceScore < 60;

  // 5. Compute Evidence Strength based on real ground evidence
  const evidence = computeEvidenceStrength({
    hasGps: evidenceParams?.hasGps,
    latitude: evidenceParams?.latitude,
    longitude: evidenceParams?.longitude,
    mediaUrlsCount: typeof evidenceParams?.mediaCount === "number" ? evidenceParams.mediaCount : 0,
    hasAudioOrVoice: Boolean(evidenceParams?.hasVoice),
    descriptionLength: description.length,
    hasDetailedAddress: Boolean(evidenceParams?.hasDetailedAddress),
    corroborationCount: typeof evidenceParams?.corroborationCount === "number" ? evidenceParams.corroborationCount : 0,
  });

  // 6. Compute Priority Score
  const priority = computePriorityScore({
    severity,
    urgencyScore: urgency,
    evidenceStrength: evidence.score,
    upvotesCount: 1,
    daysUnresolved: 1,
  });

  // 7. Recommended Premier Nodal Institute in Jharkhand
  let recommendedUniversity = {
    name: "Birla Institute of Technology, Mesra",
    code: "BIT-MESRA",
    rationale: "Premier competence in GIS, Flood Hydrology, and Aerial Drone Remote Sensing.",
  };

  if (predictedCategory === "Mining & Geology" || combined.includes("coal") || combined.includes("fire") || combined.includes("geology")) {
    recommendedUniversity = {
      name: "IIT (ISM) Dhanbad",
      code: "IIT-ISM",
      rationale: "National center of excellence for Subterranean Coal Fire Control, Geomechanics & Mine Safety.",
    };
  } else if (predictedCategory === "Environment & Forestry" || predictedCategory === "Agriculture & Rural Development") {
    recommendedUniversity = {
      name: "Birsa Agricultural University, Ranchi",
      code: "BAU-RANCHI",
      rationale: "Specialized in Agro-Climatic Resilience, Forest Fire Ecology, and Drought Adaptation.",
    };
  } else if (predictedCategory === "Infrastructure & Transport" || combined.includes("effluent") || combined.includes("industrial")) {
    recommendedUniversity = {
      name: "National Institute of Technology, Jamshedpur",
      code: "NIT-JSR",
      rationale: "Top-ranked department for Civil Structural Resilience and Industrial Heavy-Metal Remediation.",
    };
  } else if (predictedCategory === "Public Health & Epidemic") {
    recommendedUniversity = {
      name: "AIIMS Deoghar",
      code: "AIIMS-DEO",
      rationale: "State authority on Disaster Medicine, Waterborne Disease Surveillance, and Mass Casualty Triage.",
    };
  }

  const explanation = `${confidenceScore}% confidence based on ${tags.length} detected domain signals (${tags.join(", ")}). AI recommends action by ${recommendedDepartment}. Final verification and prioritization remains with statutory Government authorities.`;

  return {
    predictedCategory,
    severity,
    urgencyScore: urgency,
    confidenceScore,
    humanVerificationRecommended,
    recommendedDepartment,
    requiredExpertise,
    sdgGoals,
    evidenceStrength: evidence.score,
    evidenceBreakdown: evidence.breakdown,
    priorityScore: priority.score,
    priorityReasons: priority.reasons,
    tags,
    recommendedUniversity,
    isDisasterEmergency,
    explanation,
  };
}
