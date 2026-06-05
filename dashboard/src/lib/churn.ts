import type { ChurnPredictions, ChurnMember } from "@/types/churn";

// ── Seeded PRNG (deterministic per studio) ─────────────────────────────────────

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return Math.abs(h >>> 0);
}

function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = ((s * 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ── Content pools ──────────────────────────────────────────────────────────────

const FIRST = [
  "Sarah","Jessica","Amanda","Lauren","Stephanie","Nicole","Ashley","Megan",
  "Rebecca","Jennifer","Emily","Olivia","Ava","Sophia","Charlotte","Amelia",
  "Kate","Rachel","Brittany","Natalie","Priya","Diana","Michelle","Camille",
  "Taylor","Morgan","Jordan","Riley","Brooke","Peyton",
];
const LAST = [
  "Johnson","Williams","Brown","Jones","Garcia","Martinez","Wilson","Anderson",
  "Taylor","Thomas","Moore","Martin","Jackson","Lee","Harris","Clark","Lewis",
  "Robinson","Walker","Hall","Young","Allen","King","Wright","Scott","Torres",
  "Nguyen","Hill","Flores","Green",
];

type Tier = "unlimited" | "12-class monthly" | "8-class monthly" | "4-class monthly";
const TIERS: Tier[] = ["unlimited","12-class monthly","8-class monthly","4-class monthly"];
const TIER_VALUE: Record<Tier, number> = { unlimited: 185, "12-class monthly": 145, "8-class monthly": 95, "4-class monthly": 65 };

const HIGH_FACTORS = [
  ["No visits in 30+ days","Monthly frequency down sharply","Multiple no-shows recorded"],
  ["46-day absence from studio","Visits dropped from 6/month to 0","100% no-show rate this month"],
  ["Membership renewal approaching","Long absence streak","Booking activity stopped"],
  ["Last-minute cancellations increasing","Weekly cadence broken for 5+ weeks","Engagement metrics at lowest point"],
  ["30+ day lapse in attendance","Visited only once in past 45 days","Classpass usage replacing membership"],
];
const HIGH_ACTIONS = [
  "Immediate personal outreach — call from studio lead with a complimentary drop-in offer",
  "Send personalized win-back text within 48 hours, offer a free class before renewal",
  "Have their favorite instructor reach out directly with a come-back incentive",
  "Offer a 1-week pause on their membership to buy time; follow up with a check-in call",
  "Trigger an automated re-engagement sequence with a limited-time comeback discount",
];

const MED_FACTORS = [
  ["Visit frequency declining","Booking fewer peak-time classes","Occasional no-shows increasing"],
  ["Visits down 30% vs last month","Starting to use ClassPass in the area","Engagement dropping week-over-week"],
  ["Skipping usual weekly sessions","Pattern shift from regular to sporadic","No-show rate ticking up"],
  ["Reduced morning session attendance","Booking window getting shorter","Less engagement with studio app"],
];
const MED_ACTIONS = [
  "Send a personalized check-in from the GM and offer a buddy pass to re-energize commitment",
  "Share a tailored class recommendation and highlight upcoming special events at the studio",
  "Enroll in a 30-day challenge program to restore habit and deepen community connection",
  "Offer a flexible class-pack top-up at a loyalty discount to extend their engagement window",
];

const LOW_FACTORS = [
  ["Slight dip in visits this month","Attendance still consistent overall","Minor schedule changes noted"],
  ["One missed class this period","Active and engaged with bookings","Low no-show history"],
  ["Booking frequency slightly down","Healthy overall visit pattern","No significant red flags"],
];
const LOW_ACTIONS = [
  "Monitor attendance trend — offer a class recommendation for a new format they haven't tried",
  "Celebrate their milestone with a loyalty perk to strengthen long-term commitment",
  "No action required — member is in good standing; maintain standard engagement touchpoints",
];

// ── Generator ──────────────────────────────────────────────────────────────────

export interface GenerateChurnParams {
  studioId: string;
  studioName: string;
  studioCity: string;
  studioStatus: string;
  memberCount: number;
  weeklyChurnRate: number;
}

export function generateStudioChurn({
  studioId,
  studioName,
  studioCity,
  studioStatus,
  memberCount,
  weeklyChurnRate,
}: GenerateChurnParams): ChurnPredictions {
  const rand = prng(hashStr(studioId));

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  // Risk distribution scales with actual churn rate and studio status
  const baseHigh = studioStatus === "at-risk" ? 0.22 : studioStatus === "new" ? 0.12 : 0.07;
  const baseMed  = studioStatus === "at-risk" ? 0.32 : 0.22;
  const highPct  = clamp(baseHigh + weeklyChurnRate * 4, 0.04, 0.35);
  const medPct   = clamp(baseMed,                        0.12, 0.42);

  const highCount = Math.max(1, Math.round(memberCount * highPct));
  const medCount  = Math.round(memberCount * medPct);
  const lowCount  = Math.max(0, memberCount - highCount - medCount);

  const members: ChurnMember[] = [];
  let revenueAtRisk = 0;
  let idx = 0;

  function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
  function mkName() { return `${pick(FIRST)} ${pick(LAST)}`; }
  function mkId() { return `mbr_${studioId.slice(-5)}_${String(++idx).padStart(3, "0")}`; }

  // High risk members
  for (let i = 0; i < highCount; i++) {
    const tier = pick(TIERS);
    const mv   = TIER_VALUE[tier] + Math.round((rand() - 0.5) * 20);
    const cp   = clamp(0.70 + rand() * 0.30, 0.70, 1.0);
    const rs   = Math.round(cp * 100);
    const days = Math.round(20 + rand() * 45);
    revenueAtRisk += mv * 12 * cp;
    members.push({
      id: mkId(), name: mkName(),
      studioName, studioCity, studioStatus,
      membershipTier: tier,
      membershipAgeDays: Math.round(30 + rand() * 700),
      daysSinceLastVisit: days,
      visitsLast30d: Math.floor(rand() * 2),
      visitsPrev30d: 4 + Math.floor(rand() * 5),
      noShowRate: clamp(0.5 + rand() * 0.5, 0, 1),
      churnProbability: cp, riskScore: rs, riskLevel: "high",
      monthlyValue: mv,
      topFactors: pick(HIGH_FACTORS),
      suggestedAction: pick(HIGH_ACTIONS),
    });
  }

  // Medium risk members
  for (let i = 0; i < medCount; i++) {
    const tier = pick(TIERS);
    const mv   = TIER_VALUE[tier] + Math.round((rand() - 0.5) * 20);
    const cp   = clamp(0.35 + rand() * 0.35, 0.35, 0.70);
    const rs   = Math.round(cp * 100);
    const days = Math.round(8 + rand() * 18);
    revenueAtRisk += mv * 12 * cp * 0.5;
    members.push({
      id: mkId(), name: mkName(),
      studioName, studioCity, studioStatus,
      membershipTier: tier,
      membershipAgeDays: Math.round(60 + rand() * 600),
      daysSinceLastVisit: days,
      visitsLast30d: 2 + Math.floor(rand() * 4),
      visitsPrev30d: 5 + Math.floor(rand() * 4),
      noShowRate: clamp(0.15 + rand() * 0.35, 0, 1),
      churnProbability: cp, riskScore: rs, riskLevel: "medium",
      monthlyValue: mv,
      topFactors: pick(MED_FACTORS),
      suggestedAction: pick(MED_ACTIONS),
    });
  }

  // Low risk members
  for (let i = 0; i < lowCount; i++) {
    const tier = pick(TIERS);
    const mv   = TIER_VALUE[tier] + Math.round((rand() - 0.5) * 20);
    const cp   = clamp(0.05 + rand() * 0.30, 0.05, 0.35);
    const rs   = Math.round(cp * 100);
    members.push({
      id: mkId(), name: mkName(),
      studioName, studioCity, studioStatus,
      membershipTier: tier,
      membershipAgeDays: Math.round(90 + rand() * 900),
      daysSinceLastVisit: Math.round(1 + rand() * 12),
      visitsLast30d: 5 + Math.floor(rand() * 7),
      visitsPrev30d: 5 + Math.floor(rand() * 5),
      noShowRate: clamp(rand() * 0.15, 0, 1),
      churnProbability: cp, riskScore: rs, riskLevel: "low",
      monthlyValue: mv,
      topFactors: pick(LOW_FACTORS),
      suggestedAction: pick(LOW_ACTIONS),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    modelAUC: 0.977,
    summary: {
      totalAnalyzed: memberCount,
      highRisk: highCount,
      mediumRisk: medCount,
      lowRisk: lowCount,
      revenueAtRisk: Math.round(revenueAtRisk),
    },
    members: members.sort((a, b) => b.churnProbability - a.churnProbability),
  };
}
