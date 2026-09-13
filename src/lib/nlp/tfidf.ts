/**
 * In-memory TF-IDF + N-Gram Cosine Similarity Engine.
 * 100% self-contained, offline, deterministic duplicate detection.
 */

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did",
  "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have",
  "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in",
  "into", "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not",
  "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over",
  "own", "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
  "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
  "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with",
  "would", "you", "your", "yours", "yourself", "yourselves",
  // Hindi romanized stopwords
  "hai", "hain", "ko", "se", "ka", "ki", "ke", "mein", "aur", "ya", "yeh", "woh", "bhi", "par", "hota", "hoti",
]);

export function tokenize(text: string): string[] {
  if (!text) return [];
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const rawWords = clean.split(/\s+/).filter((w) => w.length > 2);
  const words = rawWords.filter((w) => !STOP_WORDS.has(w));

  // Add bigrams for context (e.g. "flash flood", "mine subsidence", "water logging")
  const tokens = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]}_${words[i + 1]}`);
  }
  return tokens;
}

export function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  if (tokens.length === 0) return tf;

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  // Normalize by total tokens
  for (const [token, count] of tf.entries()) {
    tf.set(token, count / tokens.length);
  }
  return tf;
}

export function computeIDF(corpusTokens: string[][]): Map<string, number> {
  const N = corpusTokens.length;
  const idf = new Map<string, number>();
  if (N === 0) return idf;

  const docFreq = new Map<string, number>();
  for (const doc of corpusTokens) {
    const uniqueTokens = new Set(doc);
    for (const token of uniqueTokens) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  for (const [token, count] of docFreq.entries()) {
    idf.set(token, Math.log((N + 1) / (count + 1)) + 1);
  }
  return idf;
}

export function cosineSimilarity(
  tf1: Map<string, number>,
  tf2: Map<string, number>,
  idf: Map<string, number>
): { score: number; commonKeywords: string[] } {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  const commonKeywords: string[] = [];

  const allTokens = new Set([...tf1.keys(), ...tf2.keys()]);

  for (const token of allTokens) {
    const w1 = (tf1.get(token) || 0) * (idf.get(token) || 1);
    const w2 = (tf2.get(token) || 0) * (idf.get(token) || 1);

    if (w1 > 0 && w2 > 0) {
      if (!token.includes("_")) {
        commonKeywords.push(token);
      }
    }

    dotProduct += w1 * w2;
    norm1 += w1 * w1;
    norm2 += w2 * w2;
  }

  if (norm1 === 0 || norm2 === 0) {
    return { score: 0, commonKeywords: [] };
  }

  const score = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  return { score: Math.min(1, Math.max(0, score)), commonKeywords };
}

export interface DuplicateCandidate {
  id: string;
  title: string;
  district: string;
  category: string;
  similarityPercentage: number;
  confidence: "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW";
  matchingKeywords: string[];
}

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== "number" || typeof lon1 !== "number" ||
    typeof lat2 !== "number" || typeof lon2 !== "number" ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) ||
    lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
    lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180
  ) {
    return 999;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export interface DuplicateCandidate {
  id: string;
  title: string;
  district: string;
  category: string;
  distanceKm?: number;
  similarityPercentage: number;
  confidence: "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW";
  matchingKeywords: string[];
  reasons: string[];
}

/**
 * Computes explicit weighted term frequency for title (e.g. weight=2) and description (weight=1)
 * without invisible text string duplication.
 */
export function computeWeightedDocumentTokens(
  title: string,
  description: string,
  titleWeight: number = 2,
  descriptionWeight: number = 1
): { tokens: string[]; tf: Map<string, number> } {
  const titleTokens = tokenize(title);
  const descTokens = tokenize(description);

  const tokenWeights = new Map<string, number>();
  let totalWeightedTokens = 0;

  for (const token of titleTokens) {
    tokenWeights.set(token, (tokenWeights.get(token) || 0) + titleWeight);
    totalWeightedTokens += titleWeight;
  }

  for (const token of descTokens) {
    tokenWeights.set(token, (tokenWeights.get(token) || 0) + descriptionWeight);
    totalWeightedTokens += descriptionWeight;
  }

  const tf = new Map<string, number>();
  if (totalWeightedTokens > 0) {
    for (const [token, weight] of tokenWeights.entries()) {
      tf.set(token, weight / totalWeightedTokens);
    }
  }

  // Tokens for vocabulary / IDF indexing
  const tokens = Array.from(new Set([...titleTokens, ...descTokens]));
  return { tokens, tf };
}

export function evaluateDuplicates(
  target: {
    title: string;
    description: string;
    district?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    createdAt?: Date | string;
  },
  corpus: Array<{
    id: string;
    title: string;
    description: string;
    district?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    createdAt?: Date | string;
  }>,
  threshold: number = 0.40
): DuplicateCandidate[] {
  // Title weight = 2, Description weight = 1 (explicit weighting)
  const targetDoc = computeWeightedDocumentTokens(target.title, target.description, 2, 1);
  const corpusDocs = corpus.map((c) => computeWeightedDocumentTokens(c.title, c.description, 2, 1));

  const allTokenDocs = corpusDocs.map((d) => d.tokens);
  allTokenDocs.push(targetDoc.tokens);
  const idf = computeIDF(allTokenDocs);

  const candidates: DuplicateCandidate[] = [];

  for (let i = 0; i < corpus.length; i++) {
    const item = corpus[i];
    const itemDoc = corpusDocs[i];

    const { score: rawCosine, commonKeywords } = cosineSimilarity(targetDoc.tf, itemDoc.tf, idf);
    const reasons: string[] = [];

    // 1. Text similarity
    let finalScore = rawCosine;
    if (rawCosine > 0.4) {
      reasons.push(`${Math.round(rawCosine * 100)}% vocabulary & phrase overlap`);
    }

    // 2. Geospatial proximity
    let distanceKm: number | undefined = undefined;
    if (target.latitude && target.longitude && item.latitude && item.longitude) {
      distanceKm = calculateHaversineDistanceKm(
        target.latitude,
        target.longitude,
        item.latitude,
        item.longitude
      );
      if (distanceKm <= 1.0) {
        finalScore += 0.20;
        reasons.push(`Close proximity: ${distanceKm} km away`);
      } else if (distanceKm <= 3.5) {
        finalScore += 0.12;
        reasons.push(`Nearby vicinity: ${distanceKm} km away`);
      }
    } else if (target.district && item.district && target.district.toLowerCase() === item.district.toLowerCase()) {
      finalScore += 0.10;
      reasons.push(`Same administrative district (${target.district})`);
    }

    // 3. Category match
    if (target.category && item.category && target.category.toLowerCase() === item.category.toLowerCase()) {
      finalScore += 0.10;
      reasons.push(`Same civic sector: ${target.category}`);
    }

    // 4. Temporal proximity (within 30 days)
    if (target.createdAt && item.createdAt) {
      const diffDays = Math.abs(
        (new Date(target.createdAt).getTime() - new Date(item.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 7) {
        finalScore += 0.08;
        reasons.push("Reported within 7 days of each other (+8%)");
      } else if (diffDays <= 30) {
        finalScore += 0.04;
        reasons.push("Reported within 30 days of each other (+4%)");
      }
    }

    // Cap at 0.99 unless exact
    const similarityPercentage = Math.round(Math.min(0.99, finalScore) * 100);

    if (similarityPercentage >= threshold * 100) {
      let confidence: "VERY_HIGH" | "HIGH" | "MODERATE" | "LOW" = "LOW";
      if (similarityPercentage >= 80) confidence = "VERY_HIGH";
      else if (similarityPercentage >= 65) confidence = "HIGH";
      else if (similarityPercentage >= 50) confidence = "MODERATE";

      candidates.push({
        id: item.id,
        title: item.title,
        district: item.district || "Unknown",
        category: item.category || "General",
        distanceKm,
        similarityPercentage,
        confidence,
        matchingKeywords: Array.from(new Set(commonKeywords)).slice(0, 6),
        reasons,
      });
    }
  }

  return candidates.sort((a, b) => b.similarityPercentage - a.similarityPercentage);
}

export interface CivicClusterResult {
  clusterName: string;
  category: string;
  district: string;
  latitude: number;
  longitude: number;
  reportCount: number;
  urgencyScore: number;
  challengeIds: string[];
  challengeTitles: string[];
  approximateAffectedPopulation: string;
}

export function detectCivicClusters(
  challenges: Array<{
    id: string;
    title: string;
    category: string;
    district: string;
    latitude: number;
    longitude: number;
    urgencyScore: number;
  }>,
  radiusKm: number = 2.5
): CivicClusterResult[] {
  const clusters: CivicClusterResult[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < challenges.length; i++) {
    const root = challenges[i];
    if (visited.has(root.id)) continue;

    const group = [root];
    for (let j = i + 1; j < challenges.length; j++) {
      const candidate = challenges[j];
      if (visited.has(candidate.id)) continue;
      if (candidate.category !== root.category) continue;

      const dist = calculateHaversineDistanceKm(
        root.latitude,
        root.longitude,
        candidate.latitude,
        candidate.longitude
      );

      if (dist <= radiusKm) {
        group.push(candidate);
      }
    }

    if (group.length >= 2) {
      group.forEach((c) => visited.add(c.id));

      const avgLat = group.reduce((sum, c) => sum + c.latitude, 0) / group.length;
      const avgLng = group.reduce((sum, c) => sum + c.longitude, 0) / group.length;
      const maxUrgency = Math.max(...group.map((c) => c.urgencyScore));

      clusters.push({
        clusterName: `Emerging Civic Cluster: ${root.category} in ${root.district}`,
        category: root.category,
        district: root.district,
        latitude: Number(avgLat.toFixed(4)),
        longitude: Number(avgLng.toFixed(4)),
        reportCount: group.length,
        urgencyScore: Math.min(98, maxUrgency + group.length * 3),
        challengeIds: group.map((c) => c.id),
        challengeTitles: group.map((c) => c.title),
        approximateAffectedPopulation: `Preliminary impact estimate: ~${group.length * 450} to ${group.length * 1200} citizens in 2.5km vicinity (preliminary geographic density heuristic; subject to statutory census/GIS calibration)`,
      });
    }
  }

  return clusters.sort((a, b) => b.reportCount - a.reportCount);
}

