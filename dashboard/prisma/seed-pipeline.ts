import "dotenv/config";
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const raw = process.env.DATABASE_URL ?? "file:./dev.db";
const filePath = raw.startsWith("file:") ? raw.slice(5) : raw;
const resolved = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
const adapter = new PrismaBetterSqlite3({ url: resolved });
const db = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  const d = new Date("2026-06-08");
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date("2026-06-08");
  d.setDate(d.getDate() + n);
  return d;
}

const STAGES = ["Discovery", "Agreement Signed", "Site Selected", "Permits & Construction", "Pre-Sales", "Launched"] as const;
type Stage = (typeof STAGES)[number];

const STAFF = ["Priya Sharma", "Marcus Chen", "Priya Sharma", "Marcus Chen", "Priya Sharma"];

interface LeadDef {
  franchiseeName: string;
  market: string;
  state: string;
  stage: Stage;
  daysInStage: number;
  expectedOpenDate: Date;
  territoryType: "urban" | "suburban";
  notes?: string;
  docsComplete: boolean;
  leaseComplete: boolean;
  trainingBooked: boolean;
}

const leads: LeadDef[] = [
  // Discovery (3) — early conversations on next wave of territories
  { franchiseeName: "Premier Holdings", market: "Jupiter",           state: "FL", stage: "Discovery",              daysInStage: 6,  expectedOpenDate: daysFromNow(490), territoryType: "suburban", docsComplete: false, leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Premier Holdings", market: "Hoboken",           state: "NJ", stage: "Discovery",              daysInStage: 14, expectedOpenDate: daysFromNow(510), territoryType: "urban",    notes: "High foot traffic corridor — evaluating two potential sites", docsComplete: false, leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Premier Holdings", market: "Raleigh",           state: "NC", stage: "Discovery",              daysInStage: 9,  expectedOpenDate: daysFromNow(500), territoryType: "suburban", docsComplete: false, leaseComplete: false, trainingBooked: false },

  // Agreement Signed (3) — territories committed, site search underway
  { franchiseeName: "Premier Holdings", market: "Parsippany",        state: "NJ", stage: "Agreement Signed",       daysInStage: 11, expectedOpenDate: daysFromNow(380), territoryType: "suburban", docsComplete: true,  leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Premier Holdings", market: "Brentwood",         state: "TN", stage: "Agreement Signed",       daysInStage: 31, expectedOpenDate: daysFromNow(360), territoryType: "suburban", notes: "Stalling — awaiting final site approval from HQ", docsComplete: false, leaseComplete: false, trainingBooked: false },

  // Site Selected (3) — location locked, pre-construction phase
  { franchiseeName: "Premier Holdings", market: "Red Bank",          state: "NJ", stage: "Site Selected",          daysInStage: 8,  expectedOpenDate: daysFromNow(295), territoryType: "urban",    docsComplete: true,  leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Premier Holdings", market: "Charlotte",         state: "NC", stage: "Site Selected",          daysInStage: 17, expectedOpenDate: daysFromNow(310), territoryType: "urban",    notes: "South End district — ideal demographics, strong comp set nearby", docsComplete: true,  leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Premier Holdings", market: "Fort Lauderdale",   state: "FL", stage: "Site Selected",          daysInStage: 12, expectedOpenDate: daysFromNow(280), territoryType: "urban",    docsComplete: true,  leaseComplete: false, trainingBooked: false },

  // Permits & Construction (2) — buildout in progress
  { franchiseeName: "Premier Holdings", market: "Summit",            state: "NJ", stage: "Permits & Construction", daysInStage: 41, expectedOpenDate: daysFromNow(170), territoryType: "suburban", docsComplete: true,  leaseComplete: true,  trainingBooked: false },
  { franchiseeName: "Premier Holdings", market: "Sarasota",          state: "FL", stage: "Permits & Construction", daysInStage: 26, expectedOpenDate: daysFromNow(145), territoryType: "suburban", notes: "Permit delay — county review extended 2 weeks", docsComplete: true,  leaseComplete: true,  trainingBooked: false },

  // Pre-Sales (2) — training booked, memberships selling, imminent launch
  { franchiseeName: "Premier Holdings", market: "Midtown Nashville", state: "TN", stage: "Pre-Sales",              daysInStage: 32, expectedOpenDate: daysFromNow(38),  territoryType: "urban",    notes: "Presales at 118 members — on track for strong launch week", docsComplete: true,  leaseComplete: true,  trainingBooked: true  },
  { franchiseeName: "Premier Holdings", market: "Short Hills",       state: "NJ", stage: "Pre-Sales",              daysInStage: 19, expectedOpenDate: daysFromNow(55),  territoryType: "suburban", notes: "Presales at 94 members — referral pipeline healthy", docsComplete: true,  leaseComplete: true,  trainingBooked: true  },
];

async function main() {
  await db.franchiseLead.deleteMany();

  const data = leads.map((l, i) => ({
    franchiseeName: l.franchiseeName,
    market:         l.market,
    state:          l.state,
    stage:          l.stage,
    stageEnteredAt: daysAgo(l.daysInStage),
    expectedOpenDate: l.expectedOpenDate,
    territoryType:  l.territoryType,
    notes:          l.notes ?? null,
    docsComplete:   l.docsComplete,
    leaseComplete:  l.leaseComplete,
    trainingBooked: l.trainingBooked,
    assignedTo:     STAFF[i % STAFF.length],
  }));

  await db.franchiseLead.createMany({ data });
  console.log(`✓ Seeded ${data.length} expansion pipeline leads`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
