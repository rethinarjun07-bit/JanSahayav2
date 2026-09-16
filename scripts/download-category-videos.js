const fs = require('fs');

const videos = [
  {
    name: 'road-incident.webm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d0/Cars_Moving_into_pothole.webm/Cars_Moving_into_pothole.webm.360p.vp9.webm'
  },
  {
    name: 'mining-incident.webm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Stone_quarry.webm'
  },
  {
    name: 'water-incident.webm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/28/A_running_tap_of_water.webm'
  }
];

async function downloadAll() {
  for (const v of videos) {
    const dest = `public/media/${v.name}`;
    if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) {
      console.log(`Already have ${v.name} (${fs.statSync(dest).size} bytes)`);
      continue;
    }
    console.log(`Downloading ${v.name} from ${v.url}...`);
    try {
      const res = await fetch(v.url, {
        headers: { 'User-Agent': 'JanSahaya/1.0 (civic-hackathon; contact@jansahaya.in)' }
      });
      if (!res.ok) {
        console.error(`Failed to download ${v.name}: ${res.status}`);
        continue;
      }
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(buffer));
      console.log(`Saved ${dest} (${buffer.byteLength} bytes)`);
    } catch (err) {
      console.error(`Error downloading ${v.name}:`, err.message);
    }
  }
}

downloadAll().catch(console.error);
