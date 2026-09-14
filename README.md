# JanSahaya — Societal Innovation Collaboration Portal
### Problem Statement: **SIH26043** | Govt. of Jharkhand | Disaster Management | Software

> **Built for Smart India Hackathon 2026.** A production-ready, full-stack crowdsourcing and collaborative problem-solving platform where citizens, universities, researchers, and industry CSR partners unite to tackle real-world disaster and societal challenges across all Indian districts.

---

## 🏛️ Platform Overview

JanSahaya (जनसहाय — "People's Support & Resolution") is a national-grade digital infrastructure that:

- **Citizens** report ground-level societal problems with GPS, photos, and voice (Hindi/English)
- **AI/NLP** auto-classifies the challenge, detects duplicates, and scores urgency in real-time
- **Government officers** verify, triage, and assign challenges to empaneled universities with printable official certificates
- **Researchers & Labs** receive explainability-ranked matched challenges and submit stage-gated solution proposals
- **Industry CSR partners** co-sponsor pilots under Section 135, pledge capital, and officially endorse deployed solutions
- **Mentors & Reviewers** evaluate proposals with a 5-axis rubric scoring dashboard
- **Everyone** can track progress through an interactive GIS disaster heatmap and gamified leaderboard

---

## 🎯 7 Core Differentiators Implemented

| # | Differentiator | Implementation Location |
|---|----------------|------------------------|
| 1 | **Intelligent Duplicate Detection** | TF-IDF + N-gram cosine similarity engine (`src/lib/nlp/tfidf.ts`); live warning banner at challenge intake |
| 2 | **Automatic AI Classification** | Keyword-based categorizer with urgency scoring 1–100 (`src/lib/nlp/classifier.ts`); runs on every POST |
| 3 | **Expertise-Based Solver Matching** | Multi-factor explainable match algorithm (`src/lib/nlp/matcher.ts`); Solver Dashboard shows ranked feed |
| 4 | **Voice Transcription & Hindi/English** | Web Speech API voice dictation modal (`src/components/voice-input-modal.tsx`); full EN↔HI i18n (`src/lib/i18n/index.ts`) |
| 5 | **Government-Aided Workflows** | Verification console with printable statutory certificate (`/admin/verify/[id]`); audit trail in DB |
| 6 | **Dynamic Animations** | Framer Motion transitions, Tailwind custom keyframes, pulsing Leaflet markers across all pages |
| 7 | **Gamified Celebratory Effects** | `canvas-confetti` multi-burst, Web Audio procedural chimes (`src/lib/sound.ts`), badge## 🗂️ Unified System Architecture & Technology Stack

JanSahaya uses an integrated full-stack architecture with clear separation of responsibilities:

| Layer | Technology & Role |
|-------|-------------------|
| **Primary Full-Stack & API** | **Next.js 14 (App Router) + TypeScript** (`src/`) — Full-stack web application, server-side route handlers, robust JWT + bcrypt security, RBAC middleware, and real-time civic workflows |
| **Relational Database** | **PostgreSQL 16 + Prisma ORM** (`prisma/schema.prisma`) — Production-grade relational storage with connection pooling (`DATABASE_URL`) and direct migration support (`DIRECT_URL`) |
| **Persistent Object Storage**| **Storage Abstraction Layer** (`src/lib/storage.ts`) — Decoupled storage supporting AWS S3, Cloudflare R2, and Vercel Blob with magic-byte validation and traversal defense |
| **Hybrid Civic Intelligence** | **Deterministic NLP + TF-IDF + Gemini Cascade** (`src/lib/nlp/`) — 3-tier intelligence engine: Local keyword rules & urgency scoring (Tier 1), TF-IDF N-gram duplicate detection & geospatial clustering (Tier 2), and multimodal Gemini LLM with offline fallback (Tier 3) |
| **Auxiliary AI Microservice** | **Python (FastAPI)** (`backend/`) — Optional companion microservice for advanced Scikit-Learn pipelines, batch ML clustering, and server-side speech models (deployable separately if desired) |
| **GIS & Visualization** | **Leaflet + Recharts + Framer Motion** — Interactive geographic disaster heatmap, pulsing severity indicators, and analytical charts |
| **Containerization** | **Docker Compose** (`docker-compose.yml`) — Containerized deployment for PostgreSQL + Next.js + Python |

