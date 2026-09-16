/**
 * Pre-configured SIH 2026 Presentation Demo Personas
 * Used for zero-credential role simulation in Hackathon demonstrations.
 */

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: "CITIZEN" | "SOLVER" | "INDUSTRY" | "ADMIN";
  organization: string;
  designation: string;
  district: string;
  state: string;
  phone: string;
  karmaPoints: number;
  avatar?: string;
  skills: string[];
  badges: Array<{ id: string; name: string; icon: string; date: string }>;
}

export const DEMO_PERSONAS: Record<string, DemoPersona> = {
  CITIZEN: {
    id: "usr_demo_citizen",
    email: "citizen@demo.in",
    name: "Priya Sharma",
    role: "CITIZEN",
    organization: "Morabadi Residents Welfare Association",
    designation: "Secretary",
    district: "Ranchi",
    state: "Jharkhand",
    phone: "+91-9431102938",
    karmaPoints: 280,
    skills: ["Community Organizing", "Ground Verification", "Disaster Reporting"],
    badges: [
      { id: "community_guardian", name: "Community Guardian", icon: "HeartHandshake", date: "2024-02-10" },
      { id: "voice_reporter", name: "Voice Reporter", icon: "Mic", date: "2024-04-05" },
    ],
  },
  SOLVER: {
    id: "usr_demo_solver",
    email: "solver@demo.in",
    name: "Dr. Aarav Mehta",
    role: "SOLVER",
    organization: "Birla Institute of Technology, Mesra",
    designation: "Associate Professor, Dept. of Remote Sensing",
    district: "Ranchi",
    state: "Jharkhand",
    phone: "+91-9835012478",
    karmaPoints: 640,
    skills: ["Remote Sensing", "GIS", "Drone Disaster Assessment", "Flood Modeling", "IoT Sensors"],
    badges: [
      { id: "top_solver", name: "Top Innovation Solver", icon: "Zap", date: "2024-02-15" },
      { id: "jharkhand_star", name: "Jharkhand Innovation Star", icon: "Star", date: "2024-05-12" },
    ],
  },
  INDUSTRY: {
    id: "usr_demo_industry",
    email: "industry@demo.in",
    name: "Tata Steel CSR Foundation",
    role: "INDUSTRY",
    organization: "Tata Steel Foundation, Jamshedpur",
    designation: "Head of Disaster Relief & Rural Innovation",
    district: "East Singhbhum",
    state: "Jharkhand",
    phone: "+91-657-6644000",
    karmaPoints: 950,
    skills: ["CSR Section 135", "Grant Allocation", "Field Pilots", "Disaster Relief"],
    badges: [
      { id: "csr_patron", name: "CSR Mega Patron", icon: "Building2", date: "2024-01-01" },
      { id: "green_impact", name: "Eco Sustainability Leader", icon: "Leaf", date: "2024-03-10" },
    ],
  },
  ADMIN: {
    id: "usr_demo_admin",
    email: "admin@demo.in",
    name: "Sri Rajesh Kumar Sinha, IAS",
    role: "ADMIN",
    organization: "Govt. of Jharkhand - Disaster Management Cell",
    designation: "Principal Secretary & Nodal Officer",
    district: "Ranchi",
    state: "Jharkhand",
    phone: "+91-651-2446900",
    karmaPoints: 1250,
    skills: ["Disaster Management", "Statutory Authority", "Inter-Agency Coordination"],
    badges: [
      { id: "gov_nodal", name: "State Nodal Officer", icon: "ShieldAlert", date: "2024-01-15" },
      { id: "disaster_lead", name: "Disaster Commander", icon: "Award", date: "2024-03-20" },
    ],
  },
};
