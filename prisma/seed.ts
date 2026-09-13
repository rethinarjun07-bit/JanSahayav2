import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding JanSahaya database with realistic SIH26043 data...");

  // Clean existing records in reverse order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.upvote.deleteMany();
  await prisma.review.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.solution.deleteMany();
  await prisma.duplicateMerge.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.university.deleteMany();
  await prisma.user.deleteMany();

  // Password hashes
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const citizenHash = await bcrypt.hash("Citizen@123", 10);
  const solverHash = await bcrypt.hash("Solver@123", 10);
  const industryHash = await bcrypt.hash("Industry@123", 10);

  // 1. Create Core Users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@demo.in",
      password: adminHash,
      name: "Sri Rajesh Kumar Sinha, IAS",
      role: "ADMIN",
      organization: "Govt. of Jharkhand - Disaster Management Cell",
      designation: "Principal Secretary & Nodal Officer",
      district: "Ranchi",
      state: "Jharkhand",
      phone: "+91-651-2446900",
      bio: "Heading state-level disaster mitigation, early warning systems, and inter-university research partnerships in Jharkhand.",
      karmaPoints: 1250,
      badges: JSON.stringify([
        { id: "gov_nodal", name: "State Nodal Officer", icon: "ShieldAlert", date: "2024-01-15" },
        { id: "disaster_lead", name: "Disaster Commander", icon: "Award", date: "2024-03-20" },
      ]),
      isVerified: true,
    },
  });

  const citizenUser = await prisma.user.create({
    data: {
      email: "citizen@demo.in",
      password: citizenHash,
      name: "Priya Sharma",
      role: "CITIZEN",
      organization: "Morabadi Residents Welfare Association",
      designation: "Secretary",
      district: "Ranchi",
      state: "Jharkhand",
      phone: "+91-9431102938",
      bio: "Active community volunteer reporting urban flooding and municipal infrastructure challenges in Ranchi.",
      karmaPoints: 280,
      badges: JSON.stringify([
        { id: "community_guardian", name: "Community Guardian", icon: "HeartHandshake", date: "2024-02-10" },
        { id: "voice_reporter", name: "Voice Reporter", icon: "Mic", date: "2024-04-05" },
      ]),
      isVerified: true,
    },
  });

  const solverUser = await prisma.user.create({
    data: {
      email: "solver@demo.in",
      password: solverHash,
      name: "Dr. Aarav Mehta",
      role: "SOLVER",
      organization: "Birla Institute of Technology, Mesra",
      designation: "Associate Professor, Dept. of Remote Sensing",
      district: "Ranchi",
      state: "Jharkhand",
      phone: "+91-9835012478",
      bio: "Specializing in LiDAR drone mapping, urban hydrology runoff modeling, and real-time disaster sensor arrays.",
      skills: JSON.stringify(["Remote Sensing", "GIS", "Drone Disaster Assessment", "Flood Modeling", "IoT Sensors"]),
      karmaPoints: 640,
      badges: JSON.stringify([
        { id: "top_solver", name: "Top Innovation Solver", icon: "Zap", date: "2024-02-15" },
        { id: "jharkhand_star", name: "Jharkhand Innovation Star", icon: "Star", date: "2024-05-12" },
      ]),
      isVerified: true,
    },
  });

  const industryUser = await prisma.user.create({
    data: {
      email: "industry@demo.in",
      password: industryHash,
      name: "Tata Steel CSR Foundation",
      role: "INDUSTRY",
      organization: "Tata Steel Foundation, Jamshedpur",
      designation: "Head of Disaster Relief & Rural Innovation",
      district: "East Singhbhum",
      state: "Jharkhand",
      phone: "+91-657-6644000",
      bio: "Empowering Jharkhand communities through CSR funding, engineering mentorship, and sustainable water & infrastructure solutions.",
      karmaPoints: 950,
      badges: JSON.stringify([
        { id: "csr_patron", name: "CSR Mega Patron", icon: "Building2", date: "2024-01-01" },
        { id: "green_impact", name: "Eco Sustainability Leader", icon: "Leaf", date: "2024-03-10" },
      ]),
      isVerified: true,
    },
  });

  // Additional 11 Solvers / Researchers
  const solversData = [
    {
      email: "sneha.iitism@demo.in",
      name: "Dr. Sneha Mukherjee",
      org: "IIT (ISM) Dhanbad",
      desig: "Professor, Department of Mining Engineering",
      district: "Dhanbad",
      state: "Jharkhand",
      skills: ["Mine Subsidence Monitoring", "Subterranean Coal Fires", "Seismic Geology", "Rock Mechanics"],
      karma: 580,
    },
    {
      email: "rajeshwar.nitjsr@demo.in",
      name: "Prof. Rajeshwar Rao",
      org: "National Institute of Technology, Jamshedpur",
      desig: "Head, Civil & Environmental Engineering",
      district: "East Singhbhum",
      state: "Jharkhand",
      skills: ["Industrial Waste Treatment", "Structural Resilience", "Effluent Neutralization", "Smart Drainage"],
      karma: 510,
    },
    {
      email: "priyanka.bau@demo.in",
      name: "Dr. Priyanka Tirkey",
      org: "Birsa Agricultural University",
      desig: "Senior Scientist, Climate Resilient Agriculture",
      district: "Ranchi",
      state: "Jharkhand",
      skills: ["Drought-Resistant Farming", "Forest Fire Ecology", "Soil Erosion Control", "Agro-Meteorology"],
      karma: 470,
    },
    {
      email: "vikram.aiims@demo.in",
      name: "Dr. Vikram Sen",
      org: "AIIMS Deoghar",
      desig: "Associate Professor, Disaster Medicine",
      district: "Deoghar",
      state: "Jharkhand",
      skills: ["Epidemic Surveillance", "Emergency Triage", "Waterborne Disease Control", "Crowd Health Logistics"],
      karma: 490,
    },
    {
      email: "team.jalrakshak@demo.in",
      name: "Team JalRakshak (Student Innovators)",
      org: "IIT (ISM) Dhanbad",
      desig: "Interdisciplinary Research Squad",
      district: "Dhanbad",
      state: "Jharkhand",
      skills: ["Low-Cost Fluoride Filtration", "IoT Water Quality Telemetry", "Embedded Systems"],
      karma: 430,
    },
    {
      email: "team.aerovanguard@demo.in",
      name: "Team AeroVanguard",
      org: "Birla Institute of Technology, Mesra",
      desig: "Autonomous Robotics Lab",
      district: "Ranchi",
      state: "Jharkhand",
      skills: ["Autonomous Drones", "Computer Vision", "Thermal Sensing", "Disaster Payload Delivery"],
      karma: 460,
    },
    {
      email: "team.ecoterra@demo.in",
      name: "Team EcoTerra",
      org: "National Institute of Technology, Jamshedpur",
      desig: "CleanTech Innovation Lab",
      district: "East Singhbhum",
      state: "Jharkhand",
      skills: ["Fly Ash Geopolymer Bricks", "Slurry Filtration", "Circular Economy"],
      karma: 390,
    },
    {
      email: "ru.sociallab@demo.in",
      name: "Ranchi University Social Impact Lab",
      org: "Ranchi University",
      desig: "Faculty of Social Sciences & Disaster Studies",
      district: "Ranchi",
      state: "Jharkhand",
      skills: ["Community Disaster Preparedness", "Tribal Vulnerability Mapping", "Santhali Audio Advisory"],
      karma: 410,
    },
    {
      email: "alok.iitr@demo.in",
      name: "Dr. Alok Kumar",
      org: "IIT Roorkee",
      desig: "Dept of Earthquake Engineering",
      district: "Haridwar",
      state: "Uttarakhand",
      skills: ["Landslide Early Warning", "Geotechnical Sensors", "Slope Stability Analysis"],
      karma: 520,
    },
    {
      email: "sunita.cusat@demo.in",
      name: "Prof. Sunita Nair",
      org: "CUSAT Cochin",
      desig: "School of Marine Sciences",
      district: "Ernakulam",
      state: "Kerala",
      skills: ["Coastal Saline Intrusion", "Estuarine Hydrology", "Tidal Barrier Design"],
      karma: 480,
    },
    {
      email: "manoj.iitd@demo.in",
      name: "Dr. Manoj Verma",
      org: "IIT Delhi",
      desig: "Center for Atmospheric Sciences",
      district: "New Delhi",
      state: "Delhi",
      skills: ["Aerosol Particulate Modeling", "Biochar Pyrolysis", "Air Quality Monitoring"],
      karma: 550,
    },
  ];

  const createdSolvers: Record<string, string> = {};
  createdSolvers["solver@demo.in"] = solverUser.id;

  for (const s of solversData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: solverHash,
        name: s.name,
        role: "SOLVER",
        organization: s.org,
        designation: s.desig,
        district: s.district,
        state: s.state,
        skills: JSON.stringify(s.skills),
        karmaPoints: s.karma,
        badges: JSON.stringify([{ id: "verified_researcher", name: "Verified Researcher", icon: "BadgeCheck", date: "2024-02-01" }]),
        isVerified: true,
      },
    });
    createdSolvers[s.email] = user.id;
  }

  // Additional 3 Industry Partners
  const industries = [
    {
      email: "coalindia.csr@demo.in",
      name: "Coal India Green Tech Initiative",
      org: "Central Coalfields Limited (CCL) / CIL",
      desig: "Head of Environmental Sustainability",
      district: "Ranchi",
      state: "Jharkhand",
      karma: 880,
    },
    {
      email: "jindal.foundation@demo.in",
      name: "Jindal Steel & Power CSR Foundation",
      org: "JSP Foundation, Patratu",
      desig: "Director of Community Development",
      district: "Ramgarh",
      state: "Jharkhand",
      karma: 760,
    },
    {
      email: "infosys.springboard@demo.in",
      name: "Infosys Springboard Foundation",
      org: "Infosys Limited",
      desig: "CSR Lead - Public Tech Innovations",
      district: "Bengaluru",
      state: "Karnataka",
      karma: 910,
    },
  ];

  for (const ind of industries) {
    await prisma.user.create({
      data: {
        email: ind.email,
        password: industryHash,
        name: ind.name,
        role: "INDUSTRY",
        organization: ind.org,
        designation: ind.desig,
        district: ind.district,
        state: ind.state,
        karmaPoints: ind.karma,
        badges: JSON.stringify([{ id: "csr_patron", name: "CSR Innovation Patron", icon: "Building2", date: "2024-01-10" }]),
        isVerified: true,
      },
    });
  }

  // 2. Create Universities
  const universitiesData = [
    {
      name: "Birla Institute of Technology, Mesra",
      code: "BIT-MESRA",
      state: "Jharkhand",
      district: "Ranchi",
      departments: JSON.stringify(["Remote Sensing & GIS", "Civil & Environmental Engineering", "Computer Science", "Mechanical Engineering"]),
      expertiseTags: JSON.stringify(["Drone Disaster Assessment", "Flood Modeling", "LiDAR Survey", "IoT Sensor Networks"]),
      nodalOfficerName: "Dr. Aarav Mehta",
      nodalOfficerEmail: "solver@demo.in",
    },
    {
      name: "IIT (ISM) Dhanbad",
      code: "IIT-ISM",
      state: "Jharkhand",
      district: "Dhanbad",
      departments: JSON.stringify(["Department of Mining Engineering", "Applied Geophysics", "Environmental Science", "Mechanical Engineering"]),
      expertiseTags: JSON.stringify(["Mine Subsidence Monitoring", "Subterranean Coal Fires", "Seismic Geology", "Groundwater Geophysics"]),
      nodalOfficerName: "Dr. Sneha Mukherjee",
      nodalOfficerEmail: "sneha.iitism@demo.in",
    },
    {
      name: "National Institute of Technology, Jamshedpur",
      code: "NIT-JSR",
      state: "Jharkhand",
      district: "East Singhbhum",
      departments: JSON.stringify(["Civil Engineering", "Metallurgical Engineering", "Computer Applications", "Electronics"]),
      expertiseTags: JSON.stringify(["Industrial Waste Treatment", "Structural Hazard Mitigation", "Smart Drainage", "Heavy Metal Remediation"]),
      nodalOfficerName: "Prof. Rajeshwar Rao",
      nodalOfficerEmail: "rajeshwar.nitjsr@demo.in",
    },
    {
      name: "Birsa Agricultural University",
      code: "BAU-RANCHI",
      state: "Jharkhand",
      district: "Ranchi",
      departments: JSON.stringify(["Faculty of Agriculture", "Forestry", "Soil Science", "Agricultural Engineering"]),
      expertiseTags: JSON.stringify(["Drought-Resistant Farming", "Forest Fire Ecology", "Soil Erosion Prevention", "Agro-Meteorology"]),
      nodalOfficerName: "Dr. Priyanka Tirkey",
      nodalOfficerEmail: "priyanka.bau@demo.in",
    },
    {
      name: "AIIMS Deoghar",
      code: "AIIMS-DEO",
      state: "Jharkhand",
      district: "Deoghar",
      departments: JSON.stringify(["Emergency Medicine", "Community Medicine", "Epidemiology", "Hospital Administration"]),
      expertiseTags: JSON.stringify(["Disaster Medicine", "Epidemic Surveillance", "Mass Casualty Triage", "Waterborne Disease Control"]),
      nodalOfficerName: "Dr. Vikram Sen",
      nodalOfficerEmail: "vikram.aiims@demo.in",
    },
    {
      name: "Ranchi University",
      code: "RU-RANCHI",
      state: "Jharkhand",
      district: "Ranchi",
      departments: JSON.stringify(["Geography & Disaster Studies", "Tribal Languages", "Sociology", "Information Technology"]),
      expertiseTags: JSON.stringify(["Community Disaster Preparedness", "Tribal Vulnerability Mapping", "Santhali Translation"]),
      nodalOfficerName: "Dr. Rameshwar Mahto",
      nodalOfficerEmail: "ru.sociallab@demo.in",
    },
  ];

  const createdUniversities: Record<string, string> = {};
  for (const u of universitiesData) {
    const uni = await prisma.university.create({ data: u });
    createdUniversities[u.code] = uni.id;
  }

  // 3. Create 25 Realistic Challenges (Including 3 Deliberate Near-Duplicates)
  console.log("📝 Inserting 25 challenges with near-duplicates...");

  // Primary Challenge #1: Morabadi Flooding
  const chal1 = await prisma.challenge.create({
    data: {
      title: "Waterlogging and sudden flash flood in Morabadi Ground and connecting urban storm drainage",
      description: "Severe rainwater accumulation of up to 4 feet in Morabadi Ground and Tagore Hill approach roads during intense monsoon spells. The underground culverts are heavily choked with plastic silt, threatening 15,000 residents and cutting off emergency vehicle access to RIMS Hospital route.",
      category: "Disaster Management",
      severity: "CRITICAL",
      urgencyScore: 92,
      confidenceScore: 95,
      evidenceStrength: 92,
      priorityScore: 91,
      recommendedDepartment: "District Disaster Management Authority (DDMA) / Urban Development",
      sdgGoals: JSON.stringify(["SDG 6: Clean Water & Sanitation", "SDG 11: Sustainable Cities & Communities", "SDG 13: Climate Action"]),
      slaStatus: "ON_TRACK",
      slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
      status: "ASSIGNED",
      latitude: 23.3857,
      longitude: 85.3275,
      address: "Morabadi Ground, Near Bapu Vatika, Ranchi",
      district: "Ranchi",
      state: "Jharkhand",
      pincode: "834008",
      language: "en",
      aiTags: JSON.stringify(["Flood & Drainage", "Urban Runoff", "Drainage Choke", "Emergency Access", "RIMS Route"]),
      predictedSector: "Disaster Management",
      autoAssignedUniversity: "BIT Mesra",
      assignedUniversityId: createdUniversities["BIT-MESRA"],
      assignedDepartment: "Remote Sensing & GIS",
      createdById: citizenUser.id,
      verifiedAt: new Date("2024-03-01"),
      verifiedById: adminUser.id,
      officialNotes: "Verified on-site by District Triage Officer. Severe drainage constriction confirmed. Assigned to BIT Mesra Hydrology Division for LiDAR runoff modeling.",
      viewCount: 342,
      citizenReportedCategory: "Disaster Management",
      citizenReportedSeverity: "CRITICAL",
      aiPredictedCategory: "Disaster Management",
      aiPredictedSeverity: "CRITICAL",
      aiUrgencyScore: 92,
      officialGovernmentCategory: "Disaster Management",
      officialGovernmentSeverity: "CRITICAL",
    },
  });

  // Duplicate #1 (Deliberate near-duplicate of Chal 1 for Duplicate Engine Demo)
  const chal1_dup = await prisma.challenge.create({
    data: {
      title: "Severe water accumulation & drainage flood risk in Morabadi Ground during monsoon",
      description: "During heavy rainfall, Morabadi Ground faces dangerous water accumulation and choked urban storm culverts. Water reaches 3-4 feet, blocking access roads and threatening adjacent residential colonies and schools.",
      category: "Disaster Management",
      severity: "CRITICAL",
      urgencyScore: 88,
      confidenceScore: 91,
      evidenceStrength: 80,
      priorityScore: 85,
      duplicateProbability: 92,
      recommendedDepartment: "District Disaster Management Authority (DDMA)",
      sdgGoals: JSON.stringify(["SDG 11: Sustainable Cities & Communities"]),
      slaStatus: "ON_TRACK",
      status: "SUBMITTED",
      latitude: 23.3862,
      longitude: 85.3281,
      address: "Morabadi Football Stadium Periphery, Ranchi",
      district: "Ranchi",
      state: "Jharkhand",
      pincode: "834008",
      language: "en",
      aiTags: JSON.stringify(["Flood & Drainage", "Waterlogging", "Morabadi Ground", "Storm Drainage"]),
      predictedSector: "Disaster Management",
      autoAssignedUniversity: "BIT Mesra",
      createdById: citizenUser.id,
      viewCount: 89,
    },
  });

  // Primary Challenge #2: Jharia Underground Coal Fire
  const chal2 = await prisma.challenge.create({
    data: {
      title: "Underground coal seam fire and surface subsidence hazardous smoke in Jharia coal belt",
      description: "Centuries-old subterranean coal fires in Lodna and Kujama colliery zones have induced sudden ground fissures, sinkhole cave-ins, and continuous discharge of toxic carbon monoxide and sulfur dioxide gases into densely populated settlement zones.",
      category: "Mining & Geology",
      severity: "CRITICAL",
      urgencyScore: 96,
      status: "ASSIGNED",
      latitude: 23.7431,
      longitude: 86.4172,
      address: "Lodna Colliery Sector 4, Jharia, Dhanbad",
      district: "Dhanbad",
      state: "Jharkhand",
      pincode: "828111",
      language: "en",
      aiTags: JSON.stringify(["Mine Safety & Fire", "Underground Fire", "Subsidence", "Toxic Gas", "Sinkhole"]),
      predictedSector: "Mining & Geology",
      autoAssignedUniversity: "IIT (ISM) Dhanbad",
      assignedUniversityId: createdUniversities["IIT-ISM"],
      assignedDepartment: "Department of Mining Engineering",
      createdById: citizenUser.id,
      verifiedAt: new Date("2024-02-18"),
      verifiedById: adminUser.id,
      officialNotes: "State Disaster Management high-alert zone. Continuous drone thermal imaging and nitrogen foam inertization pilot sanctioned.",
      viewCount: 520,
    },
  });

  // Duplicate #2 (Deliberate near-duplicate of Chal 2 for Duplicate Engine Demo)
  const chal2_dup = await prisma.challenge.create({
    data: {
      title: "Subterranean coal fire toxic gas emission and sinkhole hazard near Jharia mines",
      description: "Hazardous fumes, carbon monoxide emissions, and ground cracking due to deep underground coal fires affecting residents living along Jharia mine edges. Urgent drone heat sensors and subsidence mapping needed.",
      category: "Mining & Geology",
      severity: "CRITICAL",
      urgencyScore: 94,
      status: "SUBMITTED",
      latitude: 23.7445,
      longitude: 86.4185,
      address: "Kujama Bustee Road, Jharia, Dhanbad",
      district: "Dhanbad",
      state: "Jharkhand",
      pincode: "828111",
      language: "en",
      aiTags: JSON.stringify(["Mine Safety & Fire", "Underground Fire", "Toxic Fumes", "Sinkhole"]),
      predictedSector: "Mining & Geology",
      autoAssignedUniversity: "IIT (ISM) Dhanbad",
      createdById: citizenUser.id,
      viewCount: 112,
    },
  });

  // Primary Challenge #3: Palamu Groundwater Fluoride & Drought
  const chal3 = await prisma.challenge.create({
    data: {
      title: "Severe groundwater fluoride contamination and acute drinking water drought across Daltonganj blocks",
      description: "Over 48 rural villages in Daltonganj, Patan, and Lesliganj blocks exhibit dangerously elevated fluoride levels (> 5.5 mg/L vs safe limit of 1.0 mg/L) in deep borewells, leading to widespread dental and skeletal fluorosis among children and acute summertime drinking water scarcity.",
      category: "Water & Sanitation",
      severity: "CRITICAL",
      urgencyScore: 90,
      status: "IN_PROGRESS",
      latitude: 24.0416,
      longitude: 84.0734,
      address: "Daltonganj Block IV, Palamu District",
      district: "Palamu",
      state: "Jharkhand",
      pincode: "822101",
      language: "en",
      aiTags: JSON.stringify(["Water Quality & Drought", "Fluoride", "Borewell", "Skeletal Fluorosis", "Safe Drinking Water"]),
      predictedSector: "Water & Sanitation",
      autoAssignedUniversity: "IIT (ISM) Dhanbad",
      assignedUniversityId: createdUniversities["IIT-ISM"],
      assignedDepartment: "Applied Geophysics & Water Labs",
      createdById: citizenUser.id,
      verifiedAt: new Date("2024-02-12"),
      verifiedById: adminUser.id,
      officialNotes: "Public Health Engineering Dept report attached. Lab verified fluoride at 6.1 mg/L in 12 wells.",
      viewCount: 410,
    },
  });

  // Duplicate #3 (Deliberate near-duplicate of Chal 3 for Duplicate Engine Demo)
  const chal3_dup = await prisma.challenge.create({
    data: {
      title: "High fluoride levels and dry borewells in rural drinking water of Palamu district",
      description: "Excess fluoride in village borewells of Palamu causing joint deformities in school students. During summer, water table drops below 300 ft causing severe drinking water shortages.",
      category: "Water & Sanitation",
      severity: "CRITICAL",
      urgencyScore: 86,
      status: "SUBMITTED",
      latitude: 24.0435,
      longitude: 84.0762,
      address: "Patan Rural Market, Palamu",
      district: "Palamu",
      state: "Jharkhand",
      pincode: "822101",
      language: "en",
      aiTags: JSON.stringify(["Water Quality & Drought", "Fluoride", "Drinking Water", "Palamu"]),
      predictedSector: "Water & Sanitation",
      autoAssignedUniversity: "IIT (ISM) Dhanbad",
      createdById: citizenUser.id,
      viewCount: 75,
    },
  });

  // Scenario #4: Low-Confidence Problem (triggers "Human Verification Recommended" banner)
  const chal_low_conf = await prisma.challenge.create({
    data: {
      title: "Unusual ground vibrations and rumbling sound reported near old abandoned quarry site",
      description: "Local hamlets report intermittent evening vibrations and low-frequency rumble near the southern ridge. Unclear whether caused by unauthorized stone blasting, heavy mineral transport trucks, or seismic fault movement. Reported without photo evidence.",
      category: "Infrastructure",
      severity: "MEDIUM",
      urgencyScore: 45,
      confidenceScore: 48,
      evidenceStrength: 32,
      priorityScore: 42,
      recommendedDepartment: "District Administration & Mining Directorate",
      sdgGoals: JSON.stringify(["SDG 9: Industry, Innovation & Infrastructure"]),
      slaStatus: "ON_TRACK",
      status: "SUBMITTED",
      latitude: 23.4120,
      longitude: 85.2910,
      address: "Old Quarry Periphery, Kanke Block, Ranchi",
      district: "Ranchi",
      state: "Jharkhand",
      pincode: "834006",
      language: "en",
      aiTags: JSON.stringify(["Quarry", "Vibrations", "Unverified Ground Report"]),
      createdById: citizenUser.id,
      viewCount: 64,
    },
  });

  // Scenario #5: Escalated Problem (SLA breached, triggers smart escalation workflow)
  const chal_escalated = await prisma.challenge.create({
    data: {
      title: "Toxic acidic mine water outflow submerging paddy fields along Damodar river bank",
      description: "Breach in abandoned open-cast pit retaining bund discharging pH 3.2 sulfuric mine acid water directly into 120 acres of paddy fields. 4 days past statutory emergency triage deadline without on-ground mitigation.",
      category: "Mining & Geology",
      severity: "CRITICAL",
      urgencyScore: 96,
      confidenceScore: 94,
      evidenceStrength: 88,
      priorityScore: 97,
      recommendedDepartment: "State Pollution Control Board & Dept of Mines",
      sdgGoals: JSON.stringify(["SDG 6: Clean Water & Sanitation", "SDG 15: Life on Land"]),
      status: "ESCALATED",
      slaStatus: "ESCALATED",
      slaDeadline: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      latitude: 23.7820,
      longitude: 86.3450,
      address: "Damodar River Basin, Katras Block, Dhanbad",
      district: "Dhanbad",
      state: "Jharkhand",
      pincode: "828113",
      language: "en",
      aiTags: JSON.stringify(["Acid Mine Drainage", "Damodar Basin", "Agricultural Loss", "SLA Breached"]),
      createdById: citizenUser.id,
      verifiedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      verifiedById: adminUser.id,
      officialNotes: "ESCALATED to State Disaster Executive Committee: Initial 48-hour emergency response deadline expired.",
      viewCount: 280,
    },
  });

  // Scenario #6: Solved Problem with Citizen Ground Verification & Measured Impact
  const chal_solved = await prisma.challenge.create({
    data: {
      title: "High-risk cliff rockfall stabilization along Patratu Valley Ghat hairpin turns",
      description: "Severe geological rockfall hazards along steep Patratu Valley hairpin bends #4 and #7 threatening daily commuter buses. Successfully mitigated using anchor-bolted high-tensile steel mesh and laser tilt sensors.",
      category: "Infrastructure",
      severity: "HIGH",
      urgencyScore: 84,
      confidenceScore: 93,
      evidenceStrength: 96,
      priorityScore: 82,
      recommendedDepartment: "Road Construction Department (RCD) / DDMA",
      sdgGoals: JSON.stringify(["SDG 9: Resilient Infrastructure", "SDG 11: Sustainable Cities"]),
      status: "SOLVED",
      slaStatus: "RESOLVED",
      citizenFeedback: "SOLVED",
      citizenFeedbackNotes: "Slope mesh anchored. Verified no fallen boulders after recent torrential rains. Bus routes operating safely.",
      impactScore: 94,
      beneficiariesCount: 45000,
      latitude: 23.6330,
      longitude: 85.3015,
      address: "Hairpin Bend #4, Patratu Ghat Road, Ramgarh",
      district: "Ramgarh",
      state: "Jharkhand",
      pincode: "829118",
      language: "en",
      aiTags: JSON.stringify(["Rockfall", "Ghat Road", "Slope Mesh", "Disaster Mitigated"]),
      createdById: citizenUser.id,
      verifiedAt: new Date("2024-01-10"),
      verifiedById: adminUser.id,
      officialNotes: "Implementation inspected and signed off by Executive Engineer RCD. Citizen verification completed.",
      viewCount: 610,
    },
  });

  // Additional 19 Challenges across Jharkhand & India
  const otherChallenges = [
    {
      title: "Subarnarekha river industrial heavy-metal effluent runoff affecting downstream tribal settlements",
      desc: "Untreated toxic runoff containing hexavalent chromium and lead being discharged into Subarnarekha tributaries near Adityapur Industrial Area, poisoning fishing waters and irrigation canals.",
      cat: "Environment & Forestry",
      sev: "HIGH",
      urg: 78,
      lat: 22.8046,
      lng: 86.2029,
      addr: "Adityapur Phase 3 Outfall, East Singhbhum",
      dist: "East Singhbhum",
      state: "Jharkhand",
      tags: ["Industrial Waste", "River Silt", "Heavy Metal", "Tribal Health"],
      uni: "NIT-JSR",
    },
    {
      title: "Fly ash dam overflow and airborne particulate dust near thermal power ash pond in Bokaro",
      desc: "Heavy winds blowing airborne fly ash clouds into 8 neighbouring villages, causing acute respiratory distress, while monsoon rain breaches the earthen dyke of the thermal ash settling pond.",
      cat: "Environment & Forestry",
      sev: "HIGH",
      urg: 75,
      lat: 23.6693,
      lng: 86.1511,
      addr: "Bokaro Thermal Power Ash Pond Dyke 2",
      dist: "Bokaro",
      state: "Jharkhand",
      tags: ["Industrial Waste", "Air Quality", "Fly Ash", "Dyke Breach"],
      uni: "NIT-JSR",
    },
    {
      title: "Severe human-elephant conflict and crop depredation along Hazaribagh-Bishnugarh forest corridor",
      desc: "Herds of 18-24 wild elephants entering rural paddy fields and tribal homesteads due to fragmented migratory corridors. 6 human casualties and severe food grain destruction reported this quarter.",
      cat: "Environment & Forestry",
      sev: "HIGH",
      urg: 79,
      lat: 23.9925,
      lng: 85.3637,
      addr: "Bishnugarh Forest Range Border, Hazaribagh",
      dist: "Hazaribagh",
      state: "Jharkhand",
      tags: ["Forest & Wildlife", "Elephant Corridor", "Crop Loss", "Early Warning"],
      uni: "BAU-RANCHI",
    },
    {
      title: "Mass pilgrimage crowd crush hazard and real-time corridor monitoring during Shravani Mela",
      desc: "Over 200,000 devotees per day converging along narrow 4 km temple approach lanes in Deoghar. Surge bottlenecks create severe stampede risks during sudden thunderstorm downpours.",
      cat: "Disaster Management",
      sev: "HIGH",
      urg: 82,
      lat: 24.4826,
      lng: 86.6974,
      addr: "Baba Baidyanath Temple Outer Circumference, Deoghar",
      dist: "Deoghar",
      state: "Jharkhand",
      tags: ["Disaster Management", "Crowd Safety", "Stampede Prevention", "AI Vision"],
      uni: "AIIMS-DEO",
    },
    {
      title: "Severe Ganga riverbank soil erosion threatening historical settlements and school buildings in Sahibganj",
      desc: "High-velocity monsoon flow of the River Ganga is eroding up to 15 meters of riverbank per season in Rajmahal and Udhwa blocks. Two primary school buildings and 120 houses are within 20 meters of the collapsing cliff.",
      cat: "Disaster Management",
      sev: "CRITICAL",
      urg: 89,
      lat: 25.2425,
      lng: 87.6409,
      addr: "Udhwa Ghat Bank, Sahibganj District",
      dist: "Sahibganj",
      state: "Jharkhand",
      tags: ["River Erosion & Silt", "Ganga", "Bank Collapse", "Evacuation"],
      uni: "BIT-MESRA",
    },
    {
      title: "Abandoned illegal mica pit cave-in risks and ground instability in rural forest periphery of Giridih",
      desc: "Hundreds of unmapped rat-hole mica excavation pits in Tisri and Gawan blocks collapse during monsoons, trapping local scavengers and causing livestock sinkhole fatalities.",
      cat: "Mining & Geology",
      sev: "HIGH",
      urg: 74,
      lat: 24.1856,
      lng: 86.3072,
      addr: "Tisri Forest Border, Giridih",
      dist: "Giridih",
      state: "Jharkhand",
      tags: ["Mine Safety & Fire", "Pit Cave-in", "Mica Mines", "Geohazard"],
      uni: "IIT-ISM",
    },
    {
      title: "Monsoon hill road landslide cutoffs blocking emergency ambulance transit in Netarhat plateau",
      desc: "Debris slides and rockfalls along steep ghat sections of State Highway 9 isolate tribal villages for days during continuous torrential downpours.",
      cat: "Infrastructure & Transport",
      sev: "HIGH",
      urg: 76,
      lat: 23.7438,
      lng: 84.4988,
      addr: "Netarhat Ghat Road, Latehar",
      dist: "Latehar",
      state: "Jharkhand",
      tags: ["Infrastructure", "Landslide", "Ambulance Route", "Slope Monitoring"],
      uni: "BIT-MESRA",
    },
    {
      title: "Severe summer water table depletion in Santhal Pargana granite aquifers of Dumka",
      desc: "Hard rock granite aquifers exhaust groundwater supplies by early April, forcing women to trek over 4 kilometers to contaminated pond depressions.",
      cat: "Water & Sanitation",
      sev: "MEDIUM",
      urg: 62,
      lat: 24.2676,
      lng: 87.2486,
      addr: "Kathikund Block, Dumka",
      dist: "Dumka",
      state: "Jharkhand",
      tags: ["Water Quality & Drought", "Granite Aquifer", "Check Dam", "Rural Water"],
      uni: "BAU-RANCHI",
    },
    {
      title: "Damodar river coal washery slurry sedimentation causing severe riverbed shallowing in Ramgarh",
      desc: "Heavy slurry sediments choke the natural discharge capacity of the Damodar river, inducing sudden flash river overflows into low-lying agricultural fields during heavy rains.",
      cat: "Environment & Forestry",
      sev: "HIGH",
      urg: 71,
      lat: 23.6332,
      lng: 85.5149,
      addr: "Rajrappa Damodar Confluence, Ramgarh",
      dist: "Ramgarh",
      state: "Jharkhand",
      tags: ["Industrial Waste", "River Silt", "Damodar", "Washery Slurry"],
      uni: "NIT-JSR",
    },
    {
      title: "Iron ore slurry wash-off polluting rural drinking streams in Saranda forest of West Singhbhum",
      desc: "Red mud runoff from open-pit hematite mining settles in forest perennial streams, eliminating aquatic biodiversity and making water unfit for consumption by indigenous Ho tribal communities.",
      cat: "Environment & Forestry",
      sev: "MEDIUM",
      urg: 65,
      lat: 22.5638,
      lng: 85.8078,
      addr: "Gua Forest Range, Saranda, West Singhbhum",
      dist: "West Singhbhum",
      state: "Jharkhand",
      tags: ["Industrial Waste", "Red Mud", "Drinking Water", "Tribal Health"],
      uni: "NIT-JSR",
    },
    {
      title: "Seasonal bauxite tailings soil leaching and vegetation loss in Lohardaga plateau",
      desc: "Alkaline wash-off from hillside bauxite deposits destroys downstream fertile paddy topsoil, requiring regenerative soil amendments and vegetative silt barriers.",
      cat: "Agriculture & Rural Development",
      sev: "MEDIUM",
      urg: 58,
      lat: 23.4357,
      lng: 84.6789,
      addr: "Kisko Block Bauxite Belt, Lohardaga",
      dist: "Lohardaga",
      state: "Jharkhand",
      tags: ["Agriculture", "Soil Degradation", "Bauxite Leaching"],
      uni: "BAU-RANCHI",
    },
    {
      title: "Lightning strike fatalities in open agricultural paddy plains of Chatra district",
      desc: "Over 22 farmers killed by cloud-to-ground lightning discharges during pre-monsoon thunderstorms due to lack of localized SMS/siren early warning and lightning arresters.",
      cat: "Disaster Management",
      sev: "HIGH",
      urg: 81,
      lat: 24.2114,
      lng: 84.8718,
      addr: "Hunterganj Block, Chatra",
      dist: "Chatra",
      state: "Jharkhand",
      tags: ["Disaster Management", "Lightning Warning", "Farmer Safety", "IoT Siren"],
      uni: "BIT-MESRA",
    },
    // National Challenges
    {
      title: "Glacial lake outburst flood (GLOF) early warning IoT sensor array for high Himalayas in Chamoli",
      desc: "Moraine-dammed glacial lakes in high-altitude Chamoli require robust satellite-linked water level acoustic sensors and automated sirens to protect downstream hydropower stations and towns.",
      cat: "Disaster Management",
      sev: "CRITICAL",
      urg: 95,
      lat: 30.4225,
      lng: 79.3242,
      addr: "Rishi Ganga Upper Valley, Chamoli",
      dist: "Chamoli",
      state: "Uttarakhand",
      tags: ["Disaster Management", "GLOF", "Himalayan Sensor", "Early Warning"],
      uni: "BIT-MESRA",
    },
    {
      title: "Severe Brahmaputra riverbank island erosion threatening Majuli cultural monasteries",
      desc: "Braided sandbanks of the Brahmaputra wash away hundred of hectares during annual flood surges, threatening ancient Satra institutions and Mishing tribal villages on Majuli Island.",
      cat: "Disaster Management",
      sev: "CRITICAL",
      urg: 91,
      lat: 26.9634,
      lng: 94.2138,
      addr: "Kamalabari Riverfront, Majuli Island",
      dist: "Majuli",
      state: "Assam",
      tags: ["River Erosion & Silt", "Brahmaputra", "Geo-Bags", "Heritage Defense"],
      uni: "BIT-MESRA",
    },
    {
      title: "Saline intrusion into Vembanad paddy wetlands due to sea level rise in Kuttanad, Kerala",
      desc: "Backwater salinity destroys below-sea-level paddy cultivation in Kuttanad, requiring smart tidal regulatory sluice gates and automated salinity monitoring.",
      cat: "Agriculture & Rural Development",
      sev: "HIGH",
      urg: 77,
      lat: 9.4981,
      lng: 76.3388,
      addr: "Thanneermukkom Bund Area, Alappuzha",
      dist: "Alappuzha",
      state: "Kerala",
      tags: ["Water Quality & Drought", "Saline Intrusion", "Wetland Farming", "IoT Sluice"],
      uni: "BAU-RANCHI",
    },
    {
      title: "Cyclone-resilient modular floating shelter designs for vulnerable coastal fishers in Puri, Odisha",
      desc: "Frequent Bay of Bengal Category 4+ cyclones inundate coastal fishing hamlets with 3-meter storm surges. Need modular buoyant shelters anchored to deep bedrock foundations.",
      cat: "Disaster Management",
      sev: "HIGH",
      urg: 84,
      lat: 19.8135,
      lng: 85.8312,
      addr: "Chandrabhaga Beach Sector, Puri",
      dist: "Puri",
      state: "Odisha",
      tags: ["Disaster Management", "Cyclone Shelter", "Storm Surge", "Resilient Housing"],
      uni: "NIT-JSR",
    },
    {
      title: "Biomass crop stubble burning smoke capture and mobile pyrolysis biochar conversion in NCR",
      desc: "Agricultural burning of 15 million tons of rice straw triggers severe air quality index spikes (> 480 AQI). Requires mobile decentralized tractor-drawn pyrolyzers that produce carbon-negative soil biochar.",
      cat: "Environment & Forestry",
      sev: "HIGH",
      urg: 80,
      lat: 28.7041,
      lng: 77.1025,
      addr: "Outer Ring Road Agro Corridor, New Delhi",
      dist: "New Delhi",
      state: "Delhi",
      tags: ["Environment & Forestry", "Air Quality", "Biochar", "Stubble Burning"],
      uni: "NIT-JSR",
    },
    {
      title: "Automated IoT farm-pond evaporation reduction and micro-drip network in Marathwada",
      desc: "Severe semi-arid heat causes up to 45% evaporative water loss from rural farm ponds. Need modular solar-reflective floating covers coupled with smart soil-moisture sensor drip valves.",
      cat: "Agriculture & Rural Development",
      sev: "HIGH",
      urg: 73,
      lat: 19.8762,
      lng: 75.3433,
      addr: "Jalna Border Farm Sector, Chhatrapati Sambhaji Nagar",
      dist: "Chhatrapati Sambhaji Nagar",
      state: "Maharashtra",
      tags: ["Agriculture", "Drought Relief", "Evaporation Shield", "IoT Drip"],
      uni: "BAU-RANCHI",
    },
    {
      title: "Steep plantation slope soil saturation and landslide warning sensor telemetry in Wayanad",
      desc: "Extreme episodic monsoons oversaturate vulnerable weathered laterite soils in tea and cardamom estates, triggering catastrophic debris flows that destroy workers' quarters.",
      cat: "Disaster Management",
      sev: "CRITICAL",
      urg: 93,
      lat: 11.6854,
      lng: 76.1320,
      addr: "Meppadi Hill Slope Sector, Wayanad",
      dist: "Wayanad",
      state: "Kerala",
      tags: ["Disaster Management", "Landslide", "Soil Moisture", "Early Evacuation"],
      uni: "BIT-MESRA",
    },
  ];

  for (const item of otherChallenges) {
    await prisma.challenge.create({
      data: {
        title: item.title,
        description: item.desc,
        category: item.cat,
        severity: item.sev,
        urgencyScore: item.urg,
        status: item.sev === "CRITICAL" ? "ASSIGNED" : "VERIFIED",
        latitude: item.lat,
        longitude: item.lng,
        address: item.addr,
        district: item.dist,
        state: item.state,
        language: "en",
        aiTags: JSON.stringify(item.tags),
        predictedSector: item.cat,
        autoAssignedUniversity: item.uni,
        assignedUniversityId: createdUniversities[item.uni] || null,
        createdById: citizenUser.id,
        verifiedAt: new Date(),
        verifiedById: adminUser.id,
        officialNotes: "Assigned for technical intervention following preliminary district vulnerability audit.",
        viewCount: Math.floor(Math.random() * 200) + 50,
        citizenReportedCategory: item.cat,
        citizenReportedSeverity: item.sev,
        aiPredictedCategory: item.cat,
        aiPredictedSeverity: item.sev,
        aiUrgencyScore: item.urg,
        officialGovernmentCategory: item.cat,
        officialGovernmentSeverity: item.sev,
      },
    });
  }

  // 4. Create Detailed Solutions, Milestones & Reviews for Primary Challenges
  console.log("💡 Inserting technical solution proposals with milestones & reviews...");

  // Solution for Morabadi Flooding
  const sol1 = await prisma.solution.create({
    data: {
      challengeId: chal1.id,
      authorId: solverUser.id,
      teamName: "BIT HydroVanguard",
      title: "Smart Stormwater IoT Telemetry and Silt-Clearing Hydro-Augmentation System",
      abstract: "A two-pronged engineering response combining hydrodynamic computational modeling (SWMM), solar-powered ultrasonic culvert water level sensors, and pneumatic debris agitators to clear bottleneck storm drains during peak cloudbursts.",
      methodology: "1. 3D LiDAR elevation mapping of Morabadi catchment.\n2. Installation of 12 ultrasonic level sensors with LoRaWAN telemetry transmitting to Ranchi Smart City Command Center.\n3. Implementation of modular gabion silt traps and automated sluice diversion into Subarnarekha feeder canal.",
      techStack: JSON.stringify(["LoRaWAN Sensors", "SWMM Hydro Modeling", "Raspberry Pi Gateways", "Pneumatic Agitators", "React City Dashboard"]),
      budgetEstimate: 1450000,
      timelineMonths: 4,
      prototypeUrl: "https://bitmesra.ac.in/labs/hydrology-morabadi-pilot",
      status: "GOVT_VERIFIED",
      milestoneStage: "Phase 3: Pilot Deployment & Calibration",
      govtEndorsed: true,
      endorsedBy: adminUser.name,
      endorsedAt: new Date("2024-04-10"),
    },
  });

  // Milestones for Solution 1
  await prisma.milestone.createMany({
    data: [
      {
        solutionId: sol1.id,
        order: 1,
        title: "Catchment Topography & Culvert Flow LiDAR Mapping",
        description: "High-resolution drone mapping of 12 sq km around Morabadi Ground with digital elevation model generation.",
        status: "APPROVED",
        proofUrl: "https://bitmesra.ac.in/reports/morabadi-lidar-v1.pdf",
        notes: "Approved by Ranchi Municipal Corporation engineering team.",
        updatedAt: new Date(),
      },
      {
        solutionId: sol1.id,
        order: 2,
        title: "Deployment of 12 LoRaWAN Ultrasonic Water-Depth Sensor Nodes",
        description: "Installed solar-backed nodes at critical culvert nodes with 1-minute telemetry reporting to cloud dashboard.",
        status: "APPROVED",
        proofUrl: "https://bitmesra.ac.in/reports/sensor-telemetry-live.pdf",
        notes: "Telemetry validated with 99.4% packet delivery during pre-monsoon showers.",
        updatedAt: new Date(),
      },
      {
        solutionId: sol1.id,
        order: 3,
        title: "Automated Pneumatic Silt Trap Installation at Tagore Hill Outfall",
        description: "Mechanical installation of silt grates and compressed-air pulse agitators to prevent plastic clog accumulation.",
        status: "SUBMITTED",
        proofUrl: "https://bitmesra.ac.in/reports/pneumatic-install-inspection.pdf",
        notes: "Awaiting final District Magistrate sign-off.",
        updatedAt: new Date(),
      },
    ],
  });

  // Review for Solution 1
  await prisma.review.create({
    data: {
      solutionId: sol1.id,
      reviewerId: adminUser.id,
      role: "GOVT_NODAL",
      rating: 4.8,
      feasibilityScore: 4.9,
      impactScore: 4.8,
      costEffectiveness: 4.6,
      scalabilityScore: 4.9,
      feedback: "Exceptional engineering proposal by BIT Mesra. The real-time telemetry successfully alerted Ranchi Municipal emergency squads 45 minutes ahead of street inundation during recent thunderstorm. Fully endorsed for citywide replication.",
    },
  });

  await prisma.review.create({
    data: {
      solutionId: sol1.id,
      reviewerId: industryUser.id,
      role: "INDUSTRY",
      rating: 4.7,
      feasibilityScore: 4.8,
      impactScore: 4.9,
      costEffectiveness: 4.5,
      scalabilityScore: 4.8,
      feedback: "Tata Steel CSR Foundation approves ₹12 Lakhs grant co-sponsorship for phase 3 pneumatic agitator fabrication in Jamshedpur workshops.",
    },
  });

  // Competing Solution #1B for Morabadi Flooding (Enables Side-by-Side Proposal Comparison)
  const sol1_alt = await prisma.solution.create({
    data: {
      challengeId: chal1.id,
      authorId: createdSolvers["team.jalrakshak@demo.in"] || solverUser.id,
      teamName: "IIT-ISM AquaTech Innovators",
      title: "Modular Siphon-Assisted Gravity Stormwater Diversion & Dual-Stage Debris Gate",
      abstract: "A purely passive, zero-electricity gravity siphon and dual-stage floating debris gate designed to divert cloudburst peak volume into decentralized percolation recharge wells, cutting civil construction cost by 57%.",
      methodology: "1. Micro-catchment elevation grading.\n2. Modular prefabricated stainless steel debris grates.\n3. Quad-siphon gravity pipe assembly operating without motorized pumps.",
      techStack: JSON.stringify(["Gravity Siphon Hydrodynamics", "Modular Stainless Steel Grates", "Groundwater Recharge Wells"]),
      budgetEstimate: 620000,
      timelineMonths: 3,
      status: "PROPOSED",
      milestoneStage: "Phase 1: Conceptual Siphon Calibration",
    },
  });

  await prisma.milestone.create({
    data: {
      solutionId: sol1_alt.id,
      order: 1,
      title: "Gravity Siphon Hydrological Sizing & Sluice Prototype",
      description: "Computational fluid simulation of siphon discharge rate under 80mm/hr cloudburst.",
      status: "APPROVED",
      updatedAt: new Date(),
    },
  });

  await prisma.review.create({
    data: {
      solutionId: sol1_alt.id,
      reviewerId: adminUser.id,
      role: "GOVT_NODAL",
      rating: 4.4,
      feasibilityScore: 4.6,
      impactScore: 4.3,
      costEffectiveness: 4.9,
      scalabilityScore: 4.5,
      feedback: "Highly frugal and low-maintenance alternative. Good candidate for rapid seasonal deployment.",
    },
  });

  // Solution for Jharia Coal Fire
  const sol2 = await prisma.solution.create({
    data: {
      challengeId: chal2.id,
      authorId: createdSolvers["sneha.iitism@demo.in"],
      teamName: "IIT-ISM SubTerra Shield",
      title: "Drone Radiometric Thermal Mapping and High-Expansion Nitrogen Foam Inertization",
      abstract: "A geomechanical and thermodynamic containment approach utilizing thermal infrared UAV passes at 15m resolution, followed by deep borehole casing injection of temperature-stable nitrogen foams to starve subterranean coal fires of oxygen.",
      methodology: "1. Weekly radiometric UAV flyovers measuring ground skin thermal anomalies.\n2. Subsurface borehole casing down to 60 meters.\n3. Cryogenic nitrogen expansion foam injection into burning coal voids to drop temperature below spontaneous combustion threshold (60°C).",
      techStack: JSON.stringify(["Radiometric FLIR Drone", "Borehole Thermocouple Array", "High-Expansion N2 Foam", "GIS Anomaly Heatmap"]),
      budgetEstimate: 4200000,
      timelineMonths: 6,
      prototypeUrl: "https://iitism.ac.in/research/jharia-fire-inertization",
      status: "PILOT_DEPLOYED",
      milestoneStage: "Phase 2: Deep Borehole Casing & Foam Injection",
      govtEndorsed: true,
      endorsedBy: adminUser.name,
      endorsedAt: new Date("2024-03-25"),
    },
  });

  await prisma.milestone.createMany({
    data: [
      {
        solutionId: sol2.id,
        order: 1,
        title: "FLIR Thermal Radiometric Drone Benchmark Survey",
        description: "Mapped 4 sq km of Lodna Colliery surface temperature anomalies exceeding 85°C.",
        status: "APPROVED",
        proofUrl: "https://iitism.ac.in/reports/jharia-thermal-survey.pdf",
        updatedAt: new Date(),
      },
      {
        solutionId: sol2.id,
        order: 2,
        title: "Borehole Drilling and Deep Nitrogen Foam Chamber Pilot",
        description: "Constructed 4 injection points at 45m depth with thermocouple sensors.",
        status: "APPROVED",
        proofUrl: "https://iitism.ac.in/reports/borehole-injection-phase1.pdf",
        updatedAt: new Date(),
      },
    ],
  });

  // Upvotes and Comments
  await prisma.upvote.create({
    data: {
      userId: citizenUser.id,
      challengeId: chal1.id,
    },
  });

  await prisma.upvote.create({
    data: {
      userId: solverUser.id,
      challengeId: chal1.id,
    },
  });

  await prisma.upvote.create({
    data: {
      userId: citizenUser.id,
      challengeId: chal2.id,
    },
  });

  await prisma.comment.create({
    data: {
      challengeId: chal1.id,
      userId: citizenUser.id,
      content: "Thank you Dr. Aarav and BIT Mesra for deploying the water sensors. The alerts helped our residents move vehicles before the street flooded last Tuesday!",
    },
  });

  await prisma.comment.create({
    data: {
      challengeId: chal1.id,
      userId: adminUser.id,
      content: "Disaster Management Cell has issued approval for Phase 3 silt clearing grates. Municipal budget allocation sanctioned.",
    },
  });

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      action: "CHALLENGE_VERIFIED",
      entityType: "Challenge",
      entityId: chal1.id,
      actorId: adminUser.id,
      actorName: adminUser.name,
      details: JSON.stringify({ severity: "CRITICAL", universityAssigned: "BIT-MESRA", remarks: "Severe flash flood vulnerability confirmed." }),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "SOLUTION_ENDORSED",
      entityType: "Solution",
      entityId: sol1.id,
      actorId: adminUser.id,
      actorName: adminUser.name,
      details: JSON.stringify({ rating: 4.8, status: "GOVT_VERIFIED", grantPledge: "Tata Steel Foundation ₹12L" }),
    },
  });

  console.log("✅ JanSahaya database seeded successfully with 25 challenges, 12 solvers, 4 industry CSRs, 1 admin, and realistic solutions!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