---

## 🚀 Quick Start

### 1. Instant Local Run (Zero-Config SQLite — Recommended for SIH Evaluation)
```bash
# 1. Install dependencies
npm install

# 2. Push database schema (creates local dev.db)
npx prisma db push

# 3. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

### 2. Full-Stack with Auxiliary Python (FastAPI) Backend
```bash
# Windows 1-click script (starts FastAPI on port 8000 and Next.js on port 3000):
start_all.bat

# Or run FastAPI separately:
start_backend.bat
```

---

### 3. Production Deployment with PostgreSQL 16
```bash
# Set your PostgreSQL connection string in .env:
# DATABASE_URL="postgresql://<db_user>:<db_password>@<db_host>:5432/<db_name>?schema=public"

# Sync schema and generate client
npx prisma db push

# Build production bundle
npm run build
npm start
```

---

## 🔑 Demonstration Personas & 1-Click Role Switcher
> **SECURITY NOTICE**: All personas, accounts, and credentials listed below are **SIMULATED DEMONSTRATION IDENTITIES** strictly for testing and hackathon evaluation. **Demo credentials — development/presentation only. Never use these credentials in production.**

The login page (`/login`) features a **1-Click Persona Switcher** for instantaneous hackathon demonstration:

| Role | Email | Password | Simulated Demo Persona |
|------|-------|----------|------------------------|
| 🏛️ **Government (Admin)** | `admin@demo.in` | `Admin@123` | Sri Rajesh Kumar Sinha — State Disaster Triage Officer |
| 👤 **Citizen Reporter** | `citizen@demo.in` | `Citizen@123` | Priya Sharma — Community Volunteer, Namkum |
| 🔬 **Research Solver** | `solver@demo.in` | `Solver@123` | Dr. Aarav Mehta — University Disaster Tech Lab |
| 🏭 **Industry / CSR** | `industry@demo.in` | `Industry@123` | Corporate Social Responsibility Foundation Partner |
---

## 🗺️ Complete Page Directory

### Public Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page with live ticker, counters, 4-step workflow, differentiator showcase |
| `/login` | 1-click role switcher + credential form |
| `/register` | Multi-role registration (Citizen / Solver / Industry) |
| `/challenges` | Full catalog with 7-way search/filter (district, category, severity, status) |
| `/challenges/new` | Multi-step challenge intake wizard with voice input & live duplicate detection |
| `/challenges/[id]` | Detailed challenge view with comments, upvotes, solutions list |
| `/map` | Full-screen Leaflet GIS disaster heatmap with pulsing severity markers |
| `/leaderboard` | Gamified solver & university rankings with podium animation |
| `/analytics` | Recharts impact dashboard (category, severity, district, funnel) |

### Admin (Govt Officer) Pages
| Route | Description |
|-------|-------------|
| `/admin` | Command center with challenge triage queue |
| `/admin/duplicates` | Side-by-side duplicate merge console (NLP similarity shown) |
| `/admin/assignments` | University assignment console with AI-suggested routing |
| `/admin/verify/[id]` | Official verification + printable statutory inspection certificate |

### Solver / Researcher Pages
| Route | Description |
|-------|-------------|
| `/solver/dashboard` | AI-matched challenge feed with explainable fit scores + proposal tracker |
| `/solver/profile` | Profile showcase with badges, karma, solution portfolio |

### Solution Pages
| Route | Description |
|-------|-------------|
| `/solutions/[id]` | Full solution workspace: stage-gate milestones, mentor rubric reviews, endorsement |
| `/solutions/compare` | Side-by-side multi-proposal comparison matrix |

### Industry Pages
| Route | Description |
|-------|-------------|
| `/industry` | CSR co-sponsorship portal with pledge modal and 80G grant tracking |

---

## 🔌 REST API Reference

### Auth Endpoints
```
POST /api/auth/register       — Create account (CITIZEN / SOLVER / INDUSTRY / ADMIN)
POST /api/auth/login          — Authenticate and set HTTP-only JWT cookie
POST /api/auth/quick-login    — 1-click demo persona login
GET  /api/auth/me             — Current session user
POST /api/auth/logout         — Clear session
```

### Challenge Endpoints
```
GET  /api/challenges                   — Catalog with ?search, ?district, ?category, ?severity, ?status, ?page
POST /api/challenges                   — Create challenge (runs AI classify + duplicate check)
GET  /api/challenges/[id]             — Single challenge with relations
PUT  /api/challenges/[id]             — Update status / official notes (admin)
POST /api/challenges/[id]/upvote      — Toggle upvote + award karma
GET  /api/challenges/[id]/comments    — List comments
POST /api/challenges/[id]/comments    — Post comment
POST /api/duplicate-check             — Real-time similarity score (title + description)
```

### Admin / NLP Endpoints
```
POST /api/admin/merge         — Merge duplicate challenge into master (rollup votes/comments)
POST /api/admin/assign        — Assign challenge to university
POST /api/admin/verify        — Issue official verification + generate certificate ID
GET  /api/match-solvers       — ?challengeId or ?solverId — ranked explainable matches
```

### Solution Endpoints
```
GET  /api/solutions           — List all solutions
POST /api/solutions           — Submit solution proposal + auto-create milestones
GET  /api/solutions/[id]      — Solution with milestones, reviews, comments
PUT  /api/solutions/[id]      — Update milestone status (admin/mentor)
POST /api/solutions/[id]/review   — Multi-factor rubric scoring review
POST /api/solutions/[id]/endorse  — Issue official government/industry endorsement
```

### Utility Endpoints
```
GET  /api/analytics    — Aggregated metrics for analytics dashboard
GET  /api/universities — List of partnered institutes
POST /api/upload       — Multipart file upload → public/uploads/
```

---

## 🗄️ Database Schema Summary

```
User              — role (ADMIN|CITIZEN|SOLVER|INDUSTRY|MENTOR), karmaPoints, badges
Challenge         — title, description, category, severity, district, GPS, urgencyScore, aiTags
DuplicateMerge    — tracks merge operations with similarity score and audit note
Solution          — abstract, methodology, techStack, budgetEstimate, milestoneStage
Milestone         — order, title, description, status (PENDING|SUBMITTED|APPROVED)
Review            — rating, feasibilityScore, impactScore, costEffectiveness, scalabilityScore
Upvote            — Challenge ↔ User (unique constraint)
Comment           — polymorphic for Challenge and Solution
University        — name, code, district, departments, expertiseTags, nodalOfficerName
Notification      — user, title, body, isRead, type
AuditLog          — action, entityType, entityId, actorId, actorName, details
```

---

## 🌱 Seed Data Summary

Run `npx tsx prisma/seed.ts` to populate:

- **4 core demo users** (Admin, Citizen, Solver, Industry)
- **11 additional solver profiles** — BIT Mesra, IIT ISM Dhanbad, NIT Jamshedpur, Birsa Agricultural University, AIIMS Deoghar, Ranchi University
- **4 industry CSR partners** — Tata Steel, Coal India Green Tech, Jindal Foundation, Infosys Springboard
- **6 partner universities** with departments and nodal officers
- **25 realistic challenges** (16 Jharkhand + 9 National) including:
  - 3 deliberate near-duplicates (Morabadi flood, Jharia coal fire, Palamu fluoride drought) — for demonstrating NLP deduplication
  - Mix of CRITICAL / HIGH / MEDIUM severity across 18 districts
- **Active solutions** with stage-gate milestones, multi-factor rubric reviews, upvotes, and comments

---

## 🏗️ Project Architecture

```
jansahaya/
├── prisma/
│   ├── schema.prisma          PostgreSQL schema (Prisma ORM)
│   └── seed.ts               Comprehensive demo data seeder
│
├── src/
│   ├── app/
│   │   ├── api/              REST API route handlers
│   │   ├── admin/            Govt officer pages
│   │   ├── solver/           Researcher workspace
│   │   ├── solutions/        Solution workspace + compare
│   │   ├── challenges/       Catalog + intake wizard + detail
│   │   ├── analytics/        Recharts dashboard
│   │   ├── industry/         CSR portal
│   │   ├── leaderboard/      Gamified rankings
│   │   ├── map/              Leaflet GIS heatmap
│   │   ├── login/ register/  Auth pages
│   │   ├── layout.tsx        Root layout with navbar/footer
│   │   └── page.tsx          Landing page
│   │
│   ├── components/
│   │   ├── navbar.tsx               Header with 1-click switcher
│   │   ├── footer.tsx               Government informatics footer
│   │   ├── leaflet-map.tsx          Dynamic client-side Leaflet
│   │   ├── celebration-effects.tsx  canvas-confetti triggers
│   │   ├── badge-unlock-modal.tsx   Gamified badge popup
│   │   ├── voice-input-modal.tsx    Web Speech API dictation
│   │   ├── duplicate-alert.tsx      Live NLP warning banner
│   │   ├── explainable-card.tsx     Solver match breakdown card
│   │   └── language-provider.tsx    EN↔HI i18n context
│   │
│   └── lib/
│       ├── db.ts                    Prisma singleton
│       ├── auth.ts                  JWT + bcrypt utilities
│       ├── sound.ts                 Web Audio synthesizer
│       ├── validators.ts            Zod schemas
│       ├── i18n/index.ts            EN + HI localization
│       ├── data/jharkhand-districts.ts  24 districts + GPS
│       └── nlp/
│           ├── tfidf.ts             Duplicate detection engine
│           ├── classifier.ts        Auto categorize + urgency
│           └── matcher.ts           Explainable solver matching
```

---

## 🔒 Security Architecture

- Passwords hashed with **bcryptjs** (10 salt rounds)
- Session auth via **HTTP-only, Secure, SameSite=Strict JWT cookies** (7-day duration)
- Cryptographically strong `JWT_SECRET` (enforced 32+ characters in production)
- Strict RBAC: CITIZEN, SOLVER, INDUSTRY, ADMIN (ADMIN cannot be self-registered)
- Statutory gate: **Government Authority alone** verifies challenges and selects solutions
- Quad-Helix lifecycle state machine (`src/lib/lifecycle.ts`) rejects invalid state transitions
- File uploads validated by **magic-byte signature**, MIME type, path traversal defense, and 10 MB limit
- Persistent storage abstraction layer supporting AWS S3, Cloudflare R2, and Vercel Blob
- Comprehensive HTTP security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)

---

## 🌐 SIH26043 Problem Statement Mapping

| Requirement | Implementation |
|-------------|---------------|
| Crowdsource societal challenges | `/challenges/new` — multi-step wizard with GPS, photo, voice |
| All districts across India | 24 Jharkhand + all Indian states in `jharkhand-districts.ts` |
| Duplicate challenge detection | Real-time TF-IDF cosine similarity at intake |
| Auto classification | Keyword NLP → category + urgency score |
| University collaboration | University Assignment Console, nodal officer notifications |
| Industry partnerships | CSR Portal with pledge modal and endorsement seals |
| Government verification | Official verification certificate with statutory checklist |
| Multilingual support | Hindi + English with instant toggle |
| GIS visualization | Full-screen Leaflet heatmap with severity pins |
| Analytics | National + Jharkhand Recharts dashboard |
| Gamification | Leaderboard, karma, badges, confetti, fanfare |
| Solver matching | Multi-factor explainable match algorithm |

---

## 📦 Environment Variables & Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the complete production setup and Vercel step-by-step guide.

```env
# .env.example (Production / Staging Template)
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>?pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/<database>"
JWT_SECRET="<generate-a-secure-random-32-character-secret-in-production>"
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
STORAGE_PROVIDER="s3" # or "blob"
```

---

## 🧪 Running Tests

```bash
# Type check
npx tsc --noEmit

# Full production build validation
npm run build

# Development server
npm run dev
```

---

## 🙏 Credits

Built for **Smart India Hackathon 2026** — Problem Statement **SIH26043**  
**Organization:** Government of Jharkhand, Department of Disaster Management  
**Category:** Software | Theme: Disaster Management & Societal Innovation
