import "dotenv/config";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const raw = process.env.DATABASE_URL ?? "file:./dev.db";
const filePath = raw.startsWith("file:") ? raw.slice(5) : raw;
const resolved = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
const adapter = new PrismaBetterSqlite3({ url: resolved });
const db = new PrismaClient({ adapter });

function weeksAgo(n: number): Date {
  const d = new Date("2026-06-01");
  d.setDate(d.getDate() - n * 7);
  return d;
}

function bookingMix(members: number, type: "healthy" | "at-risk" | "new") {
  const ratios = {
    "healthy":  { member: 0.62, pack: 0.22, pass: 0.11 },
    "at-risk":  { member: 0.42, pack: 0.20, pass: 0.32 },
    "new":      { member: 0.52, pack: 0.26, pass: 0.16 },
  }[type];
  const jitter = () => Math.round((Math.random() - 0.5) * 8);
  return {
    memberBookings:    Math.max(1, Math.round(members * ratios.member) + jitter()),
    classPackBookings: Math.max(1, Math.round(members * ratios.pack)   + jitter()),
    classPassBookings: Math.max(1, Math.round(members * ratios.pass)   + jitter()),
  };
}

function healthyMetrics(studioId: string, base: { fill: number; members: number; revenue: number }) {
  return Array.from({ length: 26 }, (_, i) => {
    const activeMemberships = Math.max(80, Math.round(base.members + (25 - i) * 2 + (Math.random() - 0.5) * 10));
    return {
      studioId,
      weekOf: weeksAgo(i),
      classFillRate:     Math.max(0.55, base.fill    + (Math.random() - 0.45) * 0.08),
      activeMemberships,
      weeklyChurn:       Math.max(0.005, 0.018 + (Math.random() - 0.5) * 0.008),
      weeklyRevenue:     Math.max(8000,  base.revenue + (25 - i) * 120 + (Math.random() - 0.5) * 800),
      presalesPipelineCount: 0,
      ...bookingMix(activeMemberships, "healthy"),
    };
  });
}

function atRiskMetrics(studioId: string, base: { fill: number; members: number; revenue: number }) {
  return Array.from({ length: 26 }, (_, i) => {
    const decline = Math.min(i, 14);
    const activeMemberships = Math.max(60, Math.round(base.members - decline * 4 + (Math.random() - 0.5) * 5));
    return {
      studioId,
      weekOf: weeksAgo(i),
      classFillRate:     Math.max(0.30, base.fill    - Math.min(i, 10) * 0.015 + (Math.random() - 0.5) * 0.03),
      activeMemberships,
      weeklyChurn:       Math.min(0.12,  0.065 + Math.min(i, 10) * 0.002 + (Math.random() - 0.5) * 0.01),
      weeklyRevenue:     Math.max(5000,  base.revenue - Math.min(i, 14) * 250 + (Math.random() - 0.5) * 500),
      presalesPipelineCount: 0,
      ...bookingMix(activeMemberships, "at-risk"),
    };
  });
}

function newStudioMetrics(studioId: string, base: { fill: number; members: number; revenue: number }) {
  return Array.from({ length: 26 }, (_, i) => {
    const ramp = (25 - i) / 25;
    const activeMemberships = Math.max(20, Math.round(base.members * (0.25 + 0.75 * ramp) + (Math.random() - 0.5) * 5));
    return {
      studioId,
      weekOf: weeksAgo(i),
      classFillRate:     Math.max(0.15, base.fill * (0.25 + 0.75 * ramp) + (Math.random() - 0.5) * 0.04),
      activeMemberships,
      weeklyChurn:       Math.max(0.01,  0.038 - ramp * 0.012 + (Math.random() - 0.5) * 0.006),
      weeklyRevenue:     Math.max(1500,  base.revenue * (0.25 + 0.75 * ramp) + (Math.random() - 0.5) * 400),
      presalesPipelineCount: 0,
      ...bookingMix(activeMemberships, "new"),
    };
  });
}

function preLaunchMetrics(studioId: string, presalesBase: number) {
  return Array.from({ length: 26 }, (_, i) => ({
    studioId,
    weekOf: weeksAgo(i),
    classFillRate: 0,
    activeMemberships: 0,
    weeklyChurn: 0,
    weeklyRevenue: 0,
    presalesPipelineCount: Math.max(0, Math.round(presalesBase * Math.max(0, 1 - i / 30) + Math.round((Math.random() - 0.3) * 6))),
  }));
}

const FRANCHISEES = [
  "Marcus Chen", "Priya Sharma", "Marcus Chen", "Priya Sharma", "Marcus Chen",
  "Priya Sharma", "Marcus Chen", "Priya Sharma", "Marcus Chen", "Priya Sharma",
  "Marcus Chen",
];

let fIdx = 0;
const f = () => FRANCHISEES[fIdx++ % FRANCHISEES.length];

const STUDIO_CONTACT: Record<string, { address: string | null; phone: string | null }> = {
  // Florida – Palm Beach County cluster
  "West Boca":          { address: "9512 Palmetto Rd.",                  phone: "(561) 555-0562" },
  "West Palm Beach":    { address: "517 Harbor Blvd.",                    phone: "(561) 555-0673" },
  "Wellington":         { address: "3198 S. Parkway 7, Unit 222",         phone: "(561) 555-0451" },
  "Palm Beach Gardens": { address: "12245 Palmway Plaza, Suite 220",      phone: "(561) 555-0127" },
  "Delray Beach":       { address: "403 East 5th Ave.",                   phone: "(561) 555-0367" },
  // Florida – Miami cluster
  "Sunset Harbour":     { address: "2204 Canal Ave., 3rd Floor",           phone: "(786) 555-0349" },
  "Edgewater":          { address: "3312 Biscayne Ct., Suite 110",         phone: "(305) 555-0856" },
  // New Jersey cluster
  "Florham Park":       { address: "243 Columbia Way",                    phone: "(973) 555-0127" },
  "Wayne":              { address: "714 Valley Rd., Unit #32",            phone: "(973) 555-0451" },
  "Montclair":          { address: "418 Pompton Blvd.",                   phone: "(973) 555-0238" },
  "Woodcliff Lake":     { address: "581 Chestnut Ridge Way",              phone: "(201) 555-0562" },
  "Somerville":         { address: "247 West Elm St.",                    phone: "(908) 555-0349" },
  // Southeast expansion
  "West End Greenville":{ address: "315 Riverside Walk",                  phone: "(864) 555-0127" },
  // Pre-launch
  "Midtown Nashville":  { address: "1042 21st Ave. S",                    phone: null },
};

type SD = {
  name: string; city: string; state: string | null; country: string;
  region: string; status: string; openedAt: Date | null;
  address?: string | null; phone?: string | null;
};

