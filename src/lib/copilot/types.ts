export type CopilotIntent =
  | "REPORT_PROBLEM"
  | "HOW_TO_REPORT"
  | "TRACK_MY_REPORT"
  | "FIND_PROBLEMS"
  | "FIND_LOCAL_PROBLEMS"
  | "CHECK_DUPLICATE"
  | "EXPLAIN_AI_ANALYSIS"
  | "EMERGENCY_GUIDANCE"
  | "DISASTER_GUIDANCE"
  | "CIVIC_ISSUE_INFO"
  | "GIS_EXPLORATION"
  | "GIS_LOCATION_EXPLORATION"
  | "EXPLAIN_JANSAHAYA"
  | "GOVERNMENT_WORKFLOW"
  | "VERIFICATION_WORKFLOW"
  | "SOLUTION_STATUS"
  | "UNIVERSITY_SOLVER_HELP"
  | "STUDENT_HELP"
  | "CSR_INDUSTRY_HELP"
  | "CSR_SUPPORT"
  | "GOVERNMENT_HELP"
  | "GOVERNMENT_SCHEME_GUIDANCE"
  | "CHANGE_LANGUAGE"
  | "GENERAL_JANSAHAYA_QUESTION"
  | "GENERAL_CONVERSATION"
  | "GENERAL_QUESTION"
  | "UNKNOWN";

export interface CopilotAction {
  label: string;
  url?: string;
  prompt?: string;
  variant?: "primary" | "secondary" | "danger" | "outline";
  icon?: string;
}

export interface CopilotCardItem {
  label: string;
  value: string;
  badge?: string;
  badgeColor?: "red" | "amber" | "green" | "blue" | "slate";
}

export interface CopilotCard {
  type:
    | "problem_report"
    | "challenge_pulse"
    | "report_tracker"
    | "ai_explanation"
    | "duplicate_alert"
    | "emergency_banner"
    | "solutions_list"
    | "workflow_stages";
  title: string;
  items?: CopilotCardItem[];
  meta?: Record<string, unknown>;
}

export interface ExtractedEntities {
  district?: string;
  category?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  urgencyEstimate?: number;
  keywords?: string[];
  affected?: string;
  problemDescription?: string;
  challengeId?: string;
  language?: "en" | "hi";
}

export interface CopilotUserSession {
  userId: string;
  name: string;
  email: string;
  role: string;
  district?: string;
}

export interface CopilotContext {
  user?: CopilotUserSession | null;
  history?: Array<{ role: "user" | "model"; text: string }>;
  previousIntent?: CopilotIntent;
  previousEntities?: ExtractedEntities;
}

export interface CopilotResponse {
  reply: string;
  intent: CopilotIntent;
  confidence: number;
  actions: CopilotAction[];
  card?: CopilotCard;
  isDemo: boolean;
  detectedLanguage: "en" | "hi";
  groundedSource?: string;
}
