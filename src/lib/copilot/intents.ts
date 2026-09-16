import { CopilotIntent, ExtractedEntities, CopilotContext } from "./types";

export const JHARKHAND_DISTRICTS = [
  "Ranchi", "Dhanbad", "Bokaro", "Jamshedpur", "East Singhbhum", "West Singhbhum",
  "Hazaribagh", "Giridih", "Deoghar", "Dumka", "Palamu", "Garhwa", "Latehar",
  "Chatra", "Koderma", "Jamtara", "Sahebganj", "Pakur", "Godda", "Khunti",
  "Simdega", "Lohardaga", "Gumla", "Ramgarh"
];

const HINDI_DISTRICT_MAP: Record<string, string> = {
  "राँची": "Ranchi", "रांची": "Ranchi", "धनबाद": "Dhanbad", "बोकारो": "Bokaro",
  "जमशेदपुर": "Jamshedpur", "हजारीबाग": "Hazaribagh", "गिरिडीह": "Giridih",
  "देवघर": "Deoghar", "दुमका": "Dumka", "पलामू": "Palamu", "गढ़वा": "Garhwa",
  "लातेहार": "Latehar", "चतरा": "Chatra", "कोडरमा": "Koderma", "जामताड़ा": "Jamtara",
  "साहिबगंज": "Sahebganj", "पाकुड़": "Pakur", "गोड्डा": "Godda", "खूंटी": "Khunti",
  "सिमडेगा": "Simdega", "लोहरदगा": "Lohardaga", "गुमला": "Gumla", "रामगढ़": "Ramgarh",
  "पूर्वी सिंहभूम": "East Singhbhum", "पश्चिमी सिंहभूम": "West Singhbhum"
};

export function detectLanguage(text: string): "en" | "hi" {
  // Check for Devanagari script
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  // Check for common Hinglish words
  const hinglishIndicators = [
    "mera", "meri", "mere", "hai", "hain", "kya", "kahan", "kaise", "karein", "bhi",
    "paas", "pani", "gaon", "sadak", "chot", "aag", "khadan", "shikayat", "madad",
    "batao", "dikhao", "bataiye", "raha", "rahi", "rahe", "hoga", "hogi"
  ];
  const words = text.toLowerCase().split(/\s+/);
  const matchCount = words.filter(w => hinglishIndicators.includes(w)).length;
  return matchCount >= 2 ? "hi" : "en";
}

