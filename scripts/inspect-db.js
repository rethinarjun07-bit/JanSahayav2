const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const challenges = await prisma.challenge.findMany({
    select: { id: true, title: true, category: true, mediaUrls: true, audioUrl: true, voiceTranscript: true }
  });
  console.log('Total challenges in DB:', challenges.length);
  for (const c of challenges) {
    console.log(`- [${c.id}] ${c.title} (cat: ${c.category}):`);
    console.log(`  mediaUrls: ${c.mediaUrls}`);
    console.log(`  audioUrl: ${c.audioUrl}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
