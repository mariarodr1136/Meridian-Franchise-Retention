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

const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "icloud.com", "outlook.com", "hotmail.com"];
const AREA_CODES    = ["305", "786", "954", "407", "561", "813", "727", "941", "321", "352"];

function formatPhone(rand: () => number): string {
  const area = AREA_CODES[Math.floor(rand() * AREA_CODES.length)];
  const mid  = String(Math.floor(rand() * 900) + 100);
  const end  = String(Math.floor(rand() * 9000) + 1000);
  return `(${area}) ${mid}-${end}`;
}

function joinedDateFromDaysAgo(days: number): string {
  const d = new Date("2026-06-10");
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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
    const tier      = pick(TIERS);
    const mv        = TIER_VALUE[tier] + Math.round((rand() - 0.5) * 20);
    const ageDays   = Math.round(60 + rand() * 900);
    const firstName = pick(FIRST);
    const lastName  = pick(LAST);
    const domain    = EMAIL_DOMAINS[Math.floor(rand() * EMAIL_DOMAINS.length)];
    members.push({
      id: `mbr_${studioId.slice(-5)}_${String(++idx).padStart(4, "0")}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(rand() * 99) + 1}@${domain}`,
      phone: formatPhone(rand),
      joinedDate: joinedDateFromDaysAgo(ageDays),
      membershipTier: tier,
      membershipAgeDays: ageDays,
      status: "cancelled",
      cancelledDaysAgo: Math.max(1, Math.round(rand() * 29)),
      daysSinceLastVisit: Math.round(10 + rand() * 30),
      visitsLast30d: Math.floor(rand() * 3),
      monthlyValue: mv,
    });
  }

  // Active members
  for (let i = 0; i < memberCount; i++) {
    const tier      = pick(TIERS);
    const mv        = TIER_VALUE[tier] + Math.round((rand() - 0.5) * 20);
    const ageDays   = Math.round(30 + rand() * 1200);
    const firstName = pick(FIRST);
    const lastName  = pick(LAST);
    const domain    = EMAIL_DOMAINS[Math.floor(rand() * EMAIL_DOMAINS.length)];
    members.push({
      id: `mbr_${studioId.slice(-5)}_${String(++idx).padStart(4, "0")}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(rand() * 99) + 1}@${domain}`,
      phone: formatPhone(rand),
      joinedDate: joinedDateFromDaysAgo(ageDays),
      membershipTier: tier,
      membershipAgeDays: ageDays,
      status: "active",
      daysSinceLastVisit: Math.max(1, Math.round(clamp(rand() * rand() * 20, 0, 30))),
      visitsLast30d: Math.round(clamp(2 + rand() * 10, 1, 16)),
      monthlyValue: mv,
    });
  }

  return members;
}
