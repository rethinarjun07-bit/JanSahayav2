async function verify() {
  const chList = await fetch('http://localhost:3000/api/challenges');
  const chData = await chList.json();
  const challenges = chData.challenges || chData;
  console.log(`Checking first 3 challenges out of ${challenges.length}...`);

  for (let i = 0; i < Math.min(3, challenges.length); i++) {
    const c = challenges[i];
    console.log(`\n--- Challenge #${i + 1}: [${c.id}] ${c.title.substring(0, 45)}... (Cat: ${c.category}) ---`);
    console.log('API mediaUrls:', c.mediaUrls);
    console.log('API audioUrl:', c.audioUrl);

    const pageRes = await fetch(`http://localhost:3000/challenges/${c.id}`);
    console.log('Page HTTP status:', pageRes.status);
    const html = await pageRes.text();
    const mediaInHtml = html.match(/\/media\/[a-zA-Z0-9_\-\.]+/g);
    console.log('Media files rendered in HTML:', [...new Set(mediaInHtml || [])]);
  }
}

verify().catch(console.error);