async function main() {
  await db.anomaly.deleteMany();
  await db.review.deleteMany();
  await db.classMetric.deleteMany();
  await db.instructor.deleteMany();
  await db.studioMetric.deleteMany();
  await db.inventoryItem.deleteMany();
  await db.salesRecord.deleteMany();
  await db.studioOperations.deleteMany();
  await db.maintenanceItem.deleteMany();
  await db.studio.deleteMany();

  const studioDefs: SD[] = [
    // ── SOUTHEAST – Florida (Palm Beach County cluster) ───────────────────────
    { name: "West Boca",          city: "Boca Raton",         state: "FL", country: "US", region: "Southeast", status: "healthy",    openedAt: new Date("2022-10-01") },
    { name: "West Palm Beach",    city: "West Palm Beach",    state: "FL", country: "US", region: "Southeast", status: "healthy",    openedAt: new Date("2023-06-15") },
    { name: "Wellington",         city: "Wellington",         state: "FL", country: "US", region: "Southeast", status: "healthy",    openedAt: new Date("2023-11-08") },
    { name: "Palm Beach Gardens", city: "Palm Beach Gardens", state: "FL", country: "US", region: "Southeast", status: "healthy",    openedAt: new Date("2024-08-20") },
    { name: "Delray Beach",       city: "Delray Beach",       state: "FL", country: "US", region: "Southeast", status: "new",        openedAt: new Date("2026-04-10") },
    // ── SOUTHEAST – Florida (Miami cluster) ───────────────────────────────────
    { name: "Sunset Harbour",     city: "Miami Beach",        state: "FL", country: "US", region: "Southeast", status: "healthy",    openedAt: new Date("2022-10-01") },
    { name: "Edgewater",          city: "Miami",              state: "FL", country: "US", region: "Southeast", status: "healthy",    openedAt: new Date("2024-02-14") },
    // ── NORTHEAST – New Jersey ────────────────────────────────────────────────
    { name: "Florham Park",       city: "Florham Park",       state: "NJ", country: "US", region: "Northeast", status: "healthy",    openedAt: new Date("2024-04-10") },
    { name: "Wayne",              city: "Wayne",              state: "NJ", country: "US", region: "Northeast", status: "healthy",    openedAt: new Date("2024-06-25") },
    { name: "Somerville",         city: "Somerville",         state: "NJ", country: "US", region: "Northeast", status: "healthy",    openedAt: new Date("2025-01-15") },
    { name: "Montclair",          city: "Verona",             state: "NJ", country: "US", region: "Northeast", status: "at-risk",    openedAt: new Date("2024-11-20") },
    { name: "Woodcliff Lake",     city: "Woodcliff Lake",     state: "NJ", country: "US", region: "Northeast", status: "new",        openedAt: new Date("2026-01-27") },
    // ── SOUTHEAST – expansion ─────────────────────────────────────────────────
    { name: "West End Greenville",city: "Greenville",         state: "SC", country: "US", region: "Southeast", status: "new",        openedAt: new Date("2025-06-01") },
    // ── PRE-LAUNCH ────────────────────────────────────────────────────────────
    { name: "Midtown Nashville",  city: "Nashville",          state: "TN", country: "US", region: "Southeast", status: "pre-launch", openedAt: null },
  ];

  const created = await Promise.all(
    studioDefs.map(sd => {
      const contact = STUDIO_CONTACT[sd.name] ?? { address: null, phone: null };
      return db.studio.create({
        data: { name: sd.name, city: sd.city, state: sd.state, country: sd.country, region: sd.region, status: sd.status, openedAt: sd.openedAt, franchiseeName: f(), address: contact.address, phone: contact.phone },
      });
    })
  );

  const byName: Record<string, string> = {};
  created.forEach((s, i) => { byName[studioDefs[i].name] = s.id; });

  // ── METRICS ───────────────────────────────────────────────────────────────

  type MetricDef = { name: string; type: "healthy" | "at-risk" | "new"; base: { fill: number; members: number; revenue: number } };

  const metricDefs: MetricDef[] = [
    // Florida – Palm Beach County
    { name: "West Boca",           type: "healthy", base: { fill: 0.81, members: 278, revenue: 24900 } },
    { name: "West Palm Beach",     type: "healthy", base: { fill: 0.76, members: 241, revenue: 21600 } },
    { name: "Wellington",          type: "healthy", base: { fill: 0.73, members: 218, revenue: 19500 } },
    { name: "Palm Beach Gardens",  type: "healthy", base: { fill: 0.74, members: 224, revenue: 20100 } },
    { name: "Delray Beach",        type: "new",     base: { fill: 0.53, members:  88, revenue:  7900 } },
    { name: "Sunset Harbour",      type: "healthy", base: { fill: 0.83, members: 294, revenue: 26300 } },
    { name: "Edgewater",           type: "healthy", base: { fill: 0.76, members: 231, revenue: 20700 } },
    // New Jersey
    { name: "Florham Park",        type: "healthy", base: { fill: 0.72, members: 207, revenue: 18600 } },
    { name: "Wayne",               type: "healthy", base: { fill: 0.71, members: 198, revenue: 17800 } },
    { name: "Somerville",          type: "healthy", base: { fill: 0.68, members: 183, revenue: 16400 } },
    { name: "Montclair",           type: "at-risk", base: { fill: 0.47, members: 124, revenue: 11100 } },
    { name: "Woodcliff Lake",      type: "new",     base: { fill: 0.54, members:  82, revenue:  7500 } },
    // Southeast expansion
    { name: "West End Greenville", type: "new",     base: { fill: 0.52, members:  96, revenue:  8600 } },
  ];

  const preLaunchPresales: Record<string, number> = {
    "Midtown Nashville": 118,
  };

  const allMetrics: object[] = [];
  for (const def of metricDefs) {
    const id = byName[def.name];
    if (!id) continue;
    if (def.type === "healthy") allMetrics.push(...healthyMetrics(id, def.base));
    if (def.type === "at-risk") allMetrics.push(...atRiskMetrics(id, def.base));
    if (def.type === "new")     allMetrics.push(...newStudioMetrics(id, def.base));
  }
  for (const sd of studioDefs.filter(s => s.status === "pre-launch")) {
    const id = byName[sd.name];
    if (!id) continue;
    const base = preLaunchPresales[sd.name] ?? Math.floor(35 + Math.random() * 85);
    allMetrics.push(...preLaunchMetrics(id, base));
  }
  await db.studioMetric.createMany({ data: allMetrics as any });

  // ── STAFF ─────────────────────────────────────────────────────────────────

  const dooPool = [
    "Elara Whitmore", "Petra Caldwell", "Nora Langfield", "Mila Ashford",
    "Lyra Hartmore", "Isla Moorland", "Fern Prescott", "Demi Clifton",
    "Clara Brentmore", "Blythe Fairchild", "Anya Hollister", "Wren Blackwell",
  ];
  const gmPool = [
    "Aria Lockwood", "Luna Hensley", "Nova Clayfield", "Stella Clifford",
    "Cleo Moorland", "Sage Westfield", "Remi Holloway", "Quinn Brentmore",
    "Juno Callaway", "Vera Langmore", "Alba Ellington", "Zoe Hartfield",
  ];
  const instrPool = [
    "Aria Langmore", "Luna Whitfield", "Nova Caldmore", "Stella Hartmore",
    "Cleo Fieldmore", "Sage Blackfield", "Remi Langfield", "Quinn Moormore",
    "Juno Whitmore", "Elara Caldfield", "Vera Hartfield", "Petra Fieldmore",
    "Nora Blackmore", "Mila Langmore", "Lyra Whitfield", "Isla Caldmore",
    "Fern Hartmore", "Demi Fieldmore", "Clara Blackfield", "Blythe Langfield",
    "Anya Moormore", "Wren Whitmore", "Tess Caldfield", "Sable Hartfield",
    "Rowan Fieldmore", "Piper Blackmore", "Opal Langmore", "Nola Whitfield",
    "Maren Caldmore", "Linden Hartmore", "Katia Fieldmore", "June Blackfield",
    "Iris Langfield", "Hazel Moormore", "Gia Whitmore", "Faye Caldfield",
    "Eve Hartfield", "Dawn Fieldmore", "Coral Blackmore", "Briar Langmore",
    "Ava Whitfield", "Alma Caldmore", "Alba Hartmore", "Aida Fieldmore",
    "Zoe Blackfield", "Yara Langfield", "Xena Moormore", "Winona Whitmore",
  ];
  const leadPool = [
    "Aria Caldfield", "Luna Hartfield", "Nova Fieldmore", "Stella Blackmore",
    "Cleo Langmore", "Sage Whitfield", "Remi Caldmore", "Quinn Hartmore",
    "Juno Fieldmore", "Elara Blackfield", "Vera Langfield", "Petra Moormore",
    "Nora Whitmore", "Mila Caldfield", "Lyra Hartfield", "Isla Fieldmore",
    "Fern Blackmore", "Demi Langmore", "Clara Whitfield", "Anya Caldmore",
    "Wren Hartmore", "Tess Fieldmore", "Sable Blackfield", "Rowan Langmore",
  ];

  let dooIdx = 0, gmIdx = 0, instrIdx = 0, leadIdx = 0;
  const doo  = () => dooPool[dooIdx++    % dooPool.length];
  const gm   = () => gmPool[gmIdx++     % gmPool.length];
  const inst = () => instrPool[instrIdx++ % instrPool.length];
  const lead = () => leadPool[leadIdx++   % leadPool.length];

  const instrData: object[] = [];
  const studioInstructorNames: Record<string, string[]> = {};

  function addStaff(studioName: string, opts: { instructors: number; leads: number; atRisk?: boolean }) {
    const id = byName[studioName];
    if (!id) return;

    instrData.push({
      studioId: id, name: doo(), role: "director_of_operations",
      certificationStatus: "certified",
      lastEvalDate: new Date("2026-04-01"),
      performanceScore: Math.floor(85 + Math.random() * 12),
    });

    instrData.push({
      studioId: id, name: gm(), role: "general_manager",
      certificationStatus: "certified",
      lastEvalDate: new Date("2026-04-01"),
      performanceScore: Math.floor(82 + Math.random() * 14),
    });

    for (let i = 0; i < opts.leads; i++) {
      instrData.push({
        studioId: id, name: lead(), role: "studio_lead",
        certificationStatus: "certified",
        lastEvalDate: new Date("2026-04-15"),
        performanceScore: Math.floor(80 + Math.random() * 16),
      });
    }

    if (!studioInstructorNames[studioName]) studioInstructorNames[studioName] = [];
    for (let i = 0; i < opts.instructors; i++) {
      const expired = !!opts.atRisk && i < Math.ceil(opts.instructors * 0.4);
      const pending = !expired && !!opts.atRisk && i === opts.instructors - 1;
      const name = inst();
      studioInstructorNames[studioName].push(name);
      instrData.push({
        studioId: id, name, role: "instructor",
        certificationStatus: expired ? "expired" : pending ? "pending" : "certified",
        lastEvalDate: expired ? new Date("2025-10-15") : pending ? null : new Date("2026-04-20"),
        performanceScore: expired ? Math.floor(65 + Math.random() * 12) : pending ? null : Math.floor(80 + Math.random() * 16),
      });
    }
  }

  for (const sd of studioDefs.filter(s => s.status !== "pre-launch")) {
    const atRisk = sd.status === "at-risk";
    const isNew  = sd.status === "new";
    const instrCount = atRisk ? 3 : isNew ? 4 : 6;
    const leadCount  = atRisk ? 1 : isNew ? 1 : 2;
    addStaff(sd.name, { instructors: instrCount, leads: leadCount, atRisk });
  }

  await db.instructor.createMany({ data: instrData as any });

  // ── ANOMALIES ─────────────────────────────────────────────────────────────

  await db.anomaly.createMany({
    data: [
      { studioId: byName["Montclair"],          generatedAt: new Date("2026-05-28"), severity: "high",   category: "churn",      resolved: false, summary: "Montclair has reported a 28% spike in membership cancellations over the past 6 weeks. Three instructor departures were logged in the same period — the studio currently has two expired certifications and one pending evaluation. Immediate field ops visit and instructor recruitment push recommended to stabilize the client experience before further attrition." },
      { studioId: byName["Montclair"],          generatedAt: new Date("2026-06-01"), severity: "high",   category: "occupancy",  resolved: false, summary: "Montclair class fill rate has declined from 68% to 47% over 8 consecutive weeks. An established boutique cycling competitor opened within 0.3 miles in March. Recommend a targeted win-back promotion, a class schedule audit, and a review of peak-slot pricing before the summer season." },
      { studioId: byName["West End Greenville"],generatedAt: new Date("2026-06-02"), severity: "medium", category: "membership", resolved: false, summary: "West End Greenville opened June 2025 and membership ramp is tracking 18% below the Southeast new-studio benchmark. Presales conversion was strong; referral program activation and increased local community partnership spend recommended to accelerate the membership curve." },
      { studioId: byName["Woodcliff Lake"],     generatedAt: new Date("2026-06-01"), severity: "low",    category: "membership", resolved: false, summary: "Woodcliff Lake opened January 2026 and is building steadily, but fill rate is at 54% against a 65% 5-month benchmark. Presales pipeline was healthy at 118 members. Recommend activating the referral program one month earlier than the standard NJ market timeline given strong early community interest." },
      { studioId: byName["Wayne"],              generatedAt: new Date("2026-05-25"), severity: "low",    category: "instructor", resolved: false, summary: "Two instructors at Wayne have recertification deadlines within the next 30 days. Recommend scheduling evaluation slots before peak summer season to ensure full certified class capacity through July and August." },
    ],
  });

  // ── REVIEWS ───────────────────────────────────────────────────────────────

  const FIVE_STAR: { author: string; body: string; source: string }[] = [
    { author: "Sarah M.",    source: "google",    body: "Best Pilates studio I've been to. The instructors are world-class and genuinely invest in your progress. My posture, strength, and flexibility have all improved dramatically. Completely obsessed." },
    { author: "Jessica L.",  source: "classpass", body: "I drive 30 minutes just to come here. The reformer classes are unlike anything else — intense, fun, and the community is incredible. Worth every single penny." },
    { author: "Natalie R.",  source: "google",    body: "Completely transformed my fitness routine. Instructors know your name, remember your goals, and push you just enough. Six months in and I'm the strongest I've ever been." },
    { author: "Amanda T.",   source: "classpass", body: "The energy in this studio is unmatched. Amazing instructors, great music, truly boutique experience. I've recommended JetSet to everyone I know — nobody has been disappointed." },
    { author: "Lauren K.",   source: "google",    body: "If you're on the fence, just try one class. You'll be hooked. The workout is challenging in all the right ways and the instructors make everyone feel welcome regardless of fitness level." },
    { author: "Priya N.",    source: "google",    body: "I was a skeptic — I thought Pilates was too slow-paced for me. After one class I was proven completely wrong. This is full-body strength training on a different level. I come 4x a week now." },
    { author: "Diana C.",    source: "classpass", body: "Professional, welcoming, and seriously effective. My back pain is completely gone and my core has never been stronger. The instructors really know their craft." },
    { author: "Michelle Y.", source: "google",    body: "Hands down the best group fitness experience I've had. Small class sizes mean actual attention to form, which has made a huge difference for me. Can't imagine going anywhere else." },
    { author: "Taylor E.",   source: "classpass", body: "JetSet has ruined all other workouts for me. Nothing compares. The combination of Pilates fundamentals with real strength training is brilliant. Every instructor brings something different to the class." },
    { author: "Camille B.",  source: "google",    body: "I've tried SoulCycle, Orangetheory, CrossFit — nothing has transformed my body like JetSet. The reformer is no joke. Within two months I had visible results I hadn't achieved in years." },
    { author: "Rachel P.",   source: "classpass", body: "The studio itself is beautiful — clean, modern, and well-maintained. But it's really the instructors that make this place special. They remember your name from day one and genuinely care." },
    { author: "Stephanie W.", source: "google",   body: "Incredible studio. The classes are always perfectly structured — tough enough to feel like you worked hard, but you leave feeling energized not destroyed. This is my happy place." },
    { author: "Kristin A.",  source: "google",    body: "Three months in and I'm genuinely shocked by my progress. My core is stronger than it's ever been and my posture has completely transformed. The reformer format is unlike anything I've tried before — addictive in the best way." },
    { author: "Beth N.",     source: "classpass", body: "Came back to exercise after a two-year break and this studio made it feel completely safe and exciting. The instructors modified everything for my level and never made me feel behind. Truly the best re-entry into fitness I could have asked for." },
    { author: "Caroline M.", source: "google",    body: "The 6am classes alone are worth the membership. Energetic, perfectly curated, and the instructors show up with the same enthusiasm every single time. Leaving a morning class here feels better than any coffee." },
    { author: "Vanessa T.",  source: "classpass", body: "Every single instructor has something different to offer and all of them are exceptional. No two classes feel the same, which keeps me consistently motivated. Six months in and I still get excited to come every week." },
    { author: "Paige L.",    source: "google",    body: "I've done SoulCycle, Orangetheory, yoga, HIIT — nothing has made me feel as strong as consistent reformer work here. It builds real functional strength, not just cardio. Game changer for me." },
    { author: "Amber J.",    source: "classpass", body: "The playlists alone are worth showing up for but the workouts genuinely deliver. I came for one class and immediately bought a membership. The vibe is upscale without being intimidating — everyone is welcome here." },
    { author: "Rose K.",     source: "google",    body: "Signed up on a whim three months ago and have not looked back. I can see my body changing in ways that years of gym work never produced. The reformer targets muscles I didn't know I had. Completely sold." },
    { author: "Nina P.",     source: "classpass", body: "The community at this studio is just as impressive as the workout. Within a few weeks, instructors knew my name and goals. There's a real sense of belonging here. I bring everyone I know and they all end up staying." },
  ];

  const FOUR_STAR: { author: string; body: string; source: string }[] = [
    { author: "Olivia S.",   source: "google",    body: "Really great studio with knowledgeable instructors. My only wish is that there were more class times available in the evenings — they fill up so fast! Still absolutely worth booking in advance." },
    { author: "Kate H.",     source: "classpass", body: "Fantastic workout and amazing instructors. Parking can be tricky depending on the time of day but once you're inside the studio is beautiful and the class is totally worth the hassle." },
    { author: "Brooke M.",   source: "google",    body: "Love this studio. The classes are challenging in all the right ways. Gave 4 stars only because the booking app is clunky sometimes, but the actual in-studio experience is top notch." },
    { author: "Lexi F.",     source: "classpass", body: "Great experience overall. Instructors are attentive and the reformers are high quality. A few instructor changes lately but the core team is still excellent. Will definitely keep coming." },
    { author: "Morgan D.",   source: "google",    body: "Really solid studio. The reformer Pilates format works so well — challenging but low impact so my joints feel great. I come about 3x a week and have noticed a huge improvement in my overall fitness." },
    { author: "Haley J.",    source: "classpass", body: "Super clean, professional, and the instructors clearly know their stuff. I'd give it 5 stars but the waitlist situation is real — you have to book days in advance for popular time slots." },
    { author: "Jenna W.",    source: "google",    body: "Really solid studio. My only small complaint is that the early morning slots are incredibly hard to book — they fill up within minutes. Clearly a sign that the classes are great, which they are. Just wish there was more availability." },
    { author: "Carly D.",    source: "classpass", body: "Excellent experience overall. The reformers are top quality and the instructors clearly love what they do. The front desk check-in process is a little slow during peak hours but that's genuinely the only thing I'd flag." },
    { author: "Andrea K.",   source: "google",    body: "Love this place. Strong 4 stars — I'd give 5 but I've had two classes cancelled last-minute over the past few months. That said, every class I've actually attended has been fantastic and the team is incredibly warm." },
    { author: "Harper T.",   source: "classpass", body: "Really great workout and professional staff. I find the class pacing a bit intense for where I currently am but others in my class clearly thrived on it. More beginner-specific slots would be a nice addition." },
  ];

  const THREE_STAR: { author: string; body: string; source: string }[] = [
    { author: "Christina B.", source: "google",    body: "Used to be my favorite studio but quality has slipped over the past few months. A lot of instructor turnover and some of the newer instructors aren't quite at the same level yet. Hoping it gets back to where it was." },
    { author: "Allison T.",   source: "classpass", body: "Hit or miss depending on the instructor. When you get a great one it's a 5-star experience, but lately the consistency just isn't there. The concept is great — execution needs some work." },
    { author: "Dana R.",      source: "google",    body: "The reformers are high quality and the workout is solid, but I've noticed the studio feels less personal lately. Classes seem more rushed and there's less attention to individual form corrections." },
    { author: "Kira W.",      source: "classpass", body: "Average experience for the price point. Some instructors are excellent, others are just okay. The studio is clean and well-equipped but I expect more personalization at this price." },
    { author: "Patricia F.",  source: "google",    body: "The reformer quality and facility are genuinely excellent. But I've had two instructors who didn't offer any modifications for a small injury I mentioned. At this price point I expect better attention to individual needs." },
    { author: "Valerie H.",   source: "classpass", body: "Mixed feelings. The best classes here are legitimately 5 stars. But there's a significant gap between the senior and newer instructors. If you can specifically book the veterans, do — otherwise it's pretty average." },
    { author: "Sandra N.",    source: "google",    body: "Good not great. The equipment is pristine and the studio looks beautiful. But over the past couple of months the class experience has felt more transactional. Less of the community feel that made me sign up." },
  ];

  const TWO_STAR: { author: string; body: string; source: string }[] = [
    { author: "Monica V.",   source: "google",    body: "Really disappointed in how things have gone recently. Loved this place when it first opened but there have been a lot of changes and it just doesn't feel the same. Instructor departures, half-full classes — something's off." },
    { author: "Tara S.",     source: "classpass", body: "The late cancel policy is extremely punitive — $35 for canceling 10 hours before class due to an emergency. Workout is fine but the policies and the way customer service handled my complaint left a lot to be desired." },
    { author: "Brittany L.", source: "google",    body: "I really wanted to love this place. The equipment is great and the concept is solid, but the management feel has really declined. Class sizes feel too big now and instructors are stretched thin." },
    { author: "Melissa C.",  source: "google",    body: "Really disappointed lately. The quality used to be consistently excellent and now it feels hit-or-miss. Two instructor departures in one month, classes that feel rushed. Not what I signed up for." },
    { author: "Whitney B.",  source: "classpass", body: "The equipment is good but the experience has gone downhill. Long waitlists followed by last-minute cancellations, and when I reached out to customer service I felt completely brushed off. Reconsidering my membership." },
  ];

  const NEW_STUDIO: { author: string; body: string; source: string }[] = [
    { author: "Grace A.",    source: "google",    body: "Just opened and already feels like a special place. The instructors are clearly passionate and so attentive. The studio is beautiful and the community is already forming. Can't wait to watch this place grow!" },
    { author: "Isabella H.", source: "classpass", body: "So happy this studio opened nearby. Modern equipment, excellent instruction, and a genuinely welcoming vibe. The instructors take extra time with newer clients which I really appreciate." },
    { author: "Sophie N.",   source: "google",    body: "Early adopter here and loving every single class. The instructors correct your form throughout and make sure you're getting the most out of the workout. Impressed with the quality for such a new studio." },
    { author: "Zoe K.",      source: "classpass", body: "Tried it on a whim and now I'm fully committed. Great energy for a brand new studio — already feels like a real community. Instructors are top tier. So glad they came to this area." },
    { author: "Ava R.",      source: "google",    body: "Brand new but already running like a well-oiled machine. Punctual classes, beautiful space, and instructors who genuinely care. Already booked my next two weeks of classes." },
    { author: "Lily S.",     source: "google",    body: "Just discovered this studio and I'm already obsessed. New location but you can tell the team has deep experience — everything is polished, professional, and so welcoming. My new weekly ritual." },
    { author: "Emma J.",     source: "classpass", body: "Tried it the first week they opened and the quality blew me away for a brand new studio. The instructors are patient, the equipment is immaculate, and the class structure is one of the best I've experienced anywhere." },
    { author: "Nora K.",     source: "google",    body: "So glad this opened near me. I was intimidated by reformer Pilates before but the instructors here made the first class feel completely approachable. Already booked my third class and I've only been twice." },
  ];

  function daysAgo(n: number): Date {
    const d = new Date("2026-06-01");
    d.setDate(d.getDate() - n);
    return d;
  }

  const reviewData: object[] = [];

  studioDefs.filter(s => s.status !== "pre-launch").forEach((sd, studioIdx) => {
    const id = byName[sd.name];
    if (!id) return;

    const o = studioIdx;
    const isAtRisk = sd.status === "at-risk";
    const isNew    = sd.status === "new";

    if (isNew) {
      const picks = [0, 1, 2, 3, 4, (o % 3 === 0 ? 5 : o % 3 === 1 ? 6 : 7)].slice(0, 5 + (o % 2));
      picks.forEach((pi, i) => {
        const t = NEW_STUDIO[pi % NEW_STUDIO.length];
        reviewData.push({ studioId: id, source: t.source, author: t.author, rating: 5, body: t.body, reviewDate: daysAgo(8 + i * 12 + (o % 7)) });
      });
      const four = FOUR_STAR[(o + 2) % FOUR_STAR.length];
      reviewData.push({ studioId: id, source: "classpass", author: four.author, rating: 4, body: four.body, reviewDate: daysAgo(5 + (o % 8)) });
      const fourB = FOUR_STAR[(o + 5) % FOUR_STAR.length];
      reviewData.push({ studioId: id, source: "google", author: fourB.author, rating: 4, body: fourB.body, reviewDate: daysAgo(20 + (o % 10)) });

    } else if (isAtRisk) {
      const fivePick = FIVE_STAR[(o + 3) % FIVE_STAR.length];
      reviewData.push({ studioId: id, source: "google", author: fivePick.author, rating: 5, body: fivePick.body, reviewDate: daysAgo(90 + (o % 30)) });
      const fourPick = FOUR_STAR[(o + 1) % FOUR_STAR.length];
      reviewData.push({ studioId: id, source: "classpass", author: fourPick.author, rating: 4, body: fourPick.body, reviewDate: daysAgo(60 + (o % 20)) });
      const threeA = THREE_STAR[o % THREE_STAR.length];
      reviewData.push({ studioId: id, source: threeA.source, author: threeA.author, rating: 3, body: threeA.body, reviewDate: daysAgo(30 + (o % 15)) });
      const threeB = THREE_STAR[(o + 2) % THREE_STAR.length];
      reviewData.push({ studioId: id, source: threeB.source, author: threeB.author, rating: 3, body: threeB.body, reviewDate: daysAgo(18 + (o % 10)) });
      const threeC = THREE_STAR[(o + 4) % THREE_STAR.length];
      reviewData.push({ studioId: id, source: threeC.source, author: threeC.author, rating: 3, body: threeC.body, reviewDate: daysAgo(10 + (o % 8)) });
      const twoA = TWO_STAR[o % TWO_STAR.length];
      reviewData.push({ studioId: id, source: twoA.source, author: twoA.author, rating: 2, body: twoA.body, reviewDate: daysAgo(7 + (o % 6)) });
      if (o % 2 === 0) {
        const twoB = TWO_STAR[(o + 1) % TWO_STAR.length];
        reviewData.push({ studioId: id, source: twoB.source, author: twoB.author, rating: 2, body: twoB.body, reviewDate: daysAgo(3 + (o % 4)) });
      }

    } else {
      const fivePicks = [o % FIVE_STAR.length, (o + 2) % FIVE_STAR.length, (o + 4) % FIVE_STAR.length, (o + 7) % FIVE_STAR.length, (o + 10) % FIVE_STAR.length, (o + 13) % FIVE_STAR.length];
      const dateBases = [60, 42, 30, 20, 10, 3];
      fivePicks.forEach((pi, i) => {
        const t = FIVE_STAR[pi];
        reviewData.push({ studioId: id, source: t.source, author: t.author, rating: 5, body: t.body, reviewDate: daysAgo(dateBases[i] + (o % 8)) });
      });
      const fourA = FOUR_STAR[(o + o) % FOUR_STAR.length];
      reviewData.push({ studioId: id, source: "google", author: fourA.author, rating: 4, body: fourA.body, reviewDate: daysAgo(35 + (o % 12)) });
      const fourB = FOUR_STAR[(o + 3) % FOUR_STAR.length];
      reviewData.push({ studioId: id, source: "classpass", author: fourB.author, rating: 4, body: fourB.body, reviewDate: daysAgo(10 + (o % 9)) });
      const fourC = FOUR_STAR[(o + 6) % FOUR_STAR.length];
      reviewData.push({ studioId: id, source: fourC.source, author: fourC.author, rating: 4, body: fourC.body, reviewDate: daysAgo(22 + (o % 7)) });
      const three = THREE_STAR[o % THREE_STAR.length];
      reviewData.push({ studioId: id, source: three.source, author: three.author, rating: 3, body: three.body, reviewDate: daysAgo(55 + (o % 20)) });
    }
  });

  const NAMED_TEMPLATES = [
    { author: "Emily R.",   source: "google",    rating: 5, body: "{name}'s class changed my entire approach to fitness. She breaks down every movement so clearly — I left understanding my body better than years of other workouts combined." },
    { author: "Claire B.",  source: "classpass", rating: 5, body: "Took a class with {name} on a whim and she completely sold me on this studio. So motivating without being overwhelming, and her cueing is genuinely the best I've experienced." },
    { author: "Meg O.",     source: "google",    rating: 5, body: "{name}'s Saturday class was exactly what I needed. She modified for my lower back without making me feel singled out, and still gave me a seriously challenging workout. Phenomenal instructor." },
    { author: "Jess T.",    source: "classpass", rating: 4, body: "{name} is really great — very knowledgeable and encouraging. I just wish there were more of her time slots available during the week. Her 8am fills up instantly every single week." },
    { author: "Dani S.",    source: "google",    rating: 5, body: "I've been to dozens of boutique fitness studios and {name} is one of the best instructors I've ever had. She remembers your name, your limitations, and pushes you in exactly the right ways." },
    { author: "Rina M.",    source: "classpass", rating: 4, body: "{name} knew everyone in the room by the second class. The correction she gave me on my footwork made an immediate difference. Coming back every week from now on." },
    { author: "Holly P.",   source: "google",    rating: 5, body: "{name}'s energy is just infectious. The class flew by and I was genuinely shocked at how hard I'd worked. Already booked her next three slots — do not sleep on this instructor." },
    { author: "Kayla J.",   source: "classpass", rating: 3, body: "The studio itself is great but I think {name}'s pacing is a bit fast for where I am right now. Others in the class seemed to love it. Might try a different instructor next time." },
    { author: "Simone W.",  source: "google",    rating: 5, body: "First class with {name} and I was immediately a regular. She has this rare ability to make a room full of mixed levels all feel like the class was designed specifically for them." },
    { author: "Leah F.",    source: "classpass", rating: 5, body: "My friend dragged me to {name}'s class and now I'm going three times a week. The reformer work she programs is so smart — feels challenging but you never feel like you might injure yourself." },
  ];

  studioDefs.filter(s => s.status !== "pre-launch").forEach((sd, studioIdx) => {
    const id = byName[sd.name];
    if (!id) return;
    const names = studioInstructorNames[sd.name] ?? [];
    const count = Math.min(names.length, sd.status === "at-risk" ? 2 : sd.status === "new" ? 3 : 4);
    for (let i = 0; i < count; i++) {
      const firstName = names[i].split(" ")[0];
      const tpl = NAMED_TEMPLATES[(studioIdx + i * 3) % NAMED_TEMPLATES.length];
      reviewData.push({
        studioId: id,
        source: tpl.source,
        author: tpl.author,
        rating: tpl.rating,
        body: tpl.body.replace("{name}", firstName),
        reviewDate: daysAgo(7 + i * 12 + (studioIdx % 11)),
      });
    }
  });

  await db.review.createMany({ data: reviewData as any });

  // ── CLASS METRICS ─────────────────────────────────────────────────────────

  const SLOTS = [
    { slot: "6:00am",  tf: 0.80, evening: false },
    { slot: "7:00am",  tf: 0.92, evening: false },
    { slot: "7:30am",  tf: 1.00, evening: false },
    { slot: "8:00am",  tf: 0.98, evening: false },
    { slot: "8:30am",  tf: 0.96, evening: false },
    { slot: "9:00am",  tf: 0.93, evening: false },
    { slot: "9:30am",  tf: 0.90, evening: false },
    { slot: "10:00am", tf: 0.86, evening: false },
    { slot: "10:30am", tf: 0.83, evening: false },
    { slot: "11:00am", tf: 0.80, evening: false },
    { slot: "11:30am", tf: 0.78, evening: false },
    { slot: "12:00pm", tf: 0.75, evening: false },
    { slot: "12:30pm", tf: 0.72, evening: false },
    { slot: "4:00pm",  tf: 0.76, evening: true  },
    { slot: "5:00pm",  tf: 0.90, evening: true  },
    { slot: "5:30pm",  tf: 0.93, evening: true  },
    { slot: "6:00pm",  tf: 0.97, evening: true  },
    { slot: "6:30pm",  tf: 0.99, evening: true  },
    { slot: "7:00pm",  tf: 0.91, evening: true  },
    { slot: "8:00pm",  tf: 0.72, evening: true  },
  ];

  const classMetricData: object[] = [];

  studioDefs.filter(s => s.status !== "pre-launch").forEach((sd, si) => {
    const id = byName[sd.name];
    if (!id) return;
    const isAtRisk = sd.status === "at-risk";
    const isNew    = sd.status === "new";
    const baseFill = isAtRisk ? 0.50 : isNew ? 0.60 : 0.84;
    const cap = 12;

    for (let w = 0; w < 8; w++) {
      const weekFactor =
        isAtRisk ? 1.0 - (7 - w) * 0.04 :
        isNew    ? 0.65 + (7 - w) * 0.05 :
        1.0 + (si % 3 === 0 ? (w > 4 ? -0.05 : 0.02) : 0);

      for (let day = 0; day < 7; day++) {
        for (const { slot, tf, evening } of SLOTS) {
          if ((day === 0 || day === 6) && !["8:30am","9:30am","10:30am","11:30am","12:30pm","1:30pm","9:00am","10:00am"].includes(slot) && slot.includes("am") === false && slot.includes("6:00am")) continue;
          if ((day === 0 || day === 6) && parseFloat(slot) < 8 && slot.includes("am")) continue;

          const rawFill = Math.min(1, Math.max(0.05,
            baseFill * tf * weekFactor * (0.88 + Math.random() * 0.24)
          ));
          const deadSlot = ["8:00pm", "12:00pm", "4:00pm"][si % 3];
          const fillRate = slot === deadSlot && (isAtRisk || si % 4 === 0)
            ? rawFill * 0.40
            : rawFill;

          const spotsFilled = Math.max(0, Math.round(cap * fillRate));

          const memberRate  = evening ? 0.52 + (Math.random() - 0.5) * 0.10 : 0.68 + (Math.random() - 0.5) * 0.10;
          const packRate    = 0.18 + (Math.random() - 0.5) * 0.06;
          const passRate    = Math.max(0, 1 - memberRate - packRate);
          const mB  = Math.round(spotsFilled * memberRate);
          const pkB = Math.round(spotsFilled * packRate);
          const cpB = Math.max(0, spotsFilled - mB - pkB);

          classMetricData.push({
            studioId: id, dayOfWeek: day, timeSlot: slot,
            weekOf: weeksAgo(w), capacity: cap,
            spotsFilled, memberBookings: mB, classPackBookings: pkB, classPassBookings: cpB,
          });
        }
      }
    }
  });

  for (let i = 0; i < classMetricData.length; i += 1000) {
    await db.classMetric.createMany({ data: classMetricData.slice(i, i + 1000) as any });
  }

  // ── STUDIO OPERATIONS ─────────────────────────────────────────────────────

  function futureDate(yearsMin: number, yearsMax: number): Date {
    const d = new Date("2026-06-01");
    const months = Math.round((yearsMin + Math.random() * (yearsMax - yearsMin)) * 12);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  const ALARM_COS  = ["ADT Security", "Alarm.com", "Brinks Home", "Vivint Smart Home", "SimpliSafe"];
  const HVAC_COS   = ["Comfort Systems USA", "ARS Rescue Rooter", "One Hour Heating & AC", "ServiceMaster", "Lennox Service"];
  const ELECTRIC   = ["Mister Sparky", "Benjamin Franklin Plumbing", "Precision Electric", "Bright Electric", "PowerTech Services"];
  const ISPs       = ["Comcast Business", "AT&T Business", "Cox Business", "Spectrum Business", "Verizon Business"];
  const LANDLORDS  = [
    { name: "Pinnacle Properties LLC",      phone: "(800) 555-0100", email: "leasing@pinnacleprops.example.com" },
    { name: "Harbor Realty Group",          phone: "(800) 555-0101", email: "leasing@harborrealty.example.com" },
    { name: "Summit Commercial Realty",     phone: "(800) 555-0102", email: "leasing@summitcommercial.example.com" },
    { name: "Apex Retail Partners",         phone: "(800) 555-0103", email: "leasing@apexretail.example.com" },
    { name: "Meridian Property Group",      phone: "(800) 555-0104", email: "leasing@meridianproperty.example.com" },
    { name: "Cornerstone Realty Inc.",      phone: "(800) 555-0105", email: "leasing@cornerstonerealty.example.com" },
    { name: "Bridgewater Properties",       phone: "(800) 555-0106", email: "leasing@bridgewaterprops.example.com" },
    { name: "Keystone Retail LLC",          phone: "(800) 555-0107", email: "leasing@keystoneretail.example.com" },
    { name: "Landmark Property Group",      phone: "(800) 555-0108", email: "leasing@landmarkprops.example.com" },
    { name: "Clearwater Commercial",        phone: "(800) 555-0109", email: "leasing@clearwatercommercial.example.com" },
  ];

  const operationsData: object[] = [];
  const openStudios = studioDefs.filter(s => s.status !== "pre-launch");
  openStudios.forEach((sd, i) => {
    const id = byName[sd.name];
    if (!id) return;
    const ll = LANDLORDS[i % LANDLORDS.length];
    const alarm = ALARM_COS[i % ALARM_COS.length];
    const hvac  = HVAC_COS[i % HVAC_COS.length];
    const elec  = ELECTRIC[i % ELECTRIC.length];
    const isp   = ISPs[i % ISPs.length];
    const wifiChars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const wifiPwd = Array.from({ length: 12 }, (_, k) => wifiChars[(i * 7 + k * 3) % wifiChars.length]).join("");
    const alarmArea = Math.floor(1000 + (i * 137) % 9000);
    const alarmCode = `${alarmArea}`;
    const alarmPhone = `(${800 + (i % 10)}) ${200 + (i % 800)}-${1000 + (i % 9000)}`;
    const hvacPhone  = `(${305 + (i % 5) * 100}) ${400 + (i % 600)}-${2000 + (i % 8000)}`;
    const elecPhone  = `(${786 + (i % 3) * 50}) ${300 + (i % 700)}-${3000 + (i % 7000)}`;

    operationsData.push({
      studioId:              id,
      leaseExpiresAt:        futureDate(0.5, 6),
      landlordName:          ll.name,
      landlordPhone:         ll.phone,
      landlordEmail:         ll.email,
      alarmCompany:          alarm,
      alarmCode,
      alarmPhone,
      hvacCompany:           hvac,
      hvacPhone,
      hvacContractExpiresAt: futureDate(0.25, 2),
      electricianName:       elec,
      electricianPhone:      elecPhone,
      internetProvider:      isp,
      wifiPassword:          `JetSet${wifiPwd}!`,
      notes: i % 5 === 0 ? "After-hours key in lockbox by rear door. Code matches alarm." : null,
    });
  });

  await db.studioOperations.createMany({ data: operationsData as any });

  // ── SALES RECORDS ─────────────────────────────────────────────────────────

  function monthStart(monthsBack: number): Date {
    const d = new Date("2026-06-01");
    d.setDate(1);
    d.setMonth(d.getMonth() - monthsBack);
    return d;
  }

  type ProductDef = { product: string; category: string; unitPrice: number; baseUnits: number };
  const PRODUCTS: ProductDef[] = [
    { product: "Grip Socks – Small",    category: "grip_socks",     unitPrice: 20,  baseUnits: 32 },
    { product: "Grip Socks – Medium",   category: "grip_socks",     unitPrice: 20,  baseUnits: 45 },
    { product: "Grip Socks – Large",    category: "grip_socks",     unitPrice: 20,  baseUnits: 25 },
    { product: "Just Water",            category: "water",          unitPrice: 4,   baseUnits: 28 },
    { product: "Water Bottle",          category: "water",          unitPrice: 35,  baseUnits: 12 },
    { product: "Liquid IV Energy",      category: "energy_drinks",  unitPrice: 5,   baseUnits: 20 },
    { product: "PRIME Energy Drink",    category: "energy_drinks",  unitPrice: 4,   baseUnits: 24 },
    { product: "JetSet Tote Bag",       category: "merch",          unitPrice: 45,  baseUnits: 8  },
    { product: "JetSet Leggings",       category: "merch",          unitPrice: 95,  baseUnits: 5  },
    { product: "JetSet Sports Bra",     category: "merch",          unitPrice: 65,  baseUnits: 7  },
    { product: "Single Class",          category: "class_packages", unitPrice: 32,  baseUnits: 22 },
    { product: "10-Class Pack",         category: "class_packages", unitPrice: 280, baseUnits: 8  },
    { product: "20-Class Pack",         category: "class_packages", unitPrice: 520, baseUnits: 3  },
    { product: "Monthly Unlimited",     category: "memberships",    unitPrice: 199, baseUnits: 30 },
    { product: "Founding Membership",   category: "memberships",    unitPrice: 149, baseUnits: 20 },
    { product: "Gift Card $25",         category: "gift_cards",     unitPrice: 25,  baseUnits: 10 },
    { product: "Gift Card $50",         category: "gift_cards",     unitPrice: 50,  baseUnits: 8  },
    { product: "Gift Card $100",        category: "gift_cards",     unitPrice: 100, baseUnits: 4  },
  ];

  const salesData: object[] = [];
  const metricsByStudio = new Map<string, typeof metricDefs[0]>();
  metricDefs.forEach(m => metricsByStudio.set(byName[m.name] ?? "", m));

  openStudios.forEach((sd) => {
    const id = byName[sd.name];
    if (!id) return;
    const mDef = metricsByStudio.get(id);
    const healthMultiplier = mDef?.type === "healthy" ? 1.0 : mDef?.type === "new" ? 0.55 : 0.40;

    for (let mo = 0; mo < 12; mo++) {
      const month = monthStart(mo);
      const seasonFactor = [1.05, 1.03, 1.10, 1.08, 1.06, 0.92, 0.85, 0.88, 1.02, 1.08, 1.12, 1.15][month.getMonth()];

      PRODUCTS.forEach((p) => {
        const base = Math.round(p.baseUnits * healthMultiplier * seasonFactor);
        const jitter = () => Math.round((Math.random() - 0.5) * base * 0.3);
        const units = Math.max(0, base + jitter());
        salesData.push({
          studioId: id,
          month,
          category: p.category,
          product: p.product,
          unitsSold: units,
          revenue: units * p.unitPrice,
        });
      });
    }
  });

  await db.salesRecord.createMany({ data: salesData as any });

  // ── INVENTORY ITEMS ───────────────────────────────────────────────────────

  type InventoryDef = { name: string; category: string; reorderPoint: number; baseQty: number };
  const INVENTORY_ITEMS: InventoryDef[] = [
    { name: "Grip Socks – Small",       category: "retail",   reorderPoint: 20,  baseQty: 80  },
    { name: "Grip Socks – Medium",      category: "retail",   reorderPoint: 20,  baseQty: 100 },
    { name: "Grip Socks – Large",       category: "retail",   reorderPoint: 20,  baseQty: 60  },
    { name: "Water Bottles",            category: "retail",   reorderPoint: 10,  baseQty: 30  },
    { name: "Resistance Bands",         category: "retail",   reorderPoint: 10,  baseQty: 25  },
    { name: "Just Water",               category: "retail",   reorderPoint: 24,  baseQty: 72  },
    { name: "Liquid IV Packets",        category: "retail",   reorderPoint: 20,  baseQty: 60  },
    { name: "PRIME Energy Drink",       category: "retail",   reorderPoint: 24,  baseQty: 72  },
    { name: "JetSet Tote Bag",          category: "retail",   reorderPoint: 8,   baseQty: 20  },
    { name: "JetSet Leggings",          category: "retail",   reorderPoint: 6,   baseQty: 18  },
    { name: "JetSet Sports Bra",        category: "retail",   reorderPoint: 6,   baseQty: 16  },
    { name: "JetSet Tank Top",          category: "retail",   reorderPoint: 8,   baseQty: 22  },
    { name: "JetSet Zip Hoodie",        category: "retail",   reorderPoint: 5,   baseQty: 14  },
    { name: "JetSet Headband",          category: "retail",   reorderPoint: 10,  baseQty: 30  },
    { name: "Foam Roller",              category: "retail",   reorderPoint: 4,   baseQty: 10  },
    { name: "Paper Towels (rolls)",     category: "supplies", reorderPoint: 12,  baseQty: 48  },
    { name: "Hand Sanitizer (L)",       category: "supplies", reorderPoint: 6,   baseQty: 24  },
    { name: "Cleaning Solution (L)",    category: "supplies", reorderPoint: 4,   baseQty: 12  },
    { name: "Disinfectant Wipes",       category: "supplies", reorderPoint: 8,   baseQty: 30  },
    { name: "Microfiber Cloths",        category: "supplies", reorderPoint: 10,  baseQty: 40  },
    { name: "Reformer Springs – Light", category: "supplies", reorderPoint: 4,   baseQty: 12  },
    { name: "Reformer Springs – Heavy", category: "supplies", reorderPoint: 4,   baseQty: 12  },
    { name: "Reformer Box Pads",        category: "supplies", reorderPoint: 3,   baseQty: 8   },
    { name: "Foot Strap Velcro",        category: "supplies", reorderPoint: 5,   baseQty: 15  },
    { name: "Disposable Cups",          category: "supplies", reorderPoint: 50,  baseQty: 200 },
    { name: "Trash Bags (box)",         category: "supplies", reorderPoint: 3,   baseQty: 10  },
    { name: "Laundry Detergent (L)",    category: "supplies", reorderPoint: 2,   baseQty: 6   },
    { name: "Air Freshener",            category: "supplies", reorderPoint: 4,   baseQty: 12  },
    { name: "Latex Gloves (box)",       category: "supplies", reorderPoint: 3,   baseQty: 10  },
    { name: "Printer Paper (ream)",     category: "supplies", reorderPoint: 2,   baseQty: 8   },
  ];

  const inventoryData: object[] = [];
  openStudios.forEach((sd, si) => {
    const id = byName[sd.name];
    if (!id) return;
    const mDef = metricsByStudio.get(id);
    const salesMult = mDef?.type === "healthy" ? 1.0 : mDef?.type === "new" ? 0.6 : 0.45;

    INVENTORY_ITEMS.forEach((item, ii) => {
      let runningQty = Math.round(item.baseQty * salesMult * (0.8 + (si * ii % 5) * 0.08));

      for (let mo = 5; mo >= 0; mo--) {
        const month = monthStart(mo);
        const used  = Math.round(item.baseQty * salesMult * 0.6 * (0.85 + Math.random() * 0.3));
        const openingQty = runningQty;
        const received   = used > openingQty - item.reorderPoint
          ? Math.round(item.baseQty * 1.5)
          : 0;
        const actualUsed = Math.min(used, openingQty + received);
        const closingQty = Math.max(0, openingQty + received - actualUsed);
        runningQty = closingQty;

        inventoryData.push({
          studioId: id,
          month,
          name:         item.name,
          category:     item.category,
          openingQty,
          receivedQty:  received,
          usedQty:      actualUsed,
          closingQty,
          reorderPoint: item.reorderPoint,
        });
      }
    });
  });

  await db.inventoryItem.createMany({ data: inventoryData as any });

  // ── MAINTENANCE ITEMS ─────────────────────────────────────────────────────

  function daysAgoM(n: number): Date {
    const d = new Date("2026-06-30");
    d.setDate(d.getDate() - n);
    return d;
  }

  type MItem = {
    studioId: string; reportedAt: Date; category: string; equipment: string | null;
    description: string; priority: string; status: string; resolvedAt: Date | null; notes: string | null;
  };

  const maintenanceData: MItem[] = [];

  function addIssues(studioName: string, items: Omit<MItem, "studioId">[]) {
    const id = byName[studioName];
    if (!id) return;
    items.forEach(item => maintenanceData.push({ ...item, studioId: id }));
  }

  // Sunset Harbour — high traffic flagship, a few stacking issues
  addIssues("Sunset Harbour", [
    { reportedAt: daysAgoM(3), category: "reformer", equipment: "Reformer #7",       description: "Loud squeaking during carriage extension, audible across the room. Disrupting class flow.", priority: "urgent", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(6), category: "straps",   equipment: "Reformer #3",       description: "Black strap on left side is approximately 2 inches shorter than right. Clients flagging asymmetry during footwork.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(9), category: "sound",    equipment: "Bluetooth Speaker", description: "Dropout for ~30 seconds during evening classes before reconnecting. Happened 4 nights in a row.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(14), category: "reformer", equipment: "Reformer #12",     description: "Carriage alignment slightly off-center. Pulls right on return.", priority: "low",    status: "resolved", resolvedAt: daysAgoM(8),  notes: "Realigned and tightened rail bolts." },
  ]);

  // Edgewater — healthy but a couple open items
  addIssues("Edgewater", [
    { reportedAt: daysAgoM(5), category: "mirror",   equipment: "Mirror – East Wall", description: "Hairline crack in bottom-right corner, approximately 8 inches long. No safety risk yet but needs monitoring.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(2), category: "springs",  equipment: "Reformer #11",       description: "Heavy spring resistance feels noticeably lighter than other units — possible spring fatigue or incorrect installation.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(18), category: "facility", equipment: "Bathroom – Studio A", description: "Cold water tap running slow, low pressure.", priority: "low", status: "resolved", resolvedAt: daysAgoM(10), notes: "Plumber unclogged aerator." },
  ]);

  // Montclair — at-risk studio, maintenance stacking up
  addIssues("Montclair", [
    { reportedAt: daysAgoM(1),  category: "reformer", equipment: "Reformer #4",  description: "Squeaking loudly on every extension. Members have complained in two back-to-back classes.", priority: "urgent", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(4),  category: "reformer", equipment: "Reformer #9",  description: "Footbar wobbles when loaded. Screws appear stripped.", priority: "urgent", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(7),  category: "straps",   equipment: "Reformer #2",  description: "Both black straps fraying near the buckle. Needs replacement before next class.", priority: "urgent", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(10), category: "sound",    equipment: "Sound System", description: "Music cutting out mid-class intermittently. Possibly aux cable issue or amp overheating.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(12), category: "facility", equipment: "HVAC",         description: "Studio temperature inconsistent — hot near reformers 8–14, noticeably cooler near the door. Members commenting.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(20), category: "mirror",   equipment: "Mirror – West Wall", description: "Small chip bottom edge.", priority: "low", status: "resolved", resolvedAt: daysAgoM(14), notes: "Taped and flagged for replacement." },
  ]);

  // West Boca — flagship, well-maintained, minor items
  addIssues("West Boca", [
    { reportedAt: daysAgoM(4),  category: "reformer", equipment: "Reformer #6",  description: "Slight squeak on carriage return only. Not loud but noticeable in quiet portions of class.", priority: "low",    status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(21), category: "facility", equipment: "Front Door",   description: "Door closer mechanism slow — door takes 8+ seconds to close fully after entry.", priority: "low",    status: "resolved", resolvedAt: daysAgoM(11), notes: "Adjusted door closer tension." },
  ]);

  // West Palm Beach
  addIssues("West Palm Beach", [
    { reportedAt: daysAgoM(3),  category: "springs",  equipment: "Reformer #5",  description: "One light spring missing from unit. Only 3 of 4 light springs present.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(8),  category: "straps",   equipment: "Reformer #10", description: "Right long box strap has visible wear, stitching starting to come apart.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
  ]);

  // Wellington
  addIssues("Wellington", [
    { reportedAt: daysAgoM(5),  category: "reformer", equipment: "Reformer #1",  description: "Headrest doesn't lock in the up position — drops during class.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(16), category: "sound",    equipment: "TV Display",   description: "HDMI input stopped working. Display shows no signal.", priority: "low",    status: "resolved", resolvedAt: daysAgoM(9), notes: "HDMI cable replaced." },
  ]);

  // Palm Beach Gardens
  addIssues("Palm Beach Gardens", [
    { reportedAt: daysAgoM(2),  category: "reformer", equipment: "Reformer #13", description: "Wheel on carriage is cracked, causing slight drag on one side.", priority: "urgent", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(11), category: "facility", equipment: "Lighting – Studio", description: "Two overhead lights flickering near reformers 5 and 6.", priority: "low",    status: "open",     resolvedAt: null, notes: null },
  ]);

  // Delray Beach — new, minor issue
  addIssues("Delray Beach", [
    { reportedAt: daysAgoM(6),  category: "straps",   equipment: "Reformer #8",  description: "Black strap loop slightly loose on right side — needs tightening.", priority: "low",    status: "open",     resolvedAt: null, notes: null },
  ]);

  // Florham Park
  addIssues("Florham Park", [
    { reportedAt: daysAgoM(7),  category: "reformer", equipment: "Reformer #3",  description: "Squeaking on extension under heavy spring load. Only during 3–4 spring combinations.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
  ]);

  // Wayne
  addIssues("Wayne", [
    { reportedAt: daysAgoM(4),  category: "sound",    equipment: "Bluetooth Speaker", description: "Left speaker volume lower than right — imbalance noticeable from reformers 1–6.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
    { reportedAt: daysAgoM(9),  category: "reformer", equipment: "Reformer #14", description: "Rope pulley making grinding noise. Possible debris in track.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
  ]);

  // Somerville
  addIssues("Somerville", [
    { reportedAt: daysAgoM(5),  category: "facility", equipment: "Entry Keypad", description: "Staff keypad intermittently unresponsive in the morning — requires multiple attempts.", priority: "medium", status: "open",     resolvedAt: null, notes: null },
  ]);

  // Woodcliff Lake — new studio, one item
  addIssues("Woodcliff Lake", [
    { reportedAt: daysAgoM(3),  category: "straps",   equipment: "Reformer #2",  description: "Long box straps arrived with uneven length from factory. Left is 1.5\" shorter than right.", priority: "low",    status: "open",     resolvedAt: null, notes: "Flagged with equipment supplier for replacement pair." },
  ]);

  // West End Greenville — new, one item
  addIssues("West End Greenville", [
    { reportedAt: daysAgoM(8),  category: "reformer", equipment: "Reformer #6",  description: "Foot bar ratchet stiff — harder to adjust than other units. Clients with smaller feet have difficulty.", priority: "low",    status: "open",     resolvedAt: null, notes: null },
  ]);

  await db.maintenanceItem.createMany({ data: maintenanceData as any });

  const open = studioDefs.filter(s => s.status !== "pre-launch").length;
  const pre  = studioDefs.filter(s => s.status === "pre-launch").length;
  console.log(`✓ Seeded ${studioDefs.length} studios (${open} open · ${pre} pre-launch), ${allMetrics.length} weekly metrics, ${instrData.length} instructors, 5 anomalies, ${reviewData.length} reviews, ${classMetricData.length} class metrics, ${operationsData.length} operations, ${salesData.length} sales records, ${inventoryData.length} inventory items, ${maintenanceData.length} maintenance items`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
