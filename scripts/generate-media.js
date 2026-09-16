const fs = require('fs');
const path = require('path');

const mediaDir = path.join(process.cwd(), 'public', 'media');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

const svgs = {
  'flood-evidence-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#334155"/>
        <stop offset="50%" stop-color="#475569"/>
        <stop offset="100%" stop-color="#64748b"/>
      </linearGradient>
      <linearGradient id="water1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0284c7" stop-opacity="0.85"/>
        <stop offset="50%" stop-color="#0369a1" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#0c4a6e"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#sky1)"/>
    <path d="M0 240 Q 200 180, 450 230 T 800 210 L 800 450 L 0 450 Z" fill="#334155" opacity="0.7"/>
    <path d="M0 260 Q 300 220, 600 270 T 800 250 L 800 450 L 0 450 Z" fill="#1e293b"/>
    <polygon points="340,260 460,260 580,450 220,450" fill="#475569" opacity="0.5"/>
    <path d="M0 280 Q 200 275, 400 285 T 800 280 L 800 450 L 0 450 Z" fill="url(#water1)"/>
    <path d="M50 310 Q 250 300, 450 315 T 750 310" stroke="#7dd3fc" stroke-width="2" fill="none" opacity="0.6"/>
    <path d="M100 350 Q 300 340, 500 355 T 700 350" stroke="#38bdf8" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M20 390 Q 220 380, 420 395 T 780 390" stroke="#0284c7" stroke-width="2.5" fill="none" opacity="0.7"/>

    <rect x="160" y="180" width="14" height="170" fill="#f8fafc" stroke="#0f172a" stroke-width="1.5"/>
    <rect x="160" y="190" width="14" height="10" fill="#ef4444"/>
    <rect x="160" y="210" width="14" height="10" fill="#ef4444"/>
    <rect x="160" y="230" width="14" height="10" fill="#f59e0b"/>
    <rect x="160" y="250" width="14" height="10" fill="#f59e0b"/>
    <rect x="160" y="270" width="14" height="10" fill="#10b981"/>
    <text x="185" y="200" fill="#ffffff" font-family="monospace" font-size="11" font-weight="bold">CRITICAL DANGER +2.4m</text>
    <text x="185" y="240" fill="#fbbf24" font-family="monospace" font-size="10">WARNING LEVEL +1.6m</text>

    <rect x="20" y="20" width="280" height="75" rx="10" fill="#0f172a" fill-opacity="0.85" stroke="#38bdf8" stroke-width="1"/>
    <circle cx="36" cy="36" r="5" fill="#ef4444"/>
    <text x="48" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">JANSAHAYA UAV TELEMETRY</text>
    <text x="36" y="60" fill="#94a3b8" font-family="monospace" font-size="10">LOC: 23.3441°N, 85.3096°E (Ranchi)</text>
    <text x="36" y="76" fill="#38bdf8" font-family="monospace" font-size="10">SECTOR: Subarnarekha River Basin</text>
    <rect x="640" y="20" width="140" height="30" rx="6" fill="#ef4444" fill-opacity="0.9"/>
    <text x="652" y="40" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="bold">URGENCY: 94/100</text>
  </svg>`,

  'flood-evidence-2.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <linearGradient id="floodGrad2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#0369a1"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#floodGrad2)"/>
    <rect x="100" y="160" width="160" height="120" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
    <rect x="120" y="180" width="25" height="30" fill="#fef08a" opacity="0.7"/>
    <rect x="170" y="180" width="25" height="30" fill="#fef08a" opacity="0.7"/>
    <rect x="520" y="140" width="180" height="140" fill="#334155" stroke="#64748b" stroke-width="1.5"/>
    <rect x="550" y="160" width="30" height="35" fill="#fef08a" opacity="0.8"/>
    <rect x="610" y="160" width="30" height="35" fill="#fef08a" opacity="0.8"/>
    <rect x="0" y="270" width="800" height="180" fill="#0284c7" opacity="0.9"/>
    <ellipse cx="400" cy="320" rx="120" ry="25" fill="#0369a1" opacity="0.5"/>
    <line x1="340" y1="230" x2="340" y2="330" stroke="#cbd5e1" stroke-width="4"/>
    <rect x="300" y="220" width="80" height="24" rx="4" fill="#ef4444"/>
    <text x="308" y="236" fill="#ffffff" font-family="sans-serif" font-size="9" font-weight="bold">FLOOD DEPTH: 4.2 FT</text>
    <rect x="20" y="20" width="280" height="75" rx="10" fill="#0f172a" fill-opacity="0.85" stroke="#0ea5e9" stroke-width="1"/>
    <circle cx="36" cy="36" r="5" fill="#f59e0b"/>
    <text x="48" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">FIELD PHOTO #2: DRAINAGE OVERFLOW</text>
    <text x="36" y="60" fill="#94a3b8" font-family="monospace" font-size="10">ALT: 120m AGL | UAV SENSOR HD</text>
    <text x="36" y="76" fill="#38bdf8" font-family="monospace" font-size="10">CORRIDOR: Morabadi Inundation Zone</text>
  </svg>`,

  'mining-evidence-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <defs>
      <linearGradient id="smokeGrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#ef4444" stop-opacity="0.8"/>
        <stop offset="40%" stop-color="#f97316" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#475569" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="#18181b"/>
    <polygon points="0,180 300,240 500,220 800,260 800,450 0,450" fill="#27272a"/>
    <polygon points="180,250 480,240 600,320 280,360" fill="#09090b"/>
    <path d="M220 300 Q 350 270, 520 290 Q 400 350, 220 300" fill="url(#smokeGrad)"/>
    <circle cx="380" cy="290" r="45" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="6,4"/>
    <circle cx="380" cy="290" r="4" fill="#ef4444"/>
    <line x1="330" y1="290" x2="430" y2="290" stroke="#ef4444" stroke-width="1"/>
    <line x1="380" y1="240" x2="380" y2="340" stroke="#ef4444" stroke-width="1"/>
    <text x="440" y="285" fill="#ef4444" font-family="monospace" font-size="12" font-weight="bold">FLIR TEMP: 74.8°C</text>
    <text x="440" y="302" fill="#f97316" font-family="monospace" font-size="10">SO2 FLUX: 18.2 ppm</text>
    <rect x="20" y="20" width="300" height="75" rx="10" fill="#09090b" fill-opacity="0.9" stroke="#ef4444" stroke-width="1"/>
    <text x="36" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">THERMAL INFRARED MINE SURVEY</text>
    <text x="36" y="60" fill="#a1a1aa" font-family="monospace" font-size="10">LOC: Jharia Bastacolla Colliery</text>
    <text x="36" y="76" fill="#ef4444" font-family="monospace" font-size="10">RISK: Active Subterranean Coal Seam Fire</text>
  </svg>`,

  'mining-evidence-2.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#1c1917"/>
    <polygon points="0,200 400,180 800,220 800,450 0,450" fill="#292524"/>
    <path d="M60 280 L 220 310 L 380 270 L 540 330 L 720 290" stroke="#dc2626" stroke-width="5" fill="none"/>
    <path d="M60 280 L 220 310 L 380 270 L 540 330 L 720 290" stroke="#fca5a5" stroke-width="1.5" fill="none"/>
    <text x="240" y="360" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">⚠️ SURFACE FISSURE: 48cm DISPLACEMENT</text>
    <rect x="20" y="20" width="300" height="75" rx="10" fill="#09090b" fill-opacity="0.9" stroke="#f97316" stroke-width="1"/>
    <text x="36" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">GEOTECHNICAL SUBSIDENCE MESH</text>
    <text x="36" y="60" fill="#a8a29e" font-family="monospace" font-size="10">SENSOR: InSAR Ground Deformation</text>
    <text x="36" y="76" fill="#f97316" font-family="monospace" font-size="10">PARTNER: IIT (ISM) Dhanbad Mining Dept</text>
  </svg>`,

  'road-evidence-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#334155"/>
    <polygon points="380,100 420,100 680,450 120,450" fill="#1e293b"/>
    <line x1="400" y1="100" x2="400" y2="450" stroke="#facc15" stroke-width="4" stroke-dasharray="20,15"/>
    <ellipse cx="340" cy="330" rx="90" ry="35" fill="#0f172a" stroke="#dc2626" stroke-width="2"/>
    <ellipse cx="335" cy="328" rx="75" ry="25" fill="#020617"/>
    <ellipse cx="480" cy="280" rx="50" ry="18" fill="#0f172a" stroke="#f97316" stroke-width="1.5"/>
    <text x="250" y="390" fill="#ef4444" font-family="monospace" font-size="11" font-weight="bold">DEPTH: 18cm | EXPOSED BASE LAYER</text>
    <rect x="20" y="20" width="280" height="75" rx="10" fill="#0f172a" fill-opacity="0.85" stroke="#f59e0b" stroke-width="1"/>
    <text x="36" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">HIGHWAY DEFECT SURVEY #1</text>
    <text x="36" y="60" fill="#94a3b8" font-family="monospace" font-size="10">ROUTE: Patratu Ghat Hairpin Pass</text>
    <text x="36" y="76" fill="#f59e0b" font-family="monospace" font-size="10">ESCALATION: RCD Road Authority</text>
  </svg>`,

  'road-evidence-2.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#1e293b"/>
    <polygon points="160,180 640,180 700,380 100,380" fill="#475569"/>
    <polygon points="280,240 520,240 480,340 320,340" fill="#0f172a"/>
    <path d="M250 200 L 290 260 L 270 310" stroke="#ef4444" stroke-width="3" fill="none"/>
    <path d="M530 210 L 510 270 L 540 330" stroke="#ef4444" stroke-width="3" fill="none"/>
    <text x="310" y="295" fill="#fca5a5" font-family="sans-serif" font-size="12" font-weight="bold">CULVERT COLLAPSE RISK</text>
    <rect x="20" y="20" width="280" height="75" rx="10" fill="#0f172a" fill-opacity="0.85" stroke="#ef4444" stroke-width="1"/>
    <text x="36" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">BRIDGE STRUCTURAL ASSESSMENT</text>
    <text x="36" y="60" fill="#94a3b8" font-family="monospace" font-size="10">NIT Jamshedpur Civil Lab Inspection</text>
    <text x="36" y="76" fill="#ef4444" font-family="monospace" font-size="10">SEVERITY: High Risk Factor</text>
  </svg>`,

  'water-evidence-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#0f172a"/>
    <path d="M50 250 L 150 230 L 220 280 L 350 220 L 500 270 L 680 230 L 760 280" stroke="#a16207" stroke-width="3" fill="none"/>
    <path d="M150 230 L 180 340 M 350 220 L 370 360 M 500 270 L 520 380" stroke="#a16207" stroke-width="2.5" fill="none"/>
    <rect x="580" y="140" width="70" height="200" rx="15" fill="#f8fafc" opacity="0.15" stroke="#38bdf8" stroke-width="2"/>
    <rect x="585" y="220" width="60" height="110" rx="8" fill="#eab308" opacity="0.85"/>
    <text x="592" y="205" fill="#38bdf8" font-family="monospace" font-size="10">VIAL TEST</text>
    <text x="590" y="270" fill="#000000" font-family="monospace" font-size="10" font-weight="bold">F: 4.8mg/L</text>
    <text x="180" y="160" fill="#fbbf24" font-family="sans-serif" font-size="14" font-weight="bold">PALAMU DROUGHT &amp; FLUORIDE SURVEY</text>
    <text x="180" y="185" fill="#94a3b8" font-family="sans-serif" font-size="11">Groundwater fluoride exceeds permissible BIS threshold (1.5 mg/L)</text>
    <rect x="20" y="20" width="280" height="75" rx="10" fill="#020617" fill-opacity="0.9" stroke="#eab308" stroke-width="1"/>
    <text x="36" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">DWSD WATER QUALITY MONITOR</text>
    <text x="36" y="60" fill="#94a3b8" font-family="monospace" font-size="10">LOC: Daltonganj Rural Tube-well</text>
    <text x="36" y="76" fill="#eab308" font-family="monospace" font-size="10">ANALYSIS: Severe Fluoride Spikes</text>
  </svg>`,

  'water-evidence-2.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#172554"/>
    <rect x="360" y="180" width="25" height="160" fill="#94a3b8"/>
    <rect x="340" y="160" width="65" height="25" rx="4" fill="#64748b"/>
    <line x1="385" y1="170" x2="480" y2="220" stroke="#cbd5e1" stroke-width="8"/>
    <circle cx="480" cy="220" r="10" fill="#475569"/>
    <rect x="300" y="320" width="150" height="15" fill="#475569"/>
    <text x="270" y="370" fill="#ef4444" font-family="sans-serif" font-size="12" font-weight="bold">BOREWELL DRY: WATER TABLE AT 280 FT</text>
    <rect x="20" y="20" width="280" height="75" rx="10" fill="#020617" fill-opacity="0.9" stroke="#38bdf8" stroke-width="1"/>
    <text x="36" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">FIELD GROUND INSPECTION #2</text>
    <text x="36" y="60" fill="#94a3b8" font-family="monospace" font-size="10">Garhwa-Palamu Drought Corridor</text>
    <text x="36" y="76" fill="#38bdf8" font-family="monospace" font-size="10">STATUS: Immediate Tanker Route Dispatched</text>
  </svg>`,

  'general-evidence-1.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#1e293b"/>
    <circle cx="400" cy="225" r="140" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6,4"/>
    <circle cx="400" cy="225" r="80" fill="none" stroke="#0284c7" stroke-width="1.5"/>
    <circle cx="400" cy="225" r="6" fill="#ef4444"/>
    <text x="400" y="250" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">INCIDENT SITE VERIFICATION</text>
    <text x="400" y="275" fill="#94a3b8" font-family="monospace" font-size="11" text-anchor="middle">GEOTAG ACCREDITED BY CITIZEN COPILOT</text>
    <rect x="20" y="20" width="280" height="75" rx="10" fill="#0f172a" fill-opacity="0.85" stroke="#10b981" stroke-width="1"/>
    <text x="36" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">JANSAHAYA AI VERIFIED DATA</text>
    <text x="36" y="60" fill="#94a3b8" font-family="monospace" font-size="10">CONFIDENCE: 94% Verified</text>
    <text x="36" y="76" fill="#10b981" font-family="monospace" font-size="10">TAMPER-PROOF AUDIT HASH MATCHED</text>
  </svg>`,

  'general-evidence-2.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
    <rect width="800" height="450" fill="#0f172a"/>
    <path d="M200 350 L 400 150 L 600 350 Z" fill="#334155" stroke="#64748b" stroke-width="2"/>
    <circle cx="400" cy="210" r="12" fill="#f59e0b"/>
    <text x="400" y="260" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">PUBLIC WORKS ON-SITE LOG</text>
    <text x="400" y="285" fill="#cbd5e1" font-family="monospace" font-size="11" text-anchor="middle">CIVIL SURVEILLANCE DATA STREAM</text>
    <rect x="20" y="20" width="280" height="75" rx="10" fill="#020617" fill-opacity="0.9" stroke="#6366f1" stroke-width="1"/>
    <text x="36" y="40" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">FIELD PHOTO EVIDENCE #2</text>
    <text x="36" y="60" fill="#94a3b8" font-family="monospace" font-size="10">Department Inspection Active</text>
    <text x="36" y="76" fill="#6366f1" font-family="monospace" font-size="10">STATUS: Assigned to Nodal Lab</text>
  </svg>`
};

for (const [filename, content] of Object.entries(svgs)) {
  fs.writeFileSync(path.join(mediaDir, filename), content.trim());
  console.log('Created public/media/' + filename);
}
console.log('All situational evidence images created successfully.');
