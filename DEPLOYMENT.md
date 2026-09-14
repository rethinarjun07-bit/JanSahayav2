# JanSahaya V2 — Vercel Production Deployment & Security Guide

This guide details the complete procedure for deploying the **JanSahaya (SIH26043 - Govt. of Jharkhand)** platform to **Vercel** with full production hardening, security controls, and persistent storage.

---

## 1. Prerequisites

Before deploying to Vercel, ensure you have:
1. A **Vercel Account** ([vercel.com](https://vercel.com)) connected to your GitHub/GitLab/Bitbucket repository.
2. A **Production PostgreSQL Database** (e.g. Supabase, Neon, AWS RDS, or Railway).
   - Must provide both a connection pooled URL (for serverless queries) and a direct URL (for Prisma migrations).
3. A **Persistent Object Storage Bucket**:
   - **Option A (Recommended)**: Cloudflare R2 / AWS S3 / Supabase S3-compatible storage.
   - **Option B**: Vercel Blob Storage.
4. (Optional) **Google Gemini API Key** for multimodal audio transcription and AI synthesis ([aistudio.google.com](https://aistudio.google.com/app/apikey)). *If unset, JanSahaya automatically falls back to its deterministic NLP engine.*
5. A secure **32+ character random JWT secret** (generated via `openssl rand -hex 32`).

---

## 2. Vercel Deployment Steps

### Step 1: Import Project into Vercel
1. Navigate to the **Vercel Dashboard** → Click **Add New...** → **Project**.
2. Select your repository: `JanSahayav2`.
3. Framework Preset: **Next.js** (automatically detected).
4. Root Directory: `./` (default).

### Step 2: Configure Build & Output Settings
- **Build Command**: `npm run build` (which runs `prisma generate && next build`)
- **Output Directory**: `.next` (automatically detected)
- **Install Command**: `npm install` (automatically detected)

### Step 3: Configure Environment Variables
In the **Environment Variables** section in Vercel, add the variables described in Section 3 & 4 below.

### Step 4: Deploy
Click **Deploy**. Vercel will install dependencies, generate the Prisma Client, run Next.js optimizations, and deploy the serverless lambdas.

---

## 3. Environment Variables Specification

### Server-Side Secrets (NEVER expose to browser)

| Variable | Required | Description | Example / Format |
|---|---|---|---|
| `NODE_ENV` | Yes | Application environment | `production` |
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled) | `postgresql://user:pass@ep-xyz.neon.tech:5432/jansahaya?pgbouncer=true` |
| `DIRECT_URL` | Yes | PostgreSQL unpooled connection for migrations | `postgresql://user:pass@ep-xyz.neon.tech:5432/jansahaya` |
| `JWT_SECRET` | Yes | 32+ char cryptographically strong secret | Generate with: `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | No | Session duration (defaults to `7d`) | `7d` or `24h` |
| `DEMO_MODE` | Yes | Must be `false` in production | `false` |
| `GEMINI_API_KEY` | No | Gemini API key for audio/AI synthesis | Server-side API key |
| `SMS_WEBHOOK_SECRET`| Yes | Secret for SMS ingest webhook (`/api/ai/sms-parse`)| Generate with: `openssl rand -hex 24` |
| `CORS_ORIGINS` | No | Allowed production origins | `https://your-project.vercel.app,https://jansahaya.gov.in` |
| `FASTAPI_BACKEND_URL`| No | URL of optional Python backend | Leave empty if not running Python microservice |

### Persistent Storage Configuration (Choose Option A or Option B)

#### Option A: S3 / Cloudflare R2 / Supabase Storage (Recommended)
| Variable | Required | Description |
|---|---|---|
| `STORAGE_PROVIDER` | Yes | Set to `s3` |
| `S3_ENDPOINT` | Yes (for R2/Supabase) | e.g. `https://<accountid>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | Yes | Name of the bucket (e.g. `jansahaya-prod-media`) |
| `S3_REGION` | Yes | AWS region or `auto` for Cloudflare R2 |
| `S3_ACCESS_KEY_ID` | Yes | S3 Access Key ID |
| `S3_SECRET_ACCESS_KEY`| Yes | S3 Secret Access Key |
| `S3_PUBLIC_URL` | Yes | Public CDN URL (e.g. `https://pub-xyz.r2.dev` or custom domain) |

#### Option B: Vercel Blob Storage
| Variable | Required | Description |
|---|---|---|
| `STORAGE_PROVIDER` | Yes | Set to `blob` |
| `BLOB_READ_WRITE_TOKEN`| Yes | Auto-provided by Vercel when linking Blob store |

### Public Configuration (Browser-accessible via NEXT_PUBLIC_*)

| Variable | Required | Description | Value in Production |
|---|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | Yes | Hides demo switcher and demo logins in UI | `false` |

> [!CAUTION]
> Under no circumstances should `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `S3_SECRET_ACCESS_KEY`, or `SMS_WEBHOOK_SECRET` ever be prefixed with `NEXT_PUBLIC_`. Doing so bundles them into the client-side JavaScript bundle!

---

## 4. Database Setup & Prisma Migrations

JanSahaya uses PostgreSQL as its single source of truth.

### Applying Migrations / Schema to Production
Run the following from your local terminal with production connection string, or via CI/CD:
```bash
# Push schema without destroying data:
npx prisma db push

# (Optional) Seed official departments and universities:
npx tsx prisma/seed.ts
```

> [!WARNING]
> NEVER run `prisma migrate reset` in production as it destroys all table data.

---

## 5. Security Architecture & Controls

1. **Fail-Closed Demo Mode**:
   - Centralized gate `isDemoModeEnabled()` guarantees that `/api/auth/demo-switch`, `/api/auth/quick-login`, and demo fallbacks in `/api/challenges`, `/api/upload`, and `/api/csr/pledge` return `401/403` in production.
2. **Serverless Filesystem Defense**:
   - Vercel serverless has a read-only filesystem. JanSahaya routes all file uploads through `src/lib/storage.ts` to persistent object storage (S3/R2/Vercel Blob), preventing `EROFS` crashes.
3. **HTTP Security Headers**:
   - Configured in `next.config.mjs` and `src/middleware.ts`:
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
     - `X-Frame-Options: SAMEORIGIN`
     - `X-Content-Type-Options: nosniff`
     - `X-XSS-Protection: 1; mode=block`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - `Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)`
4. **Rate Limiting**:
   - IP-based token bucket rate limiting on auth endpoints (10 req / 15 min), uploads (10 req / 10 min), problem submissions (10 req / 10 min), and AI queries (10-20 req / min).
5. **Government Authority (ADMIN) Gate**:
   - Citizen and Solver accounts cannot access `/api/admin/*` or verify/merge challenges. Statutory verification requires authorized credentials.

---

## 6. Post-Deployment Smoke Tests

After deploying to Vercel, verify the following:

| Test Case | Expected Result |
|---|---|
| Open Homepage `/` | Loads with Govt. of Jharkhand tricolor branding, statistics, and emergency hotline (1070/112). |
| Demo Switcher Check | Navbar demo dropdown is **hidden** (`NEXT_PUBLIC_DEMO_MODE=false`). |
| POST `/api/auth/demo-switch` | Returns `403 Forbidden` (`code: "DEMO_MODE_DISABLED"`). |
| POST `/api/auth/quick-login` | Returns `403 Forbidden` (`code: "DEMO_MODE_DISABLED"`). |
| Citizen Login `/login/citizen` | Allows legitimate citizen authentication; demo quick-login button hidden. |
| Admin Login `/login/admin` | Requires official credentials; unauthorized users cannot access `/admin`. |
| Problem Intake `/challenges/new` | Validates required fields, prevents path traversal, accepts geo-coordinates. |
| GIS Map `/map` | Renders Leaflet tiles and active civic report markers. |
| Media Upload `/api/upload` | Validates magic bytes (JPEG/PNG/WEBP/MP3), enforces 10MB limit, uploads to S3/Blob. |
| AI Chatbot `/api/ai/chat` | Responds with localized disaster guidance (prompt injection defended). |

---

## 7. Known Limitations & Auxiliary Services

- **Python FastAPI Backend (`backend/`)**:
  - The Next.js platform includes native TypeScript implementations for all core routes (NLP TF-IDF duplicate scoring, disaster severity classification, lifecycle state machine, and auth).
  - The Python backend in `backend/` is an optional auxiliary service. If you choose to deploy it, host it separately (e.g. on Railway, Render, or AWS ECS) and set `FASTAPI_BACKEND_URL=https://your-backend.railway.app`.
