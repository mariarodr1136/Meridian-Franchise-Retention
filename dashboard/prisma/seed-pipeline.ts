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

const STAFF = ["Christa Dellebovi", "Uri Kenig", "Alex Lyons", "Christa Dellebovi", "Uri Kenig"];

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
  // Discovery (4)
  { franchiseeName: "Soleil Beaumont",    market: "Scottsdale",     state: "AZ", stage: "Discovery",               daysInStage: 3,  expectedOpenDate: daysFromNow(480), territoryType: "suburban", docsComplete: false, leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Rowan Caldera",      market: "Portland",       state: "OR", stage: "Discovery",               daysInStage: 9,  expectedOpenDate: daysFromNow(520), territoryType: "urban",    docsComplete: false, leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Isla Hartfield",     market: "Minneapolis",    state: "MN", stage: "Discovery",               daysInStage: 21, expectedOpenDate: daysFromNow(490), territoryType: "suburban", notes: "Referred by existing franchisee — strong fit", docsComplete: false, leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Tatum Ashmore",      market: "Kansas City",    state: "MO", stage: "Discovery",               daysInStage: 5,  expectedOpenDate: daysFromNow(500), territoryType: "suburban", docsComplete: false, leaseComplete: false, trainingBooked: false },

  // Agreement Signed (4)
  { franchiseeName: "Vera Langley",       market: "Boca Raton",     state: "FL", stage: "Agreement Signed",        daysInStage: 7,  expectedOpenDate: daysFromNow(390), territoryType: "suburban", docsComplete: true,  leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Quinn Fairfax",      market: "Hoboken",        state: "NJ", stage: "Agreement Signed",        daysInStage: 18, expectedOpenDate: daysFromNow(370), territoryType: "urban",    docsComplete: true,  leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Cleo Harrington",    market: "Tempe",          state: "AZ", stage: "Agreement Signed",        daysInStage: 4,  expectedOpenDate: daysFromNow(410), territoryType: "suburban", docsComplete: true,  leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Mila Coldwell",      market: "Richmond",       state: "VA", stage: "Agreement Signed",        daysInStage: 28, expectedOpenDate: daysFromNow(380), territoryType: "urban",    notes: "Stalling — awaiting co-investor decision", docsComplete: false, leaseComplete: false, trainingBooked: false },

  // Site Selected (3)
  { franchiseeName: "Sage Ellison",       market: "Plano",          state: "TX", stage: "Site Selected",           daysInStage: 11, expectedOpenDate: daysFromNow(290), territoryType: "suburban", docsComplete: true,  leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Nora Whitfield",     market: "Bethesda",       state: "MD", stage: "Site Selected",           daysInStage: 6,  expectedOpenDate: daysFromNow(310), territoryType: "urban",    docsComplete: true,  leaseComplete: false, trainingBooked: false },
  { franchiseeName: "Ember Caldwell",     market: "Chattanooga",    state: "TN", stage: "Site Selected",           daysInStage: 19, expectedOpenDate: daysFromNow(300), territoryType: "suburban", docsComplete: true,  leaseComplete: false, trainingBooked: false },

  // Permits & Construction (4)
  { franchiseeName: "Lyra Sinclair",      market: "Columbus",       state: "OH", stage: "Permits & Construction",  daysInStage: 42, expectedOpenDate: daysFromNow(180), territoryType: "urban",    docsComplete: true,  leaseComplete: true,  trainingBooked: false },
  { franchiseeName: "Fern Lockwood",      market: "Fort Worth",     state: "TX", stage: "Permits & Construction",  daysInStage: 30, expectedOpenDate: daysFromNow(160), territoryType: "suburban", docsComplete: true,  leaseComplete: true,  trainingBooked: false },
  { franchiseeName: "Demi Ashford",       market: "Stamford",       state: "CT", stage: "Permits & Construction",  daysInStage: 56, expectedOpenDate: daysFromNow(90),  territoryType: "urban",    notes: "Permit delay — city review extended 3 weeks", docsComplete: true,  leaseComplete: true,  trainingBooked: false },
  { franchiseeName: "Wren Hollister",     market: "Sarasota",       state: "FL", stage: "Permits & Construction",  daysInStage: 22, expectedOpenDate: daysFromNow(150), territoryType: "suburban", docsComplete: true,  leaseComplete: true,  trainingBooked: false },

  // Pre-Sales (3)
  { franchiseeName: "Aria Pemberton",     market: "Gilbert",        state: "AZ", stage: "Pre-Sales",               daysInStage: 25, expectedOpenDate: daysFromNow(65),  territoryType: "suburban", docsComplete: true,  leaseComplete: true,  trainingBooked: true  },
  { franchiseeName: "Piper Remington",    market: "Frisco",         state: "TX", stage: "Pre-Sales",               daysInStage: 18, expectedOpenDate: daysFromNow(50),  territoryType: "suburban", docsComplete: true,  leaseComplete: true,  trainingBooked: true  },
  { franchiseeName: "Zara Blackwell",     market: "Hoboken",        state: "NJ", stage: "Pre-Sales",               daysInStage: 35, expectedOpenDate: daysFromNow(30),  territoryType: "urban",    notes: "Presales at 89 members — strong pipeline", docsComplete: true,  leaseComplete: true,  trainingBooked: true  },
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
  console.log(`✓ Seeded ${data.length} franchise pipeline leads`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
