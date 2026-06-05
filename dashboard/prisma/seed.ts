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

function healthyMetrics(studioId: string, base: { fill: number; members: number; revenue: number }) {
  return Array.from({ length: 8 }, (_, i) => ({
    studioId,
    weekOf: weeksAgo(i),
    classFillRate:     Math.max(0.55, base.fill    + (Math.random() - 0.45) * 0.08),
    activeMemberships: Math.max(80,   Math.round(base.members + (7 - i) * 4 + (Math.random() - 0.5) * 10)),
    weeklyChurn:       Math.max(0.005, 0.018 + (Math.random() - 0.5) * 0.008),
    weeklyRevenue:     Math.max(8000,  base.revenue + (7 - i) * 300 + (Math.random() - 0.5) * 800),
    presalesPipelineCount: 0,
  }));
}

function atRiskMetrics(studioId: string, base: { fill: number; members: number; revenue: number }) {
  return Array.from({ length: 8 }, (_, i) => ({
    studioId,
    weekOf: weeksAgo(i),
    classFillRate:     Math.max(0.30, base.fill    - i * 0.025 + (Math.random() - 0.5) * 0.04),
    activeMemberships: Math.max(60,   Math.round(base.members - i * 8 + (Math.random() - 0.5) * 6)),
    weeklyChurn:       Math.min(0.12,  0.065 + i * 0.004 + (Math.random() - 0.5) * 0.01),
    weeklyRevenue:     Math.max(5000,  base.revenue - i * 500 + (Math.random() - 0.5) * 600),
    presalesPipelineCount: 0,
  }));
}

function newStudioMetrics(studioId: string, base: { fill: number; members: number; revenue: number }) {
  return Array.from({ length: 8 }, (_, i) => ({
    studioId,
    weekOf: weeksAgo(i),
    classFillRate:     Math.max(0.20, base.fill - (7 - i) * 0.04 + (Math.random() - 0.5) * 0.05),
    activeMemberships: Math.max(20,   Math.round(base.members - (7 - i) * 12 + (Math.random() - 0.5) * 5)),
    weeklyChurn:       Math.max(0.01,  0.032 - (7 - i) * 0.003 + (Math.random() - 0.5) * 0.006),
    weeklyRevenue:     Math.max(2000,  base.revenue - (7 - i) * 700 + (Math.random() - 0.5) * 400),
    presalesPipelineCount: 0,
  }));
}

function preLaunchMetrics(studioId: string, presalesBase: number) {
  return Array.from({ length: 8 }, (_, i) => ({
    studioId,
    weekOf: weeksAgo(i),
    classFillRate: 0,
    activeMemberships: 0,
    weeklyChurn: 0,
    weeklyRevenue: 0,
    presalesPipelineCount: Math.max(0, presalesBase - i * 8 + Math.round((Math.random() - 0.3) * 6)),
  }));
}

const FRANCHISEES = [
  "Sofia Herrera", "Elena Vasquez", "Diana Reyes", "Natalie Brooks", "Camille Torres",
  "Jasmine Powell", "Claire Hoffman", "Rachel Kim", "Lauren Marsh", "Brittany Cole",
  "Amanda Tran", "Priya Nair", "Michelle Yuen", "Taylor Evans", "Jessica Park",
  "Andrea Santos", "Maria Lopez", "Stephanie Chen", "Ashley Johnson", "Melissa Rodriguez",
  "Kimberly Davis", "Patricia Wilson", "Jennifer Martinez", "Linda Anderson", "Barbara Thomas",
  "Elizabeth Jackson", "Susan White", "Catherine Harris", "Sarah Thompson", "Lisa Garcia",
  "Karen Lewis", "Nancy Walker", "Betty Hall", "Helen Allen", "Sandra Young",
  "Dorothy Hernandez", "Ruth King", "Sharon Wright", "Laura Scott", "Kathy Adams",
  "Mary Baker", "Margaret Nelson", "Lisa Carter", "Nancy Mitchell", "Betty Perez",
  "Joan Roberts", "Karen Turner", "Betty Phillips", "Helen Campbell", "Dorothy Parker",
  "Sandra Evans", "Joan Edwards", "Barbara Collins", "Helen Stewart", "Ruth Sanchez",
  "Sharon Morris", "Dorothy Rogers", "Betty Reed", "Joan Cook", "Karen Morgan",
  "Nancy Bell", "Mary Murphy", "Lisa Bailey", "Barbara Rivera", "Helen Cooper",
  "Dorothy Richardson", "Sandra Cox", "Joan Howard", "Barbara Ward", "Helen Torres",
  "Dorothy Peterson", "Sandra Gray", "Joan Ramirez", "Barbara James", "Helen Watson",
  "Dorothy Brooks", "Sandra Kelly", "Joan Sanders", "Barbara Price", "Helen Bennett",
  "Dorothy Wood", "Sandra Barnes", "Joan Ross", "Barbara Henderson", "Helen Coleman",
  "Dorothy Jenkins", "Sandra Perry", "Joan Powell", "Barbara Long", "Helen Patterson",
  "Dorothy Hughes", "Sandra Flores", "Joan Washington", "Barbara Butler", "Helen Simmons",
  "Dorothy Foster", "Sandra Gonzales", "Joan Bryant", "Barbara Alexander", "Helen Russell",
  "Dorothy Griffin", "Sandra Diaz", "Joan Hayes", "Barbara Myers", "Helen Ford",
  "Dorothy Hamilton", "Sandra Graham", "Joan Sullivan", "Barbara Wallace", "Helen Woods",
  "Dorothy Cole", "Sandra West", "Joan Jordan", "Barbara Owens", "Helen Reynolds",
  "Dorothy Fisher", "Sandra Ellis", "Joan Harrison", "Barbara Gibson", "Helen McDonald",
  "Dorothy Cruz", "Sandra Marshall", "Joan Ortiz", "Barbara Gomez", "Helen Murray",
  "Dorothy Freeman", "Sandra Wells", "Joan Webb", "Barbara Simpson", "Helen Stevens",
];

