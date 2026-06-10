import type { StudioMember } from "@/types/members";

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

const FIRST = [
  "Sarah","Jessica","Amanda","Lauren","Stephanie","Nicole","Ashley","Megan",
  "Rebecca","Jennifer","Emily","Olivia","Ava","Sophia","Charlotte","Amelia",
  "Kate","Rachel","Brittany","Natalie","Priya","Diana","Michelle","Camille",
  "Taylor","Morgan","Jordan","Riley","Brooke","Peyton","Hannah","Alexis",
  "Brittney","Chloe","Danielle","Elena","Fiona","Grace","Harper","Isabel",
  "Julia","Kayla","Leah","Maya","Nadia","Paige","Quinn","Samantha","Tara",
];
const LAST = [
  "Johnson","Williams","Brown","Jones","Garcia","Martinez","Wilson","Anderson",
  "Taylor","Thomas","Moore","Martin","Jackson","Lee","Harris","Clark","Lewis",
  "Robinson","Walker","Hall","Young","Allen","King","Wright","Scott","Torres",
  "Nguyen","Hill","Flores","Green","Adams","Baker","Campbell","Davis","Evans",
  "Foster","Gray","Hughes","Irwin","James","Knight","Lopez","Murray","Nash",
];

type Tier = "unlimited" | "12-class monthly" | "8-class monthly" | "4-class monthly";
const TIERS: Tier[] = ["unlimited", "12-class monthly", "8-class monthly", "4-class monthly"];
const TIER_VALUE: Record<Tier, number> = {
  unlimited: 185,
  "12-class monthly": 145,
  "8-class monthly": 95,
  "4-class monthly": 65,
};

export interface GenerateMembersParams {
  studioId: string;
  memberCount: number;
  weeklyChurnRate: number;
}

export function generateStudioMembers({
  studioId,
  memberCount,
  weeklyChurnRate,
}: GenerateMembersParams): StudioMember[] {
  const rand = prng(hashStr(studioId + "_members"));
  const pick  = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  const cancelledCount = Math.max(1, Math.round(weeklyChurnRate * memberCount * 4));
  const members: StudioMember[] = [];
  let idx = 0;

  // Cancelled this month
  for (let i = 0; i < cancelledCount; i++) {
    const tier = pick(TIERS);
    const mv   = TIER_VALUE[tier] + Math.round((rand() - 0.5) * 20);
    members.push({
      id: `mbr_${studioId.slice(-5)}_${String(++idx).padStart(4, "0")}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      membershipTier: tier,
      membershipAgeDays: Math.round(60 + rand() * 900),
      status: "cancelled",
      cancelledDaysAgo: Math.max(1, Math.round(rand() * 29)),
      daysSinceLastVisit: Math.round(10 + rand() * 30),
      visitsLast30d: Math.floor(rand() * 3),
      monthlyValue: mv,
    });
  }

  // Active members
  for (let i = 0; i < memberCount; i++) {
    const tier = pick(TIERS);
    const mv   = TIER_VALUE[tier] + Math.round((rand() - 0.5) * 20);
    members.push({
      id: `mbr_${studioId.slice(-5)}_${String(++idx).padStart(4, "0")}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      membershipTier: tier,
      membershipAgeDays: Math.round(30 + rand() * 1200),
      status: "active",
      daysSinceLastVisit: Math.max(1, Math.round(clamp(rand() * rand() * 20, 0, 30))),
      visitsLast30d: Math.round(clamp(2 + rand() * 10, 1, 16)),
      monthlyValue: mv,
    });
  }

  return members;
}