export function extractEntities(text: string, context?: CopilotContext): ExtractedEntities {
  const lower = text.toLowerCase();
  const entities: ExtractedEntities = {
    language: detectLanguage(text)
  };

  // 1. District extraction
  for (const d of JHARKHAND_DISTRICTS) {
    if (lower.includes(d.toLowerCase())) {
      entities.district = d;
      break;
    }
  }
  if (!entities.district) {
    for (const [hiName, enName] of Object.entries(HINDI_DISTRICT_MAP)) {
      if (text.includes(hiName)) {
        entities.district = enName;
        break;
      }
    }
  }
  // Contextual fallback: if user says "it" or doesn't mention district, inherit from previous context
  if (!entities.district && context?.previousEntities?.district) {
    entities.district = context.previousEntities.district;
  }

  // 2. Category & Keywords extraction
  if (
    lower.includes("flood") || lower.includes("waterlog") || lower.includes("बाढ़") ||
    lower.includes("pani bhar") || lower.includes("submerged") || lower.includes("drainage")
  ) {
    entities.category = "Disaster Management";
    entities.keywords = ["flood", "waterlogging", "storm drainage"];
    entities.severity = (lower.includes("severe") || lower.includes("school") || lower.includes("heavy") || lower.includes("bahut")) ? "HIGH" : "MEDIUM";
    entities.urgencyEstimate = entities.severity === "HIGH" ? 85 : 68;
  } else if (
    lower.includes("fire") || lower.includes("mine") || lower.includes("coal") || lower.includes("subsidence") ||
    lower.includes("खदान") || lower.includes("आग") || lower.includes("धंस") || lower.includes("sinkhole")
  ) {
    entities.category = "Mining & Geology";
    entities.keywords = ["coal fire", "subsidence", "toxic gas"];
    entities.severity = "CRITICAL";
    entities.urgencyEstimate = 94;
  } else if (
    lower.includes("water") || lower.includes("fluoride") || lower.includes("drought") ||
    lower.includes("arsenic") || lower.includes("सूखा") || lower.includes("peene ka pani")
  ) {
    entities.category = "Water & Sanitation";
    entities.keywords = ["fluoride contamination", "drinking water", "drought"];
    entities.severity = "HIGH";
    entities.urgencyEstimate = 82;
  } else if (
    lower.includes("road") || lower.includes("bridge") || lower.includes("pothole") ||
    lower.includes("culvert") || lower.includes("सड़क") || lower.includes("पुल") || lower.includes("sadak")
  ) {
    entities.category = "Infrastructure & Transport";
    entities.keywords = ["road damage", "culvert collapse", "potholes"];
    entities.severity = "MEDIUM";
    entities.urgencyEstimate = 65;
  } else if (
    lower.includes("disease") || lower.includes("epidemic") || lower.includes("hospital") ||
    lower.includes("dengue") || lower.includes("cholera") || lower.includes("बीमारी")
  ) {
    entities.category = "Public Health & Epidemic";
    entities.keywords = ["disease outbreak", "medical assistance"];
    entities.severity = "HIGH";
    entities.urgencyEstimate = 88;
  } else if (context?.previousEntities?.category) {
    // Inherit from context if continued
    entities.category = context.previousEntities.category;
    entities.severity = context.previousEntities.severity;
    entities.urgencyEstimate = context.previousEntities.urgencyEstimate;
  }

  // 3. Affected entities/assets
  if (lower.includes("school") || lower.includes("स्कूल")) entities.affected = "school area";
  else if (lower.includes("road") || lower.includes("highway") || lower.includes("sadak")) entities.affected = "main road / transport corridor";
  else if (lower.includes("hospital") || lower.includes("अस्पताल")) entities.affected = "health center / hospital";
  else if (lower.includes("village") || lower.includes("gaon") || lower.includes("गाँव") || lower.includes("गांव")) entities.affected = "residential village";

  // 4. Challenge ID (e.g. cmtzafi... or JS-...)
  const idMatch = text.match(/\b(cmt[a-z0-9]{20,28}|JS-\d{3,6})\b/i);
  if (idMatch) {
    entities.challengeId = idMatch[1];
  }

  return entities;
}

