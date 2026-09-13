/**
 * Explainable Solver-Challenge Expertise Matching Engine
 */

export interface SolverProfile {
  id: string;
  name: string;
  organization?: string | null;
  designation?: string | null;
  skills: string[]; // parsed JSON
  district?: string | null;
  state?: string | null;
  karmaPoints?: number;
  solvedCount?: number;
}

export interface ChallengeTarget {
  id: string;
  title: string;
  category: string;
  district: string;
  state: string;
  aiTags: string[];
  description: string;
  urgencyScore?: number;
}

export interface ExplainableMatch {
  solverId: string;
  solverName: string;
  organization: string;
  recommendationType: "Explainable multi-factor solver recommendation";
  matchPercentage: number;
  fitVerdict: "PERFECT_MATCH" | "HIGH_ALIGNMENT" | "GOOD_FIT" | "PARTIAL_FIT";
  matchedSkills: string[];
  disclaimer: string;
  breakdown: {
    skillRelevance: { score: number; max: 40; detail: string };
    districtProximity: { score: number; max: 25; detail: string };
    institutionalAlignment: { score: number; max: 20; detail: string };
    provenTrackRecord: { score: number; max: 15; detail: string };
  };
}

export function computeSolverMatch(
  solver: SolverProfile,
  challenge: ChallengeTarget
): ExplainableMatch {
  const combinedChallengeText = `${challenge.title} ${challenge.description} ${challenge.category} ${challenge.aiTags.join(" ")}`.toLowerCase();

  // 1. Skill Relevance (Max 40 pts)
  const matchedSkills: string[] = [];
  for (const skill of solver.skills) {
    const sLower = skill.toLowerCase();
    if (
      combinedChallengeText.includes(sLower) ||
      challenge.aiTags.some((t) => t.toLowerCase().includes(sLower) || sLower.includes(t.toLowerCase()))
    ) {
      matchedSkills.push(skill);
    }
  }

  let skillPoints = 0;
  if (solver.skills.length > 0) {
    const ratio = matchedSkills.length / Math.min(solver.skills.length, 4);
    skillPoints = Math.min(40, Math.round(ratio * 38) + (matchedSkills.length > 0 ? 5 : 0));
  } else {
    skillPoints = 12; // baseline
  }

  // 2. District & State Proximity (Max 25 pts)
  let districtPoints = 5;
  let proximityDetail = "Regional coverage within India";
  if (solver.district && solver.district.toLowerCase() === challenge.district.toLowerCase()) {
    districtPoints = 25;
    proximityDetail = `Direct on-ground proximity in ${challenge.district}`;
  } else if (solver.state && solver.state.toLowerCase() === challenge.state.toLowerCase()) {
    districtPoints = 18;
    proximityDetail = `Intra-state proximity within ${challenge.state}`;
  }

  // 3. Institutional Alignment (Max 20 pts)
  let instPoints = 8;
  let instDetail = "Multidisciplinary academic lab";
  const orgLower = (solver.organization || "").toLowerCase();

  if (
    (challenge.category.includes("Mining") || combinedChallengeText.includes("subsidence") || combinedChallengeText.includes("coal")) &&
    (orgLower.includes("iit") || orgLower.includes("dhanbad") || orgLower.includes("ism"))
  ) {
    instPoints = 20;
    instDetail = "Center of Excellence: Mining, Coal & Subterranean Geophysics (IIT ISM)";
  } else if (
    (challenge.category.includes("Disaster") || combinedChallengeText.includes("flood") || combinedChallengeText.includes("drone")) &&
    (orgLower.includes("bit") || orgLower.includes("mesra"))
  ) {
    instPoints = 20;
    instDetail = "Specialized Lab: Remote Sensing, Hydrology & Aerial Disaster Mapping (BIT Mesra)";
  } else if (
    (challenge.category.includes("Agriculture") || combinedChallengeText.includes("drought") || combinedChallengeText.includes("forest")) &&
    (orgLower.includes("birsa") || orgLower.includes("bau"))
  ) {
    instPoints = 20;
    instDetail = "Dedicated Agro-Climatic & Forest Ecology Research Division (BAU)";
  } else if (
    (challenge.category.includes("Infrastructure") || combinedChallengeText.includes("industrial") || combinedChallengeText.includes("effluent")) &&
    (orgLower.includes("nit") || orgLower.includes("jamshedpur"))
  ) {
    instPoints = 20;
    instDetail = "National Heavy Industrial Hazard & Smart Materials Division (NIT JSR)";
  } else if (orgLower.length > 3) {
    instPoints = 14;
    instDetail = `Accredited research affiliation with ${solver.organization}`;
  }

  // 4. Proven Track Record & Karma (Max 15 pts)
  const karma = solver.karmaPoints || 100;
  const karmaPoints = Math.min(15, Math.max(5, Math.round((karma / 500) * 15)));
  const trackDetail = `Karma score ${karma} with ${(solver.solvedCount || 1)} past verified implementations`;

  const totalScore = Math.min(99, skillPoints + districtPoints + instPoints + karmaPoints);

  let fitVerdict: "PERFECT_MATCH" | "HIGH_ALIGNMENT" | "GOOD_FIT" | "PARTIAL_FIT" = "GOOD_FIT";
  if (totalScore >= 85) fitVerdict = "PERFECT_MATCH";
  else if (totalScore >= 72) fitVerdict = "HIGH_ALIGNMENT";
  else if (totalScore >= 58) fitVerdict = "GOOD_FIT";
  else fitVerdict = "PARTIAL_FIT";

  return {
    solverId: solver.id,
    solverName: solver.name,
    organization: solver.organization || "Independent Researcher",
    recommendationType: "Explainable multi-factor solver recommendation",
    matchPercentage: totalScore,
    fitVerdict,
    matchedSkills,
    disclaimer: "Advisory score for administrative decision support; statutory solver assignment authority rests with Government Nodal Officers.",
    breakdown: {
      skillRelevance: {
        score: skillPoints,
        max: 40,
        detail: matchedSkills.length > 0 ? `Matched domains: ${matchedSkills.join(", ")}` : "General engineering domain fit",
      },
      districtProximity: {
        score: districtPoints,
        max: 25,
        detail: proximityDetail,
      },
      institutionalAlignment: {
        score: instPoints,
        max: 20,
        detail: instDetail,
      },
      provenTrackRecord: {
        score: karmaPoints,
        max: 15,
        detail: trackDetail,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Solution Intelligence Engine (Comparison of multiple student/uni proposals)
// ---------------------------------------------------------------------------

export interface SolutionProposalTarget {
  id: string;
  title: string;
  abstract: string;
  methodology: string;
  techStack: string[];
  budgetEstimate?: number | null;
  timelineMonths?: number | null;
  teamName?: string | null;
  authorName?: string | null;
  reviewsCount?: number;
  averageRating?: number;
}

export interface SolutionComparisonResult {
  solutionId: string;
  title: string;
  teamName: string;
  feasibilityScore: number; // 1-5
  costEffectivenessScore: number; // 1-5
  scalabilityScore: number; // 1-5
  overallCompositeScore: number; // 0-100
  aiRecommendationVerdict: "RECOMMENDED" | "FEASIBLE" | "ALTERNATIVE";
  strengths: string[];
  considerations: string[];
  rationale: string;
}

export function compareSolutions(
  proposals: SolutionProposalTarget[],
  challengeCategory?: string
): SolutionComparisonResult[] {
  if (proposals.length === 0) return [];

  const results: SolutionComparisonResult[] = proposals.map((p) => {
    let feasibility = 3.8;
    let costEffectiveness = 3.8;
    let scalability = 3.6;
    const strengths: string[] = [];
    const considerations: string[] = [];

    // Evaluate budget
    const budget = p.budgetEstimate || 350000;
    if (budget <= 250000) {
      costEffectiveness = 4.8;
      strengths.push(`Highly frugal budget (₹${(budget / 100000).toFixed(1)}L)`);
    } else if (budget <= 500000) {
      costEffectiveness = 4.2;
      strengths.push(`Standard pilot budget (₹${(budget / 100000).toFixed(1)}L)`);
    } else {
      costEffectiveness = 3.2;
      considerations.push(`Higher capital requirement (₹${(budget / 100000).toFixed(1)}L)`);
    }

    // Evaluate timeline
    const timeline = p.timelineMonths || 4;
    if (timeline <= 3) {
      feasibility += 0.5;
      strengths.push(`Rapid execution window (${timeline} months)`);
    } else if (timeline <= 6) {
      strengths.push(`Viable ${timeline}-month development horizon`);
    } else {
      feasibility -= 0.4;
      considerations.push(`Extended timeline (${timeline} months)`);
    }

    // Methodology & Tech Stack depth
    if (p.techStack && p.techStack.length >= 3) {
      scalability += 0.5;
      strengths.push(`Robust multi-tier stack (${p.techStack.slice(0, 3).join(", ")})`);
    }
    if (p.methodology && p.methodology.length > 150) {
      feasibility += 0.4;
      strengths.push("Comprehensive technical methodology & milestone breakdown");
    }

    // Cap values
    feasibility = Math.min(5.0, Math.max(1.0, Number(feasibility.toFixed(1))));
    costEffectiveness = Math.min(5.0, Math.max(1.0, Number(costEffectiveness.toFixed(1))));
    scalability = Math.min(5.0, Math.max(1.0, Number(scalability.toFixed(1))));

    const overallCompositeScore = Math.round(
      (feasibility / 5) * 40 +
      (costEffectiveness / 5) * 35 +
      (scalability / 5) * 25
    );

    return {
      solutionId: p.id,
      title: p.title,
      teamName: p.teamName || p.authorName || "Innovation Team",
      feasibilityScore: feasibility,
      costEffectivenessScore: costEffectiveness,
      scalabilityScore: scalability,
      overallCompositeScore,
      aiRecommendationVerdict: "FEASIBLE",
      strengths,
      considerations,
      rationale: "",
    };
  });

  // Sort descending by overall composite score
  results.sort((a, b) => b.overallCompositeScore - a.overallCompositeScore);

  // Assign top one as RECOMMENDED, others FEASIBLE or ALTERNATIVE
  return results.map((res, index) => {
    if (index === 0) {
      return {
        ...res,
        aiRecommendationVerdict: "RECOMMENDED",
        rationale: `AI Advisory Top Pick: Highest composite viability (${res.overallCompositeScore}/100) with balanced feasibility (${res.feasibilityScore}/5) and cost efficiency (${res.costEffectivenessScore}/5). Final statutory selection remains with Government Authorities.`,
      };
    } else if (res.overallCompositeScore >= 70) {
      return {
        ...res,
        aiRecommendationVerdict: "FEASIBLE",
        rationale: `Strong alternative proposal (${res.overallCompositeScore}/100) with proven technical merit.`,
      };
    } else {
      return {
        ...res,
        aiRecommendationVerdict: "ALTERNATIVE",
        rationale: `Viable secondary submission with areas for mentor refinement.`,
      };
    }
  });
}

// ---------------------------------------------------------------------------
// CSR Intelligence & Industry Matching Engine
// ---------------------------------------------------------------------------

export interface CSRPartnerProfile {
  id: string;
  name: string;
  companyName: string;
  csrFocusAreas: string[];
  priorityDistricts: string[];
  annualCsrBudgetLakhs?: number;
  contactEmail: string;
}

export interface CSRMatchResult {
  partnerId: string;
  companyName: string;
  alignmentScore: number; // 0-100%
  domainAlignment: string;
  districtAlignment: string;
  estimatedContributionRange: string;
  impactPotential: "HIGH" | "VERY_HIGH" | "MODERATE";
  rationale: string;
}

const DEFAULT_CSR_PARTNERS: CSRPartnerProfile[] = [
  {
    id: "csr-tata",
    name: "Tata Steel CSR Foundation",
    companyName: "Tata Steel Foundation",
    csrFocusAreas: ["Water & Sanitation", "Public Health", "Infrastructure & Transport"],
    priorityDistricts: ["East Singhbhum", "Saraikela Kharsawan", "West Singhbhum", "Ranchi"],
    annualCsrBudgetLakhs: 500,
    contactEmail: "csr@tatasteel.com",
  },
  {
    id: "csr-ccl",
    name: "Central Coalfields Limited CSR",
    companyName: "Central Coalfields Ltd (Coal India)",
    csrFocusAreas: ["Mining & Geology", "Disaster Management", "Water & Sanitation"],
    priorityDistricts: ["Ranchi", "Dhanbad", "Ramgarh", "Bokaro", "Hazaribagh"],
    annualCsrBudgetLakhs: 400,
    contactEmail: "csr@centralcoalfields.in",
  },
  {
    id: "csr-ntpc",
    name: "NTPC Eastern Region CSR",
    companyName: "NTPC Limited",
    csrFocusAreas: ["Environment & Forestry", "Agriculture & Rural Development", "Water & Sanitation"],
    priorityDistricts: ["Ramgarh", "Hazaribagh", "Ranchi", "Chatra"],
    annualCsrBudgetLakhs: 350,
    contactEmail: "csr@ntpc.co.in",
  },
  {
    id: "csr-jindal",
    name: "JSPL CSR Division",
    companyName: "Jindal Steel & Power CSR",
    csrFocusAreas: ["Infrastructure & Transport", "Public Health", "Education"],
    priorityDistricts: ["Ranchi", "Ramgarh", "East Singhbhum"],
    annualCsrBudgetLakhs: 250,
    contactEmail: "csr@jindalsteel.com",
  },
];

export function matchCSRPartners(challenge: {
  category: string;
  district: string;
  urgencyScore?: number;
  budgetEstimate?: number;
}): CSRMatchResult[] {
  return DEFAULT_CSR_PARTNERS.map((partner) => {
    let score = 40; // baseline corporate citizenship
    let domainDetail = "General community welfare focus";
    let districtDetail = "Statewide Jharkhand coverage";

    // 1. Sector focus alignment
    const domainMatch = partner.csrFocusAreas.some(
      (area) =>
        area.toLowerCase().includes(challenge.category.toLowerCase()) ||
        challenge.category.toLowerCase().includes(area.toLowerCase())
    );
    if (domainMatch) {
      score += 35;
      domainDetail = `Direct match with Corporate CSR charter in ${challenge.category}`;
    }

    // 2. Priority district alignment
    const districtMatch = partner.priorityDistricts.some(
      (d) => d.toLowerCase() === challenge.district.toLowerCase()
    );
    if (districtMatch) {
      score += 25;
      districtDetail = `Primary CSR target territory: ${challenge.district}`;
    } else {
      score += 10;
      districtDetail = `Secondary interest region in Jharkhand`;
    }

    const alignmentScore = Math.min(98, score);
    let impactPotential: "HIGH" | "VERY_HIGH" | "MODERATE" = "HIGH";
    if (alignmentScore >= 85) impactPotential = "VERY_HIGH";
    else if (alignmentScore >= 70) impactPotential = "HIGH";
    else impactPotential = "MODERATE";

    const budget = challenge.budgetEstimate || 350000;
    const estRange = `₹${(budget * 0.7 / 100000).toFixed(1)}L – ₹${(budget * 1.1 / 100000).toFixed(1)}L`;

    return {
      partnerId: partner.id,
      companyName: partner.companyName,
      alignmentScore,
      domainAlignment: domainDetail,
      districtAlignment: districtDetail,
      estimatedContributionRange: estRange,
      impactPotential,
      rationale: `${alignmentScore}% strategic CSR alignment: ${domainDetail}, with active programs in ${districtDetail}.`,
    };
  }).sort((a, b) => b.alignmentScore - a.alignmentScore);
}

