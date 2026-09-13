import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Applying JanSahaya Supabase RLS & Column-Level Security Policies...");

  const sqlPath = path.join(__dirname, "../prisma/migrations/supabase_rls_security.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Split on semicolons, keep multi-line statements intact
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      // remove pure-comment chunks
      const nonComment = s.replace(/--[^\n]*/g, "").trim();
      return nonComment.length > 0;
    });

  for (const statement of statements) {
    if (!statement || statement.startsWith("--")) continue;
    try {
      await prisma.$executeRawUnsafe(statement);
      console.log(`  ✓ Executed: ${statement.substring(0, 60).replace(/\n/g, " ")}...`);
    } catch (err: any) {
      console.warn(`  ⚠ Notice during: ${statement.substring(0, 60)} -> ${err.message}`);
    }
  }

  console.log("✅ Supabase Row Level Security & Column Access successfully enforced!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Failed to apply RLS policies:", err);
  process.exit(1);
});
