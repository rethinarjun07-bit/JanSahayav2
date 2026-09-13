-- ==============================================================================
-- JanSahaya Enterprise Security Hardening: Supabase PostgreSQL RLS & Column Access
-- ==============================================================================

-- 1. Enable Row Level Security on all public application tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "duplicate_merges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "solutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "milestones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "upvotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "universities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "civic_clusters" ENABLE ROW LEVEL SECURITY;

-- 2. Audit Logs: Strictly confidential internal table
-- Deny all direct PostgREST operations to anon and authenticated clients.
-- Trusted server-side operations (Next.js via Prisma DB Owner) retain full access.
REVOKE ALL ON "audit_logs" FROM anon, authenticated;

-- 3. Users Table: Sensitive Column Protection
-- Deny broad SELECT on users table from anon PostgREST.
REVOKE ALL ON "users" FROM anon;
-- Grant column-level SELECT only on safe, non-sensitive profile columns to anon & authenticated:
GRANT SELECT (
  id, name, role, avatar, organization, designation,
  district, state, bio, skills, karma_points, badges,
  is_verified, created_at, updated_at
) ON "users" TO anon, authenticated;

-- RLS Policy on Users: Safe profile reads only
DROP POLICY IF EXISTS "users_public_profile_read" ON "users";
CREATE POLICY "users_public_profile_read" ON "users"
  FOR SELECT TO anon, authenticated
  USING (true);

-- Block direct mutations on users through PostgREST (Must go through Next.js /auth/register or /auth/me)
DROP POLICY IF EXISTS "users_prevent_direct_mutation" ON "users";

-- 4. Notifications: User-specific data isolation
REVOKE ALL ON "notifications" FROM anon;
DROP POLICY IF EXISTS "notifications_user_isolation" ON "notifications";
CREATE POLICY "notifications_user_isolation" ON "notifications"
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

-- 5. Civic Reference Tables: Safe Public Read-Only for civic awareness
-- Challenges: Public read for published/non-rejected challenges
DROP POLICY IF EXISTS "challenges_public_read" ON "challenges";
CREATE POLICY "challenges_public_read" ON "challenges"
  FOR SELECT TO anon, authenticated
  USING (status != 'REJECTED' AND status != 'MERGED');

-- Universities: Public reference data
DROP POLICY IF EXISTS "universities_public_read" ON "universities";
CREATE POLICY "universities_public_read" ON "universities"
  FOR SELECT TO anon, authenticated
  USING (true);

-- Civic Clusters: Public dashboard analytics
DROP POLICY IF EXISTS "civic_clusters_public_read" ON "civic_clusters";
CREATE POLICY "civic_clusters_public_read" ON "civic_clusters"
  FOR SELECT TO anon, authenticated
  USING (true);

-- Upvotes: Public read
DROP POLICY IF EXISTS "upvotes_public_read" ON "upvotes";
CREATE POLICY "upvotes_public_read" ON "upvotes"
  FOR SELECT TO anon, authenticated
  USING (true);

-- Comments: Public read
DROP POLICY IF EXISTS "comments_public_read" ON "comments";
CREATE POLICY "comments_public_read" ON "comments"
  FOR SELECT TO anon, authenticated
  USING (true);

-- Solutions: Public read for non-draft solutions
DROP POLICY IF EXISTS "solutions_public_read" ON "solutions";
CREATE POLICY "solutions_public_read" ON "solutions"
  FOR SELECT TO anon, authenticated
  USING (status != 'DRAFT');

-- Milestones & Reviews: Public read
DROP POLICY IF EXISTS "milestones_public_read" ON "milestones";
CREATE POLICY "milestones_public_read" ON "milestones"
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "reviews_public_read" ON "reviews";
CREATE POLICY "reviews_public_read" ON "reviews"
  FOR SELECT TO anon, authenticated
  USING (true);

-- Duplicate Merges: Public reference for transparent governance
DROP POLICY IF EXISTS "duplicate_merges_public_read" ON "duplicate_merges";
CREATE POLICY "duplicate_merges_public_read" ON "duplicate_merges"
  FOR SELECT TO anon, authenticated
  USING (true);