let fIdx = 0;
const f = () => FRANCHISEES[fIdx++ % FRANCHISEES.length];

type SD = {
  name: string; city: string; state: string | null; country: string;
  region: string; status: string; openedAt: Date | null;
};

async function main() {
  await db.anomaly.deleteMany();
  await db.instructor.deleteMany();
  await db.studioMetric.deleteMany();
  await db.studio.deleteMany();

  const studioDefs: SD[] = [
    // ── SOUTHEAST – Florida (27 open) ────────────────────────────────────────
    { name: "Aventura",                          city: "Aventura",           state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2022-11-01") },
    { name: "Brickell",                          city: "Miami",              state: "FL", country: "US", region: "Southeast",     status: "at-risk",    openedAt: new Date("2023-03-20") },
    { name: "Carrollwood",                       city: "Tampa",              state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2023-07-10") },
    { name: "Coconut Grove",                     city: "Coconut Grove",      state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2023-01-15") },
    { name: "Coral Springs",                     city: "Coral Springs",      state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2023-04-20") },
    { name: "Delray",                            city: "Delray Beach",       state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2023-08-15") },
    { name: "Downtown Miami",                    city: "Miami",              state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2022-09-10") },
    { name: "Downtown Tampa",                    city: "Tampa",              state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2023-10-20") },
    { name: "Dr. Phillips",                      city: "Orlando",            state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2023-12-05") },
    { name: "Edgewater",                         city: "Miami",              state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-02-14") },
    { name: "Estero – Coconut Point",            city: "Estero",             state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-04-10") },
    { name: "Fort Lauderdale – Flagler Village", city: "Fort Lauderdale",    state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-06-01") },
    { name: "Jacksonville – Gate Parkway",       city: "Jacksonville",       state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-01-22") },
    { name: "Jax Beach",                         city: "Jacksonville Beach", state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-03-18") },
    { name: "JETSET Miami",                      city: "Miami Beach",        state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2022-06-01") },
    { name: "Merrick Park",                      city: "Coral Gables",       state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2022-08-15") },
    { name: "Midtown Doral",                     city: "Doral",              state: "FL", country: "US", region: "Southeast",     status: "at-risk",    openedAt: new Date("2024-07-20") },
    { name: "North Miami",                       city: "Miami",              state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-05-15") },
    { name: "Oviedo",                            city: "Oviedo",             state: "FL", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-03-10") },
    { name: "Palm Beach Gardens",                city: "Palm Beach Gardens", state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-08-20") },
    { name: "South Tampa",                       city: "Tampa",              state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2023-05-12") },
    { name: "Sunset Harbour",                    city: "Miami Beach",        state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2022-10-01") },
    { name: "Wellington",                        city: "Wellington",         state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-09-15") },
    { name: "West Boca",                         city: "Boca Raton",         state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2023-11-08") },
    { name: "West Palm Beach",                   city: "West Palm Beach",    state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-02-28") },
    { name: "Weston",                            city: "Weston",             state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-11-15") },
    { name: "Winter Park",                       city: "Winter Park",        state: "FL", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-04-22") },
    // ── SOUTHEAST – Georgia (2 open) ─────────────────────────────────────────
    { name: "Alpharetta",                        city: "Alpharetta",         state: "GA", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-05-10") },
    { name: "Buckhead",                          city: "Atlanta",            state: "GA", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-04-14") },
    // ── SOUTHEAST – North Carolina (6 open) ──────────────────────────────────
    { name: "Charlotte – South End",             city: "Charlotte",          state: "NC", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-02-20") },
    { name: "Downtown Raleigh",                  city: "Raleigh",            state: "NC", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-06-15") },
    { name: "Holly Springs",                     city: "Holly Springs",      state: "NC", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-08-20") },
    { name: "Lake Norman",                       city: "Huntersville",       state: "NC", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-04-10") },
    { name: "Raleigh – North Hills",             city: "Raleigh",            state: "NC", country: "US", region: "Southeast",     status: "healthy",    openedAt: new Date("2024-10-15") },
    { name: "Research Triangle Park",            city: "Durham",             state: "NC", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-09-01") },
    // ── SOUTHEAST – South Carolina (1 open) ──────────────────────────────────
    { name: "West End Greenville",               city: "Greenville",         state: "SC", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-06-01") },
    // ── SOUTHEAST – Tennessee (1 open) ───────────────────────────────────────
    { name: "Midtown Nashville",                 city: "Nashville",          state: "TN", country: "US", region: "Southeast",     status: "new",        openedAt: new Date("2025-05-20") },
    // ── NORTHEAST – New York (6 open) ────────────────────────────────────────
    { name: "Boerum Hill",                       city: "Brooklyn",           state: "NY", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2024-05-20") },
    { name: "Chelsea",                           city: "New York",           state: "NY", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2023-09-15") },
    { name: "Gramercy",                          city: "New York",           state: "NY", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2024-01-10") },
    { name: "NoHo",                              city: "New York",           state: "NY", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2024-03-25") },
    { name: "Park Avenue",                       city: "New York",           state: "NY", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2023-07-08") },
    { name: "SoHo",                              city: "New York",           state: "NY", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2023-02-28") },
    // ── NORTHEAST – New Jersey (5 open) ──────────────────────────────────────
    { name: "Florham Park",                      city: "Florham Park",       state: "NJ", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2024-04-10") },
    { name: "Montclair",                         city: "Verona",             state: "NJ", country: "US", region: "Northeast",     status: "at-risk",    openedAt: new Date("2024-11-20") },
    { name: "Somerville",                        city: "Somerville",         state: "NJ", country: "US", region: "Northeast",     status: "new",        openedAt: new Date("2025-01-15") },
    { name: "Wayne",                             city: "Wayne",              state: "NJ", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2024-06-25") },
    { name: "Woodcliff Lake",                    city: "Woodcliff Lake",     state: "NJ", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2024-08-10") },
    // ── NORTHEAST – Connecticut (1 open) ─────────────────────────────────────
    { name: "Darien",                            city: "Darien",             state: "CT", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2024-06-15") },
    // ── NORTHEAST – Massachusetts (1 open) ───────────────────────────────────
    { name: "Wellesley",                         city: "Wellesley",          state: "MA", country: "US", region: "Northeast",     status: "new",        openedAt: new Date("2025-07-01") },
    // ── NORTHEAST – Pennsylvania (2 open) ────────────────────────────────────
    { name: "Graduate Hospital",                 city: "Philadelphia",       state: "PA", country: "US", region: "Northeast",     status: "at-risk",    openedAt: new Date("2024-11-10") },
    { name: "Main Line Haverford",               city: "Haverford",          state: "PA", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2025-01-20") },
    // ── NORTHEAST – Washington DC (1 open) ───────────────────────────────────
    { name: "Union Market",                      city: "Washington",         state: "DC", country: "US", region: "Northeast",     status: "healthy",    openedAt: new Date("2025-02-05") },
    // ── TEXAS (8 open) ───────────────────────────────────────────────────────
    { name: "Austin – Downtown",                 city: "Austin",             state: "TX", country: "US", region: "Texas",         status: "healthy",    openedAt: new Date("2024-03-01") },
    { name: "Austin – South",                    city: "Austin",             state: "TX", country: "US", region: "Texas",         status: "healthy",    openedAt: new Date("2024-07-15") },
    { name: "Bridgeland",                        city: "Cypress",            state: "TX", country: "US", region: "Texas",         status: "healthy",    openedAt: new Date("2024-09-10") },
    { name: "Heath",                             city: "Heath",              state: "TX", country: "US", region: "Texas",         status: "new",        openedAt: new Date("2025-03-25") },
    { name: "Houston – River Oaks",              city: "Houston",            state: "TX", country: "US", region: "Texas",         status: "healthy",    openedAt: new Date("2024-01-18") },
    { name: "League City",                       city: "League City",        state: "TX", country: "US", region: "Texas",         status: "healthy",    openedAt: new Date("2024-05-08") },
    { name: "Preston Hollow",                    city: "Dallas",             state: "TX", country: "US", region: "Texas",         status: "at-risk",    openedAt: new Date("2024-06-20") },
    { name: "West McKinney",                     city: "McKinney",           state: "TX", country: "US", region: "Texas",         status: "new",        openedAt: new Date("2025-01-10") },
    // ── CALIFORNIA (2 open) ──────────────────────────────────────────────────
    { name: "Irvine Crossroads",                 city: "Irvine",             state: "CA", country: "US", region: "California",    status: "healthy",    openedAt: new Date("2023-09-01") },
    { name: "Torrey Hills",                      city: "San Diego",          state: "CA", country: "US", region: "California",    status: "healthy",    openedAt: new Date("2024-03-15") },
    // ── MOUNTAIN WEST (3 open) ───────────────────────────────────────────────
    { name: "Denver – RiNo",                     city: "Denver",             state: "CO", country: "US", region: "Mountain West", status: "new",        openedAt: new Date("2025-08-01") },
    { name: "Sugar House",                       city: "Salt Lake City",     state: "UT", country: "US", region: "Mountain West", status: "at-risk",    openedAt: new Date("2024-10-15") },
    { name: "Albuquerque Uptown",                city: "Albuquerque",        state: "NM", country: "US", region: "Mountain West", status: "at-risk",    openedAt: new Date("2024-12-01") },
    // ── MIDWEST (3 open) ─────────────────────────────────────────────────────
    { name: "Edwardsville",                      city: "Edwardsville",       state: "IL", country: "US", region: "Midwest",       status: "at-risk",    openedAt: new Date("2024-10-01") },
    { name: "Northbrook",                        city: "Northbrook",         state: "IL", country: "US", region: "Midwest",       status: "healthy",    openedAt: new Date("2024-08-15") },
    { name: "Creve Coeur",                       city: "Creve Coeur",        state: "MO", country: "US", region: "Midwest",       status: "at-risk",    openedAt: new Date("2024-09-20") },

    // ── PRE-LAUNCH – California ───────────────────────────────────────────────
    { name: "Folsom Ranch",                      city: "Folsom",             state: "CA", country: "US", region: "California",    status: "pre-launch", openedAt: null },
    { name: "Liberty Station",                   city: "San Diego",          state: "CA", country: "US", region: "California",    status: "pre-launch", openedAt: null },
    { name: "Los Gatos",                         city: "Los Gatos",          state: "CA", country: "US", region: "California",    status: "pre-launch", openedAt: null },
    { name: "Marina District",                   city: "San Francisco",      state: "CA", country: "US", region: "California",    status: "pre-launch", openedAt: null },
    { name: "San Marcos",                        city: "San Marcos",         state: "CA", country: "US", region: "California",    status: "pre-launch", openedAt: null },
    { name: "Santa Clara Rivermark",             city: "Santa Clara",        state: "CA", country: "US", region: "California",    status: "pre-launch", openedAt: null },
    // ── PRE-LAUNCH – Mountain West ────────────────────────────────────────────
    { name: "Boulder Crossroads",                city: "Boulder",            state: "CO", country: "US", region: "Mountain West", status: "pre-launch", openedAt: null },
    { name: "Holladay",                          city: "Holladay",           state: "UT", country: "US", region: "Mountain West", status: "pre-launch", openedAt: null },
    { name: "South Lake Union",                  city: "Seattle",            state: "WA", country: "US", region: "Mountain West", status: "pre-launch", openedAt: null },
    // ── PRE-LAUNCH – Northeast ────────────────────────────────────────────────
    { name: "Westport",                          city: "Westport",           state: "CT", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "Belmont",                           city: "Belmont",            state: "MA", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "Marlton",                           city: "Marlton",            state: "NJ", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "Oakhurst",                          city: "Oakhurst",           state: "NJ", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "Parsippany",                        city: "Parsippany",         state: "NJ", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "Latham",                            city: "Latham",             state: "NY", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "Main Line Wayne",                   city: "Wayne",              state: "PA", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "Northern Liberties",                city: "Philadelphia",       state: "PA", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "Warrington",                        city: "Warrington",         state: "PA", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "Tysons",                            city: "Tysons",             state: "VA", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    { name: "14th Street",                       city: "Washington",         state: "DC", country: "US", region: "Northeast",     status: "pre-launch", openedAt: null },
    // ── PRE-LAUNCH – Southeast – Florida ─────────────────────────────────────
    { name: "Boynton Beach",                     city: "Boynton Beach",      state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Jacksonville – Pearl Square",       city: "Jacksonville",       state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Kendall",                           city: "Miami",              state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Lake Nona",                         city: "Orlando",            state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Lakewood Ranch",                    city: "Lakewood Ranch",     state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Naples",                            city: "Naples",             state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Oakland Park",                      city: "Fort Lauderdale",    state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Pembroke Pines",                    city: "Pembroke Pines",     state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Pinecrest",                         city: "Miami",              state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Port St. Lucie",                    city: "Port St. Lucie",     state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Tallahassee",                       city: "Tallahassee",        state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Viera",                             city: "Melbourne",          state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Westchase",                         city: "Tampa",              state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Winter Garden",                     city: "Winter Garden",      state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "World Golf Village",                city: "St. Augustine",      state: "FL", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    // ── PRE-LAUNCH – Southeast – Georgia ─────────────────────────────────────
    { name: "Buford",                            city: "Buford",             state: "GA", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Dunwoody",                          city: "Dunwoody",           state: "GA", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "East Cobb",                         city: "Marietta",           state: "GA", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    // ── PRE-LAUNCH – Southeast – Carolinas / TN ──────────────────────────────
    { name: "Durham",                            city: "Durham",             state: "NC", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Forest Acres",                      city: "Columbia",           state: "SC", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    { name: "Brentwood",                         city: "Brentwood",          state: "TN", country: "US", region: "Southeast",     status: "pre-launch", openedAt: null },
    // ── PRE-LAUNCH – Texas ────────────────────────────────────────────────────
    { name: "Austin – Arboretum",                city: "Austin",             state: "TX", country: "US", region: "Texas",         status: "pre-launch", openedAt: null },
    { name: "District West",                     city: "Richmond",           state: "TX", country: "US", region: "Texas",         status: "pre-launch", openedAt: null },
    { name: "Flower Mound",                      city: "Flower Mound",       state: "TX", country: "US", region: "Texas",         status: "pre-launch", openedAt: null },
    { name: "Friendswood",                       city: "Friendswood",        state: "TX", country: "US", region: "Texas",         status: "pre-launch", openedAt: null },
    { name: "GTX",                               city: "Georgetown",         state: "TX", country: "US", region: "Texas",         status: "pre-launch", openedAt: null },
    { name: "Sienna",                            city: "Missouri City",      state: "TX", country: "US", region: "Texas",         status: "pre-launch", openedAt: null },
    { name: "Sugar Land",                        city: "Sugar Land",         state: "TX", country: "US", region: "Texas",         status: "pre-launch", openedAt: null },
    { name: "Uptown Dallas",                     city: "Dallas",             state: "TX", country: "US", region: "Texas",         status: "pre-launch", openedAt: null },
    { name: "Vintage Park",                      city: "Houston",            state: "TX", country: "US", region: "Texas",         status: "pre-launch", openedAt: null },
    // ── PRE-LAUNCH – Midwest ──────────────────────────────────────────────────
    { name: "Gold Coast",                        city: "Chicago",            state: "IL", country: "US", region: "Midwest",       status: "pre-launch", openedAt: null },
    { name: "Lakeview",                          city: "Chicago",            state: "IL", country: "US", region: "Midwest",       status: "pre-launch", openedAt: null },
    { name: "Naperville",                        city: "Naperville",         state: "IL", country: "US", region: "Midwest",       status: "pre-launch", openedAt: null },
    { name: "Carmel",                            city: "Carmel",             state: "IN", country: "US", region: "Midwest",       status: "pre-launch", openedAt: null },
    { name: "Fishers",                           city: "Fishers",            state: "IN", country: "US", region: "Midwest",       status: "pre-launch", openedAt: null },
    { name: "West Des Moines",                   city: "West Des Moines",    state: "IA", country: "US", region: "Midwest",       status: "pre-launch", openedAt: null },
    { name: "Overland Park",                     city: "Overland Park",      state: "KS", country: "US", region: "Midwest",       status: "pre-launch", openedAt: null },
    { name: "Des Peres",                         city: "Des Peres",          state: "MO", country: "US", region: "Midwest",       status: "pre-launch", openedAt: null },
  ];

  const created = await Promise.all(
    studioDefs.map(sd => db.studio.create({
      data: { name: sd.name, city: sd.city, state: sd.state, country: sd.country, region: sd.region, status: sd.status, openedAt: sd.openedAt, franchiseeName: f() },
    }))
  );

  const byName: Record<string, string> = {};
  created.forEach((s, i) => { byName[studioDefs[i].name] = s.id; });

  // ── METRICS ───────────────────────────────────────────────────────────────

  type MetricDef = { name: string; type: "healthy" | "at-risk" | "new"; base: { fill: number; members: number; revenue: number } };

  const metricDefs: MetricDef[] = [
    // Southeast – Florida
    { name: "Aventura",                          type: "healthy",  base: { fill: 0.79, members: 268, revenue: 24100 } },
    { name: "Brickell",                          type: "at-risk",  base: { fill: 0.51, members: 142, revenue: 11200 } },
    { name: "Carrollwood",                       type: "healthy",  base: { fill: 0.72, members: 215, revenue: 19300 } },
    { name: "Coconut Grove",                     type: "healthy",  base: { fill: 0.77, members: 241, revenue: 21600 } },
    { name: "Coral Springs",                     type: "healthy",  base: { fill: 0.74, members: 228, revenue: 20400 } },
    { name: "Delray",                            type: "healthy",  base: { fill: 0.76, members: 243, revenue: 21800 } },
    { name: "Downtown Miami",                    type: "healthy",  base: { fill: 0.84, members: 312, revenue: 27900 } },
    { name: "Downtown Tampa",                    type: "healthy",  base: { fill: 0.71, members: 198, revenue: 17700 } },
    { name: "Dr. Phillips",                      type: "healthy",  base: { fill: 0.73, members: 219, revenue: 19600 } },
    { name: "Edgewater",                         type: "healthy",  base: { fill: 0.76, members: 231, revenue: 20700 } },
    { name: "Estero – Coconut Point",            type: "healthy",  base: { fill: 0.70, members: 194, revenue: 17400 } },
    { name: "Fort Lauderdale – Flagler Village", type: "healthy",  base: { fill: 0.69, members: 187, revenue: 16800 } },
    { name: "Jacksonville – Gate Parkway",       type: "healthy",  base: { fill: 0.68, members: 182, revenue: 16300 } },
    { name: "Jax Beach",                         type: "healthy",  base: { fill: 0.71, members: 196, revenue: 17600 } },
    { name: "JETSET Miami",                      type: "healthy",  base: { fill: 0.88, members: 358, revenue: 32100 } },
    { name: "Merrick Park",                      type: "healthy",  base: { fill: 0.82, members: 286, revenue: 25700 } },
    { name: "Midtown Doral",                     type: "at-risk",  base: { fill: 0.49, members: 128, revenue: 11500 } },
    { name: "North Miami",                       type: "healthy",  base: { fill: 0.72, members: 206, revenue: 18400 } },
    { name: "Oviedo",                            type: "new",      base: { fill: 0.56, members: 118, revenue: 10600 } },
    { name: "Palm Beach Gardens",                type: "healthy",  base: { fill: 0.74, members: 222, revenue: 19900 } },
    { name: "South Tampa",                       type: "healthy",  base: { fill: 0.75, members: 234, revenue: 20900 } },
    { name: "Sunset Harbour",                    type: "healthy",  base: { fill: 0.83, members: 294, revenue: 26300 } },
    { name: "Wellington",                        type: "healthy",  base: { fill: 0.69, members: 186, revenue: 16700 } },
    { name: "West Boca",                         type: "healthy",  base: { fill: 0.77, members: 246, revenue: 22000 } },
    { name: "West Palm Beach",                   type: "healthy",  base: { fill: 0.73, members: 214, revenue: 19200 } },
    { name: "Weston",                            type: "healthy",  base: { fill: 0.71, members: 197, revenue: 17700 } },
    { name: "Winter Park",                       type: "healthy",  base: { fill: 0.74, members: 221, revenue: 19800 } },
    // Southeast – Georgia
    { name: "Alpharetta",                        type: "new",      base: { fill: 0.53, members: 101, revenue: 9100  } },
    { name: "Buckhead",                          type: "new",      base: { fill: 0.61, members: 127, revenue: 11400 } },
    // Southeast – NC
    { name: "Charlotte – South End",             type: "new",      base: { fill: 0.59, members: 113, revenue: 10100 } },
    { name: "Downtown Raleigh",                  type: "new",      base: { fill: 0.54, members:  98, revenue:  8800 } },
    { name: "Holly Springs",                     type: "new",      base: { fill: 0.48, members:  82, revenue:  7400 } },
    { name: "Lake Norman",                       type: "new",      base: { fill: 0.57, members: 107, revenue:  9600 } },
    { name: "Raleigh – North Hills",             type: "healthy",  base: { fill: 0.67, members: 174, revenue: 15600 } },
    { name: "Research Triangle Park",            type: "new",      base: { fill: 0.45, members:  74, revenue:  6600 } },
    // Southeast – SC / TN
    { name: "West End Greenville",               type: "new",      base: { fill: 0.52, members:  96, revenue:  8600 } },
    { name: "Midtown Nashville",                 type: "new",      base: { fill: 0.55, members: 104, revenue:  9300 } },
    // Northeast – NY
    { name: "Boerum Hill",                       type: "healthy",  base: { fill: 0.78, members: 252, revenue: 22600 } },
    { name: "Chelsea",                           type: "healthy",  base: { fill: 0.86, members: 334, revenue: 29900 } },
    { name: "Gramercy",                          type: "healthy",  base: { fill: 0.82, members: 288, revenue: 25800 } },
    { name: "NoHo",                              type: "healthy",  base: { fill: 0.83, members: 298, revenue: 26700 } },
    { name: "Park Avenue",                       type: "healthy",  base: { fill: 0.87, members: 342, revenue: 30700 } },
    { name: "SoHo",                              type: "healthy",  base: { fill: 0.85, members: 322, revenue: 28900 } },
    // Northeast – NJ / CT / MA / PA / DC
    { name: "Florham Park",                      type: "healthy",  base: { fill: 0.71, members: 196, revenue: 17600 } },
    { name: "Montclair",                         type: "at-risk",  base: { fill: 0.47, members: 124, revenue: 11100 } },
    { name: "Somerville",                        type: "new",      base: { fill: 0.58, members: 111, revenue:  9900 } },
    { name: "Wayne",                             type: "healthy",  base: { fill: 0.70, members: 192, revenue: 17200 } },
    { name: "Woodcliff Lake",                    type: "healthy",  base: { fill: 0.72, members: 204, revenue: 18300 } },
    { name: "Darien",                            type: "healthy",  base: { fill: 0.73, members: 216, revenue: 19400 } },
    { name: "Wellesley",                         type: "new",      base: { fill: 0.55, members: 102, revenue:  9200 } },
    { name: "Graduate Hospital",                 type: "at-risk",  base: { fill: 0.46, members: 119, revenue: 10700 } },
    { name: "Main Line Haverford",               type: "healthy",  base: { fill: 0.64, members: 158, revenue: 14200 } },
    { name: "Union Market",                      type: "healthy",  base: { fill: 0.66, members: 168, revenue: 15100 } },
    // Texas
    { name: "Austin – Downtown",                 type: "healthy",  base: { fill: 0.78, members: 248, revenue: 22200 } },
    { name: "Austin – South",                    type: "healthy",  base: { fill: 0.74, members: 223, revenue: 20000 } },
    { name: "Bridgeland",                        type: "healthy",  base: { fill: 0.72, members: 208, revenue: 18700 } },
    { name: "Heath",                             type: "new",      base: { fill: 0.54, members:  99, revenue:  8900 } },
    { name: "Houston – River Oaks",              type: "healthy",  base: { fill: 0.76, members: 238, revenue: 21300 } },
    { name: "League City",                       type: "healthy",  base: { fill: 0.70, members: 191, revenue: 17100 } },
    { name: "Preston Hollow",                    type: "at-risk",  base: { fill: 0.49, members: 136, revenue: 12200 } },
    { name: "West McKinney",                     type: "new",      base: { fill: 0.57, members: 108, revenue:  9700 } },
    // California
    { name: "Irvine Crossroads",                 type: "healthy",  base: { fill: 0.77, members: 243, revenue: 21800 } },
    { name: "Torrey Hills",                      type: "healthy",  base: { fill: 0.74, members: 221, revenue: 19800 } },
    // Mountain West
    { name: "Denver – RiNo",                     type: "new",      base: { fill: 0.51, members:  89, revenue:  8000 } },
    { name: "Sugar House",                       type: "at-risk",  base: { fill: 0.44, members: 108, revenue:  9700 } },
    { name: "Albuquerque Uptown",                type: "at-risk",  base: { fill: 0.42, members:  98, revenue:  8800 } },
    // Midwest
    { name: "Edwardsville",                      type: "at-risk",  base: { fill: 0.43, members: 104, revenue:  9300 } },
    { name: "Northbrook",                        type: "healthy",  base: { fill: 0.68, members: 179, revenue: 16100 } },
    { name: "Creve Coeur",                       type: "at-risk",  base: { fill: 0.45, members: 111, revenue:  9900 } },
  ];

  const preLaunchPresales: Record<string, number> = {
    "Santa Clara Rivermark": 142, "Pembroke Pines": 128, "Pinecrest": 118,
    "Tallahassee": 94, "Des Peres": 107, "Flower Mound": 134,
    "Sienna": 121, "Brentwood": 98, "Northern Liberties": 112,
    "Latham": 86, "Durham": 103, "Tysons": 119, "Gold Coast": 138,
    "Lakeview": 127, "Marina District": 144, "Uptown Dallas": 131,
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
    "Victoria Reyes", "Catherine Brooks", "Natalie Hoffman", "Lauren Pierce",
    "Amanda Clarke", "Stephanie Marsh", "Jennifer Walsh", "Michelle Torres",
    "Elizabeth Santos", "Sarah Coleman", "Jessica Rivera", "Melissa Grant",
    "Patricia Chen", "Diana Foster", "Andrea King", "Camille Roberts",
    "Sofia Delgado", "Rachel Burns", "Lindsay Park", "Brittany Hayes",
    "Courtney Bell", "Tiffany Stone", "Whitney Adams", "Vanessa Cruz",
  ];
  const gmPool = [
    "Daniela Cruz", "Isabelle Moreau", "Valentina Ruiz", "Kayla Bennett",
    "Ana Lima", "Bridget Walsh", "Carmen Diaz", "Sydney Parker",
    "Morgan Lee", "Jade Rivera", "Keisha Monroe", "Charlotte Hill",
    "Olivia Ross", "Grace Turner", "Sophia Wright", "Emma Collins",
    "Hannah Price", "Alexis Hayes", "Stella Murphy", "Luna Castillo",
    "Zoey Mitchell", "Harper Young", "Brynn Walsh", "Natasha Rivera",
    "Camille Dubois", "Jasmine Turner", "Elise Porter", "Dana Mills",
    "Brooke Manning", "Serena Watts", "Alana Pierce", "Kendall Shaw",
    "Tara Reese", "Lexi Marsh", "Molly Bennett", "Nora Stanton",
    "Kate Lindsey", "Piper Conner", "Drew Santos", "Paxton Riley",
    "Hailey Stone", "Nadia Patel", "Simone Grant", "Ashley Ford",
    "Penelope Shaw", "Victoria James", "Lily Morgan", "Abby Jenkins",
    "Maya Foster", "Chloe Barrett", "Riley Hudson", "Paige Griffin",
    "Brooklyn Ward", "Aurora Bell", "Nova Reed", "Aria Scott",
    "Quinn Nelson", "Ivy Carter", "Skylar Perez", "Willow King",
    "Sierra Cole", "Regan Fox", "Tatum Blair", "Layla Cross",
    "Fiona Hayes", "Skye Holloway", "Cassidy Dunn", "Erin Walsh",
    "Bree Holland", "Mia Santos", "Tori Nguyen", "Zoe Adams",
  ];
  const instrPool = [
    "Isabella Reyes", "Natalie Kim", "Paige Torres", "Savannah Bell",
    "Caitlin Fox", "Jenna Hart", "Brianna Cole", "Mackenzie Price",
    "Autumn Ross", "Taylor Flynn", "Madison Cruz", "Avery Simmons",
    "Riley Bennett", "Jordan Gray", "Cameron Walsh", "Peyton Stone",
    "Reagan Mills", "Sloane Davis", "Quincy Marsh", "Blair Hunter",
    "Hayden Pierce", "Rowan Ellis", "Finley Webb", "Spencer Brooks",
    "Delaney Ward", "Ainsley Scott", "Presley Adams", "Shelby Morgan",
    "Waverly Diaz", "Harlow James", "Sutton Hayes", "Everett Chen",
    "Lennox Park", "Reese Hoffman", "Marlow Walsh", "Story Lane",
    "Blakely Ford", "Sailor Cross", "Teagan Rivers", "Lumi Castillo",
    "Zara Novak", "Ines Dumont", "Cleo Santos", "Petra Volkov",
    "Sasha Morin", "Gaia Russo", "Maren Holm", "Lena Braun",
  ];
  const leadPool = [
    "Jessica Park", "Andrea Santos", "Maria Lopez", "Stephanie Chen",
    "Kimberly Davis", "Patricia Wilson", "Jennifer Martinez", "Linda Anderson",
    "Elizabeth Jackson", "Susan White", "Karen Lewis", "Nancy Walker",
    "Betty Hall", "Helen Allen", "Sandra Young", "Dorothy Hernandez",
    "Ruth King", "Sharon Wright", "Laura Scott", "Kathy Adams",
    "Mary Baker", "Margaret Nelson", "Lisa Carter", "Nancy Mitchell",
  ];

  let dooIdx = 0, gmIdx = 0, instrIdx = 0, leadIdx = 0;
  const doo  = () => dooPool[dooIdx++    % dooPool.length];
  const gm   = () => gmPool[gmIdx++     % gmPool.length];
  const inst = () => instrPool[instrIdx++ % instrPool.length];
  const lead = () => leadPool[leadIdx++   % leadPool.length];

  const instrData: object[] = [];

  function addStaff(studioName: string, opts: { instructors: number; leads: number; atRisk?: boolean }) {
    const id = byName[studioName];
    if (!id) return;

    // Always one DOO
    instrData.push({
      studioId: id, name: doo(), role: "director_of_operations",
      certificationStatus: "certified",
      lastEvalDate: new Date("2026-04-01"),
      performanceScore: Math.floor(85 + Math.random() * 12),
    });

    // Always one GM
    instrData.push({
      studioId: id, name: gm(), role: "general_manager",
      certificationStatus: "certified",
      lastEvalDate: new Date("2026-04-01"),
      performanceScore: Math.floor(82 + Math.random() * 14),
    });

    // Studio leads
    for (let i = 0; i < opts.leads; i++) {
      instrData.push({
        studioId: id, name: lead(), role: "studio_lead",
        certificationStatus: "certified",
        lastEvalDate: new Date("2026-04-15"),
        performanceScore: Math.floor(80 + Math.random() * 16),
      });
    }

    // Instructors
    for (let i = 0; i < opts.instructors; i++) {
      const expired = !!opts.atRisk && i < Math.ceil(opts.instructors * 0.4);
      const pending = !expired && !!opts.atRisk && i === opts.instructors - 1;
      instrData.push({
        studioId: id, name: inst(), role: "instructor",
        certificationStatus: expired ? "expired" : pending ? "pending" : "certified",
        lastEvalDate: expired ? new Date("2025-10-15") : pending ? null : new Date("2026-04-20"),
        performanceScore: expired ? Math.floor(65 + Math.random() * 12) : pending ? null : Math.floor(80 + Math.random() * 16),
      });
    }
  }

  // Seed staff for every open studio
  for (const sd of studioDefs.filter(s => s.status !== "pre-launch")) {
    const atRisk = sd.status === "at-risk";
    const isNew  = sd.status === "new";
    // Bigger/established markets get more instructors; new studios fewer; at-risk fewest
    const instrCount = atRisk ? 2 : isNew ? 3 : 4;
    const leadCount  = atRisk ? 1 : isNew ? 1 : 2;
    addStaff(sd.name, { instructors: instrCount, leads: leadCount, atRisk });
  }

  await db.instructor.createMany({ data: instrData as any });

  // ── ANOMALIES ─────────────────────────────────────────────────────────────

  await db.anomaly.createMany({
    data: [
      { studioId: byName["Brickell"],          generatedAt: new Date("2026-05-28"), severity: "high",   category: "churn",      resolved: false, summary: "Brickell has reported a 31% spike in membership cancellations over the past 4 weeks. Two instructor departures were logged in the same period. Recommend immediate field ops outreach and instructor recruitment push to restore client confidence." },
      { studioId: byName["Preston Hollow"],    generatedAt: new Date("2026-05-30"), severity: "high",   category: "occupancy",  resolved: false, summary: "Preston Hollow shows class fill rate declining from 72% to 49% over 6 consecutive weeks. A new boutique Pilates competitor opened within 0.4 miles in April. Recommend a targeted win-back promotion and local partnership campaign before summer." },
      { studioId: byName["Midtown Doral"],     generatedAt: new Date("2026-06-01"), severity: "high",   category: "membership", resolved: false, summary: "Midtown Doral active memberships have declined 18% over 8 weeks with fill rate at 49% against the 70% network benchmark. Two instructors hold expired certifications. Immediate ops visit recommended." },
      { studioId: byName["Graduate Hospital"], generatedAt: new Date("2026-06-01"), severity: "medium", category: "membership", resolved: false, summary: "Graduate Hospital membership growth stalled at 119 active members — 40% below the Northeast new-studio ramp benchmark. Recommend activating the referral program and a local community outreach push." },
      { studioId: byName["Montclair"],         generatedAt: new Date("2026-05-29"), severity: "medium", category: "churn",      resolved: false, summary: "Montclair weekly churn rate has risen to 8.2%, nearly double the Northeast average. Studio opened November 2024 and has not hit the membership floor. Two instructor evaluation deadlines missed." },
      { studioId: byName["Sugar House"],       generatedAt: new Date("2026-05-31"), severity: "medium", category: "occupancy",  resolved: false, summary: "Sugar House class fill rate tracking at 44% — well below the 70% healthy threshold. Market is competitive with two established studios nearby. Recommend pricing audit and class schedule optimization." },
      { studioId: byName["Albuquerque Uptown"],generatedAt: new Date("2026-06-02"), severity: "medium", category: "occupancy",  resolved: false, summary: "Albuquerque Uptown fill rate has plateaued at 42% since opening. Membership acquisition tracking below benchmark. Consider adjusted class schedule and targeted community marketing." },
      { studioId: byName["Edwardsville"],      generatedAt: new Date("2026-05-27"), severity: "medium", category: "churn",      resolved: false, summary: "Edwardsville weekly churn elevated at 7.8%. Smaller market with limited membership replacement pipeline. Retention program activation and local fitness-adjacent partnerships recommended." },
      { studioId: byName["Creve Coeur"],       generatedAt: new Date("2026-06-01"), severity: "medium", category: "membership", resolved: false, summary: "Creve Coeur active memberships declining for 5 consecutive weeks. Revenue down 14% MoM. Studio has not reached expected 6-month ramp. Field ops review recommended." },
      { studioId: byName["Holly Springs"],     generatedAt: new Date("2026-06-02"), severity: "low",    category: "membership", resolved: false, summary: "Holly Springs opened August 2025 and membership ramp is tracking slightly below the new-studio benchmark. Presales conversion was strong; recommend activating referral program earlier than standard timeline." },
      { studioId: byName["JETSET Miami"],      generatedAt: new Date("2026-05-25"), severity: "low",    category: "instructor", resolved: false, summary: "Two instructors at JETSET Miami have recertification deadlines within the next 30 days. Recommend scheduling evaluation slots before peak summer season to avoid reduced class capacity." },
    ],
  });

  const open = studioDefs.filter(s => s.status !== "pre-launch").length;
  const pre  = studioDefs.filter(s => s.status === "pre-launch").length;
  console.log(`✓ Seeded ${studioDefs.length} studios (${open} open · ${pre} pre-launch), ${allMetrics.length} weekly metrics, ${instrData.length} instructors, 11 anomalies`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