export function classifyIntent(text: string, context?: CopilotContext): { intent: CopilotIntent; confidence: number } {
  const t = text.trim();
  const lower = t.toLowerCase();

  // 0. CHANGE_LANGUAGE (detect explicit language switching request first)
  if (
    lower.includes("change language") || lower.includes("bhasha badlo") || lower.includes("bhasha badalein") ||
    lower.includes("switch to hindi") || lower.includes("switch to english") || lower.includes("hindi mein baat karo") ||
    lower.includes("भाषा बदलें") || lower.includes("hindi me bolein") || lower.includes("language change") ||
    t === "Change language (EN/HI)" || t === "भाषा बदलें (EN/HI)"
  ) {
    return { intent: "CHANGE_LANGUAGE", confidence: 0.98 };
  }

  // 0b. HOW_TO_REPORT (guided problem submission walkthrough)
  if (
    lower.includes("how do i report") || lower.includes("how to report") || lower.includes("how can i report") ||
    lower.includes("how do i submit") || lower.includes("how to submit") || lower.includes("post a problem") ||
    lower.includes("report kaise kare") || lower.includes("shikayat kaise kare") || lower.includes("samay kaise darj kare") ||
    lower.includes("समस्या कैसे दर्ज करें") || lower.includes("शिकायत दर्ज कैसे करें") ||
    t === "How do I report a problem?" || t === "समस्या कैसे दर्ज करें?"
  ) {
    return { intent: "HOW_TO_REPORT", confidence: 0.97 };
  }

  // 0c. VERIFICATION_WORKFLOW (how government verification works)
  if (
    lower.includes("verification") || lower.includes("how does verification") || lower.includes("how verification works") ||
    lower.includes("government review") || lower.includes("govt review") || lower.includes("who verifies") ||
    lower.includes("satapan kya hai") || lower.includes("satapan prakriya") || lower.includes("satyapan") ||
    lower.includes("सत्यापन") || lower.includes("सत्यापन प्रक्रिया") ||
    t === "How does verification work?" || t === "सत्यापन प्रक्रिया क्या है?"
  ) {
    return { intent: "VERIFICATION_WORKFLOW", confidence: 0.97 };
  }

  // 0d. STUDENT_HELP (how students and researchers can join)
  if (
    lower.includes("how can students") || lower.includes("student help") || lower.includes("how can researchers") ||
    lower.includes("researcher help") || lower.includes("how to join as solver") || lower.includes("university solver") ||
    lower.includes("chhatra kaise jodin") || lower.includes("shodh karta kaise") ||
    lower.includes("छात्र और शोधकर्ता") || lower.includes("विश्वविद्यालय कैसे") ||
    t === "How can students help?" || t === "छात्र और शोधकर्ता कैसे जुड़ें?"
  ) {
    return { intent: "STUDENT_HELP", confidence: 0.97 };
  }

  // 0e. CSR_SUPPORT (how companies can support / fund)
  if (
    lower.includes("how can companies") || lower.includes("company support") || lower.includes("companies help") ||
    lower.includes("corporate support") || lower.includes("how to fund") || lower.includes("industry fund") ||
    lower.includes("kampaniya kaise sahyog") || lower.includes("company fund") ||
    lower.includes("कंपनियां कैसे") || lower.includes("उद्योग सहयोग") ||
    t === "How can companies support problems?" || t === "कंपनियां कैसे सहयोग कर सकती हैं?"
  ) {
    return { intent: "CSR_SUPPORT", confidence: 0.97 };
  }


  // 1. EMERGENCY_GUIDANCE (immediate life-threatening situations)
  if (
    lower.includes("bleed") || lower.includes("khoon") || lower.includes("unconscious") ||
    lower.includes("behosh") || lower.includes("behoshi") || lower.includes("can't breathe") ||
    lower.includes("cant breathe") || lower.includes("saans nahi") || lower.includes("choking") ||
    lower.includes("trapped") || lower.includes("phas gaye") || lower.includes("phas gaya") ||
    lower.includes("accident") || lower.includes("severe injury") || lower.includes("injured") ||
    lower.includes("building collapse") || lower.includes("collapsed") || lower.includes("gir gaya") ||
    lower.includes("flood water entered") || lower.includes("pani ghar me") || lower.includes("pani ghus") ||
    lower.includes("snake bite") || lower.includes("saamp") || lower.includes("dying") ||
    lower.includes("heart attack") || lower.includes("सांप") || lower.includes("घायल") ||
    lower.includes("बेहोश") || (lower.includes("fire") && (lower.includes("house") || lower.includes("building") || lower.includes("help") || lower.includes("caught"))) ||
    (lower.includes("emergency") && (lower.includes("help") || lower.includes("112") || lower.includes("now") || lower.includes("madad") || lower.includes("sos")))
  ) {
    return { intent: "EMERGENCY_GUIDANCE", confidence: 0.99 };
  }

  // 2. DISASTER_GUIDANCE (queries/keywords regarding natural or industrial disasters: flood, lightning, heatwave, drought, earthquake, mine hazards)
  const isDisasterQuery =
    /\b(flood|floods|flooding|waterlogging|inundation|submerged|dam overflow|baadh|बाढ़|जलभराव)\b/i.test(lower) ||
    /\b(lightning|vajrapaat|thunderstorm|thunder|bijli girna|वज्रपात|आकाशीय बिजली)\b/i.test(lower) ||
    /\b(heatwave|heat wave|loo|sunstroke|भीषण गर्मी|लू)\b/i.test(lower) ||
    /\b(drought|sukha|सूखा|water crisis|dry spell)\b/i.test(lower) ||
    /\b(earthquake|tremor|bhookamp|bhukamp|भूकंप)\b/i.test(lower) ||
    /\b(landslide|mudslide|rockfall|bhuskhalan|भूस्खलन)\b/i.test(lower) ||
    /\b(coal fire|mine fire|mine subsidence|sinkhole|खदान आग|धंसना|कोयला आग)\b/i.test(lower) ||
    /\b(cyclone|toofan|storm|चक्रवात|तूफान)\b/i.test(lower);

  const isReportingAction =
    lower.includes("there is") || lower.includes("severe") || lower.includes("happening") ||
    lower.includes("near my") || lower.includes("my village") || lower.includes("my house") ||
    lower.includes("broken") || lower.includes("damaged") || lower.includes("aa gaya") ||
    lower.includes("report this") || lower.includes("shikayat") || lower.includes("darj kare") ||
    lower.includes("submit") || lower.includes("file a complaint");

  if (isDisasterQuery && isReportingAction) {
    return { intent: "REPORT_PROBLEM", confidence: 0.95 };
  }
  if (isDisasterQuery) {
    return { intent: "DISASTER_GUIDANCE", confidence: 0.96 };
  }

  // 3. CIVIC_ISSUE_INFO (queries/keywords on civic amenities: roads, potholes, drinking water, electricity, garbage, healthcare)
  const isCivicQuery =
    /\b(road|roads|pothole|potholes|gaddha|sadak|bridge|pul|culvert|street light|सड़क|पुल|गड्ढे)\b/i.test(lower) ||
    /\b(drinking water|fluoride|arsenic|water supply|pipeline leak|peene ka pani|नल का पानी|फ्लोराइड|contaminated water)\b/i.test(lower) ||
    /\b(electricity|power cut|power outage|voltage|transformer|bijli|बिजली|लोड शेडिंग)\b/i.test(lower) ||
    /\b(garbage|kachra|waste|sewer|sewerage|naliyaan|drain|ड्रेनेज|कचरा|सफाई)\b/i.test(lower) ||
    /\b(hospital|clinic|doctor|chc|phc|medicine|dengue|malaria|अस्पताल|स्वास्थ्य)\b/i.test(lower);

  if (isCivicQuery && isReportingAction) {
    return { intent: "REPORT_PROBLEM", confidence: 0.94 };
  }
  if (isCivicQuery) {
    return { intent: "CIVIC_ISSUE_INFO", confidence: 0.93 };
  }

  // 4. TRACK_MY_REPORT ("Where is my complaint?", "report status", "track my report", "mera complaint kaha tak pahucha?")
  if (
    lower.includes("where is my") || lower.includes("track my") || lower.includes("track report") ||
    lower.includes("my report") || lower.includes("mera report") || lower.includes("meri shikayat") ||
    lower.includes("status of my") || lower.includes("complaint status") || lower.includes("kahan hai mera report") ||
    lower.includes("report ka status") || lower.includes("shikayat ki sthiti") || lower.includes("status kya hai") ||
    lower.includes("kaha tak pahucha") || lower.includes("kahan tak pahucha") || lower.includes("mera complaint") ||
    t === "Track my problem" || t === "मेरी समस्या ट्रैक करें"
  ) {
    return { intent: "TRACK_MY_REPORT", confidence: 0.95 };
  }

  // 5. EXPLAIN_AI_ANALYSIS ("Why is my urgency 87?", "Why high priority?", "Explain AI analysis")
  if (
    lower.includes("why is my urgency") || lower.includes("why urgency") || lower.includes("urgency 87") ||
    lower.includes("priority score") || lower.includes("urgency score") || lower.includes("ai analysis") ||
    lower.includes("kyun high") || lower.includes("urgency kyun") || lower.includes("why is my problem high") ||
    lower.includes("ai ne yeh score") || lower.includes("factors used")
  ) {
    return { intent: "EXPLAIN_AI_ANALYSIS", confidence: 0.96 };
  }

  // 6. CHECK_DUPLICATE ("Is this already reported?", "ye problem pehle kisi ne report ki hai?", "Check duplicate")
  if (
    lower.includes("already reported") || lower.includes("pehle se reported") || lower.includes("duplicate") ||
    lower.includes("is this already") || lower.includes("kisi aur ne report") || lower.includes("similar problem") ||
    lower.includes("pehle kisi ne report ki") || lower.includes("pehle se darj")
  ) {
    return { intent: "CHECK_DUPLICATE", confidence: 0.95 };
  }

  // 7. EXPLAIN_JANSAHAYA / WORKFLOW ("What happens after I report?", "how does jansahaya work?", "platform workflow")
  if (
    lower.includes("what happens after") || lower.includes("after verification") || lower.includes("after i report") ||
    lower.includes("how does jansahaya work") || lower.includes("platform workflow") || lower.includes("quad helix") ||
    lower.includes("process kya hai") || lower.includes("report karne ke baad kya hota hai") ||
    lower.includes("how jansahaya works") || lower.includes("jansahaya kaise kaam karta hai") ||
    lower.includes("what is jansahaya") || lower.includes("जनसहाया क्या है") ||
    t === "What is JanSahaya?" || t === "जनसहाया क्या है?"
  ) {
    return { intent: "EXPLAIN_JANSAHAYA", confidence: 0.95 };
  }

  // 8. SOLUTION_STATUS ("What solutions have been proposed?", "solution status", "solutions proposed")
  if (
    (lower.includes("solution") || lower.includes("solutions") || lower.includes("samadhan")) &&
    (lower.includes("proposed") || lower.includes("status") || lower.includes("stage") || lower.includes("kya hai") || lower.includes("milestone"))
  ) {
    return { intent: "SOLUTION_STATUS", confidence: 0.92 };
  }

  // 9. UNIVERSITY_SOLVER_HELP ("Who can solve this?", "Why university matched?", "BIT Mesra", "IIT ISM", "solver help")
  if (
    lower.includes("who can solve") || lower.includes("kaun solve") || lower.includes("university matched") ||
    lower.includes("matched university") || lower.includes("solver help") || lower.includes("iit ism") ||
    lower.includes("bit mesra") || lower.includes("researcher match")
  ) {
    return { intent: "UNIVERSITY_SOLVER_HELP", confidence: 0.93 };
  }

  // 10. CSR_INDUSTRY_HELP ("Can CSR fund this?", "CSR kaise help karega?", "CSR funding", "Tata Steel CSR", "industry support")
  if (
    lower.includes("csr") || lower.includes("fund this") || lower.includes("industry support") ||
    lower.includes("tata steel") || lower.includes("coal india funding") || lower.includes("pledge") ||
    lower.includes("csr kaise help") || lower.includes("company fund")
  ) {
    return { intent: "CSR_INDUSTRY_HELP", confidence: 0.95 };
  }

  // 11. GIS_LOCATION_EXPLORATION ("Where are critical issues?", "which district has most", "gis map", "show map")
  if (
    lower.includes("where are the critical") || lower.includes("which district has") ||
    lower.includes("most active challenges") || lower.includes("gis map") || lower.includes("open map") ||
    lower.includes("show map") || lower.includes("map view") || lower.includes("district pulse")
  ) {
    return { intent: "GIS_LOCATION_EXPLORATION", confidence: 0.92 };
  }

  // 12. FIND_LOCAL_PROBLEMS / FIND_PROBLEMS ("ranchi me abhi kya problems hain?", "problems near me", "active challenges in...", or district name alone like "Ranchi")
  const matchedDistrict = JHARKHAND_DISTRICTS.find(d => lower.includes(d.toLowerCase())) ||
    Object.entries(HINDI_DISTRICT_MAP).find(([hi]) => t.includes(hi))?.[1];

  if (matchedDistrict) {
    // If just the district name was typed (e.g. "Ranchi", "Dhanbad") or asked about problems in it
    if (
      t.length < 35 ||
      lower.includes("what problem") || lower.includes("problems") || lower.includes("active") ||
      lower.includes("challenges") || lower.includes("kya samasya") || lower.includes("show") ||
      lower.includes("dikhao") || lower.includes("kya problem") || lower.includes("abhi kya problems") ||
      lower.includes("civic pulse") || lower.includes("status in") ||
      t.includes("समस्या") || t.includes("चुनौती") || t.includes("हाल") || t.includes("दिखाएं") || t.includes("बताएं")
    ) {
      return { intent: "FIND_PROBLEMS", confidence: 0.94 };
    }
  }

  if (
    lower.includes("near me") || lower.includes("local problems") || lower.includes("problems near") ||
    lower.includes("aaspas") || lower.includes("mere paas") || lower.includes("nearby issues")
  ) {
    return { intent: "FIND_LOCAL_PROBLEMS", confidence: 0.90 };
  }

  // 13. GOVERNMENT_SCHEME_GUIDANCE ("SDRF", "compensation", "yojana", "muawza", "pm relief", "crop loss")
  if (
    lower.includes("scheme") || lower.includes("compensation") || lower.includes("sdrf") ||
    lower.includes("yojana") || lower.includes("muawza") || lower.includes("fasal bima") ||
    lower.includes("pm relief") || lower.includes("मुआवज़ा") || lower.includes("योजना") ||
    lower.includes("government help") || lower.includes("govt scheme") || lower.includes("relief fund")
  ) {
    return { intent: "GOVERNMENT_SCHEME_GUIDANCE", confidence: 0.92 };
  }

  // 14. REPORT_PROBLEM ("There is severe flooding near my village", "mere gaon me pani bhar gaya hai", "broken bridge")
  if (
    lower.includes("there is") || lower.includes("severe") || lower.includes("pani bhar") ||
    lower.includes("aa gaya") || lower.includes("report this") || lower.includes("shikayat karni") ||
    lower.includes("broken") || lower.includes("kharab hai") || lower.includes("waterlogging") ||
    lower.includes("leakage") || lower.includes("landslide") || lower.includes("road is") ||
    lower.includes("bridge crack") || lower.includes("sadak tooti")
  ) {
    return { intent: "REPORT_PROBLEM", confidence: 0.92 };
  }

  // Contextual continuation: if previous was REPORT_PROBLEM and user adds detail e.g. "It is affecting the main road" or "Can I report it?"
  if (context?.previousIntent === "REPORT_PROBLEM") {
    if (lower.includes("it") || lower.includes("report") || lower.includes("main road") || lower.includes("road") || lower.includes("kar sakte") || lower.includes("yes")) {
      return { intent: "REPORT_PROBLEM", confidence: 0.89 };
    }
  }

  // 15. GENERAL_CONVERSATION ("hello", "hi", "namaste", "thank you", casual statements like "I like Sadie Sink", "how are you")
  if (
    /^(hi|hello|hey|namaste|pranam|namaskar|good morning|good afternoon|good evening|kaise ho|kese ho|shukriya|thanks|thank you)\b/i.test(t) ||
    t === "hi" || t === "hello" || t === "नमस्ते" || t === "प्रणाम" ||
    lower.startsWith("i like") || lower.startsWith("i love") || lower.includes("how are you") ||
    lower.includes("tell me a joke") || lower.includes("who is your favorite")
  ) {
    return { intent: "GENERAL_CONVERSATION", confidence: 0.95 };
  }

  // 16. GENERAL_JANSAHAYA_QUESTION ("Who made this?", "What is JanSahaya?")
  if (
    lower.includes("jansahaya") || lower.includes("who created") || lower.includes("who built") ||
    lower.includes("sih") || lower.includes("what can you do") || lower.includes("features")
  ) {
    return { intent: "GENERAL_JANSAHAYA_QUESTION", confidence: 0.88 };
  }

  // 17. General question check (any question mark, or questions starting with what/how/who/why/when/where/is/can)
  if (
    t.includes("?") || lower.startsWith("what") || lower.startsWith("how") || lower.startsWith("who") ||
    lower.startsWith("why") || lower.startsWith("where") || lower.startsWith("when") || lower.startsWith("can") ||
    lower.startsWith("is ") || lower.startsWith("kya ") || lower.startsWith("kaise ") || lower.startsWith("kahan ")
  ) {
    return { intent: "GENERAL_QUESTION", confidence: 0.90 };
  }

  return { intent: "GENERAL_QUESTION", confidence: 0.7 };
}
