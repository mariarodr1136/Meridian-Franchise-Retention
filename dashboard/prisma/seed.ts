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
    const decline = Math.min(i, 14); // plateau after 14 weeks so members don't go negative
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
    const ramp = (25 - i) / 25; // 1.0 at most recent, 0.0 at oldest
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

const STUDIO_CONTACT: Record<string, { address: string | null; phone: string | null }> = {
  // Florida – open
  "Aventura":                          { address: "2958 Aventura Blvd., Unit B4",           phone: "(786) 904-9338" },
  "Brickell":                          { address: "40 Southwest 13th St., Suite 504",        phone: "(307) 228-0084" },
  "Carrollwood":                       { address: "10019 N Dale Mabry Hwy.",                 phone: "(813) 532-3017" },
  "Coconut Grove":                     { address: "2680 Tigertail Ave.",                      phone: "(786) 981-9434" },
  "Coral Springs":                     { address: "2920 N University Dr.",                    phone: "(954) 539-9206" },
  "Delray":                            { address: "269 Northeast 2nd Ave.",                   phone: "(561) 455-1563" },
  "Downtown Miami":                    { address: "151 SE 1st St., Suite 10",                 phone: "(305) 565-3349" },
  "Downtown Tampa":                    { address: "511 W Cass St.",                            phone: "(813) 921-1605" },
  "Dr. Phillips":                      { address: "7940 Via Dellagio Way, Suite 112",          phone: "(407) 934-0582" },
  "Edgewater":                         { address: "2063 Biscayne Blvd., Suite 301",            phone: "(305) 400-4280" },
  "Estero – Coconut Point":            { address: "23050 Via Villagio, Suite 121",             phone: "(239) 895-9238" },
  "Fort Lauderdale – Flagler Village": { address: "421 Northeast 6th St., Suite 110",          phone: "(954) 296-7307" },
  "Jacksonville – Gate Parkway":       { address: "7540 Gate Pkwy. North",                     phone: "(904) 605-1360" },
  "Jax Beach":                         { address: "1515 3rd St. North",                        phone: "(904) 694-5359" },
  "JETSET Miami":                      { address: "110 Washington Ave., Suite CU8",            phone: "(305) 424-2227" },
  "Merrick Park":                      { address: "4102-A Ponce de Leon Blvd.",                phone: "(305) 882-9727" },
  "Midtown Doral":                     { address: "8175 NW 107th Ave., Suite #106",            phone: "(305) 539-0678" },
  "North Miami":                       { address: "12000 Biscayne Blvd., Suite 108",           phone: "(786) 998-4438" },
  "Oviedo":                            { address: "45 W Mitchell Hammock Rd., Suite #1361",    phone: "(321) 415-0468" },
  "Palm Beach Gardens":                { address: "11320 Legacy Ave. Plaza, Suite 110",         phone: "(561) 680-3921" },
  "South Tampa":                       { address: "1413 S Howard Ave., Suite B150",             phone: "(813) 587-2313" },
  "Sunset Harbour":                    { address: "1860 West Ave., 2nd Floor",                  phone: "(786) 542-5009" },
  "Wellington":                        { address: "2535 S State Rd. 7, Unit 110",               phone: "(561) 783-4288" },
  "West Boca":                         { address: "8236 Glades Rd.",                            phone: "(561) 609-0883" },
  "West Palm Beach":                   { address: "393 Banyan Blvd.",                           phone: "(561) 489-4684" },
  "Weston":                            { address: "1675 Market St.",                            phone: "(954) 852-0995" },
  "Winter Park":                       { address: "1967 Aloma Ave., Unit 0022",                 phone: "(407) 499-8118" },
  // Georgia – open
  "Alpharetta":                        { address: "4101 Lake St.",                              phone: "(770) 847-0108" },
  "Buckhead":                          { address: "3330 Piedmont Rd.",                          phone: "(678) 539-8426" },
  // North Carolina – open
  "Charlotte – South End":             { address: "2161 Hawkins St., Suite 150",                phone: "(980) 890-7020" },
  "Downtown Raleigh":                  { address: "500 N West St., Suite 145",                  phone: "(984) 833-2787" },
  "Holly Springs":                     { address: "3141 McChesney Hill Loop",                   phone: "(919) 899-2368" },
  "Lake Norman":                       { address: "8908 Lindholm Dr.",                          phone: "(704) 946-5568" },
  "Raleigh – North Hills":             { address: "200 Park at North Hills St.",                phone: "(984) 205-4684" },
  "Research Triangle Park":            { address: "3150 Elion Dr.",                             phone: "(984) 250-0725" },
  // South Carolina – open
  "West End Greenville":               { address: "250 Riverplace",                             phone: "(864) 263-1966" },
  // Tennessee – open
  "Midtown Nashville":                 { address: "827 19th Ave. S",                            phone: "(615) 866-5431" },
  // New York – open
  "Boerum Hill":                       { address: "476 Atlantic Ave.",                          phone: "(917) 651-0611" },
  "Chelsea":                           { address: "129 West 20th St.",                          phone: "(646) 906-8077" },
  "Gramercy":                          { address: "257 3rd Ave.",                               phone: "(646) 793-9479" },
  "NoHo":                              { address: "303 Bowery",                                 phone: "(646) 687-9108" },
  "Park Avenue":                       { address: "2 Park Avenue",                              phone: "(646) 687-7271" },
  "SoHo":                              { address: "355 W. Broadway",                            phone: "(646) 679-6389" },
  // New Jersey – open
  "Florham Park":                      { address: "187 Columbia Turnpike",                      phone: "(973) 791-5981" },
  "Montclair":                         { address: "307 Pompton Ave.",                           phone: "(973) 566-3596" },
  "Somerville":                        { address: "183 West Main St.",                          phone: "(908) 530-3378" },
  "Wayne":                             { address: "582 Valley Rd., Unit #17",                   phone: "(973) 832-1545" },
  "Woodcliff Lake":                    { address: "453 Chestnut Ridge Rd.",                     phone: "(201) 730-5566" },
  // Connecticut – open
  "Darien":                            { address: "25 Old Kings Hwy. N",                        phone: "(203) 875-0045" },
  // Massachusetts – open
  "Wellesley":                         { address: "98 Central St.",                             phone: "(781) 455-2925" },
  // Pennsylvania – open
  "Graduate Hospital":                 { address: "600 South 24th St.",                         phone: "(215) 709-9061" },
  "Main Line Haverford":               { address: "354 West Lancaster Ave.",                    phone: "(610) 980-8182" },
  // Washington DC – open
  "Union Market":                      { address: "1280 Union St. NE, Suite #2",                phone: "(202) 400-3066" },
  // Texas – open
  "Austin – Downtown":                 { address: "1011 West 5th St.",                          phone: "(737) 273-9364" },
  "Austin – South":                    { address: "5601 Brodie Ln.",                            phone: "(737) 303-5843" },
  "Bridgeland":                        { address: "20115 Bridgeland Creek Parkway",              phone: "(832) 402-8319" },
  "Heath":                             { address: "453 Laurence Dr.",                           phone: "(972) 853-9630" },
  "Houston – River Oaks":              { address: "3515 West Dallas St.",                       phone: "(832) 924-0413" },
  "League City":                       { address: "1340 East League City Pkwy.",                phone: "(281) 724-5444" },
  "Preston Hollow":                    { address: "4029 E. Northwest Pkwy.",                    phone: "(214) 466-8315" },
  "West McKinney":                     { address: "3241 S Custer Rd., Suite #103",              phone: "(945) 203-4583" },
  // California – open
  "Irvine Crossroads":                 { address: "3800 Barranca Pkwy., Suite J",               phone: "(949) 979-5609" },
  "Torrey Hills":                      { address: "4639 Carmel Mountain Rd., Suite 102",        phone: "(858) 289-5499" },
  // Mountain West – open
  "Denver – RiNo":                     { address: "3191 Walnut St.",                            phone: "(720) 734-4167" },
  "Sugar House":                       { address: "1142 Wilmington Avenue",                     phone: "(385) 707-0595" },
  "Albuquerque Uptown":                { address: "2200 Louisiana Blvd. NE, Suite 08E",          phone: "(505) 589-3146" },
  // Midwest – open
  "Edwardsville":                      { address: "2421 Troy Road",                             phone: "(618) 391-9938" },
  "Northbrook":                        { address: "984 Willow Rd., Unit F",                     phone: "(224) 479-0323" },
  "Creve Coeur":                       { address: "11625 Olive Blvd.",                          phone: "(314) 648-3802" },
  // Pre-launch – California
  "Folsom Ranch":                      { address: "SWC Alder Creek Blvd. & E Bidwell St.",      phone: null },
  "Liberty Station":                   { address: "2850 Womble Rd.",                            phone: null },
  "Los Gatos":                         { address: "15525 Union Ave., Suite A-8",                phone: null },
  "Marina District":                   { address: "1868 Lombard Street",                        phone: null },
  "San Marcos":                        { address: "336 S Twin Oaks Village Rd.",                phone: null },
  "Santa Clara Rivermark":             { address: "3914 Rivermark Plaza",                       phone: "(408) 549-2532" },
  // Pre-launch – Mountain West
  "Boulder Crossroads":                { address: "3000 Pearl Pkwy., Unit 1800",                phone: null },
  "Holladay":                          { address: "4736 S Highland Drive",                      phone: null },
  "South Lake Union":                  { address: "1120 Denny Way, Suite 5",                    phone: null },
  // Pre-launch – Northeast
  "Westport":                          { address: "520 Post Road East",                         phone: null },
  "Belmont":                           { address: "60 Leonard Street",                          phone: null },
  "Marlton":                           { address: "500 Route 73 South, Suite C16",              phone: null },
  "Oakhurst":                          { address: "1609 NJ-35, Suite C3",                       phone: null },
  "Parsippany":                        { address: "1501 NJ-10, Suite #C-05",                    phone: null },
  "Latham":                            { address: "664 Loudon Rd.",                             phone: "(518) 608-2153" },
  "Main Line Wayne":                   { address: "605 W Lancaster Ave.",                       phone: null },
  "Northern Liberties":                { address: "130 West Girard Ave.",                       phone: "(215) 995-3294" },
  "Warrington":                        { address: "1587 Main Street, Unit 202",                 phone: null },
  "Tysons":                            { address: "1640 Boro Pl, Suite 206",                    phone: null },
  "14th Street":                       { address: "1934 14th Street NW",                        phone: null },
  // Pre-launch – Southeast Florida
  "Boynton Beach":                     { address: "398 N Congress Ave #102",                    phone: null },
  "Jacksonville – Pearl Square":       { address: "515 N Pearl Street",                         phone: null },
  "Kendall":                           { address: "8525 Mills Drive, Suite 304",                phone: null },
  "Lake Nona":                         { address: "5959 Lake Nona Blvd., Suite 160",            phone: null },
  "Lakewood Ranch":                    { address: "8330 Market Street",                         phone: null },
  "Naples":                            { address: "5926 Premier Way, Unit 106",                 phone: null },
  "Oakland Park":                      { address: "3411 N Federal Hwy.",                        phone: null },
  "Pembroke Pines":                    { address: "14554 SW 5th St.",                           phone: "(954) 852-4389" },
  "Pinecrest":                         { address: "9600 South Dixie Hwy.",                      phone: "(305) 754-7352" },
  "Port St. Lucie":                    { address: "10300 SW Discovery Way",                     phone: null },
  "Tallahassee":                       { address: "440 North Monroe St.",                       phone: "(850) 583-9887" },
  "Viera":                             { address: "2903 Sadore Way",                            phone: null },
  "Westchase":                         { address: "10109 Montague St.",                         phone: null },
  "Winter Garden":                     { address: "16 East Plant Street",                       phone: null },
  "World Golf Village":                { address: "150 Village Commons Drive, A-104",           phone: null },
  // Pre-launch – Southeast Georgia
  "Buford":                            { address: "2925 Buford Drive, Suite 530",               phone: null },
  "Dunwoody":                          { address: "5482 Chamblee Dunwoody Rd., Suite 29A",      phone: null },
  "East Cobb":                         { address: "1255 Johnson Ferry Road",                    phone: null },
  // Pre-launch – Southeast Carolinas / TN
  "Durham":                            { address: "440 South Roxboro St., Suite 130",           phone: "(984) 250-0134" },
  "Forest Acres":                      { address: "2710 Gervais Street, Suite 200",             phone: null },
  "Brentwood":                         { address: "205 Franklin Rd.",                           phone: "(615) 880-9386" },
  // Pre-launch – Texas
  "Austin – Arboretum":                { address: "10000 Research Boulevard, Suite #124",       phone: null },
  "District West":                     { address: "22125 FM 1093 Rd.",                          phone: null },
  "Flower Mound":                      { address: "6101 Long Prairie Rd., Suite 736",           phone: "(972) 573-4628" },
  "Friendswood":                       { address: "106 Whispering Pines Ave., Suite 107",       phone: null },
  "GTX":                               { address: "1314 W University Ave.",                     phone: null },
  "Sienna":                            { address: "10040 Highway 6",                            phone: "(832) 532-9266" },
  "Sugar Land":                        { address: "2635 Town Center Blvd N.",                   phone: null },
  "Uptown Dallas":                     { address: "3220 McKinney Ave., Suite 110",              phone: null },
  "Vintage Park":                      { address: "122 Vintage Park Blvd., Suite G",            phone: null },
  // Pre-launch – Midwest
  "Gold Coast":                        { address: "12-14 W. Maple Street",                      phone: null },
  "Lakeview":                          { address: "3101 N. Clark Street, 1-B",                  phone: null },
  "Naperville":                        { address: "2555 W 75th Street",                         phone: null },
  "Carmel":                            { address: "1017 W. Main Street, Suite 10",              phone: null },
  "Fishers":                           { address: "11433 East Union St., Suite 140",            phone: null },
  "West Des Moines":                   { address: "950 Jordan Creek Parkway, Suite C",          phone: null },
  "Overland Park":                     { address: "7840 W 161st St., Suite H-110",              phone: null },
  "Des Peres":                         { address: "1066 North Ballas Rd.",                      phone: "(314) 627-1543" },
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

  // ── REVIEWS ───────────────────────────────────────────────────────────────

  const FIVE_STAR: { author: string; body: string; source: string }[] = [
    { author: "Sarah M.",    source: "google",    body: "Best Pilates studio I've been to. The instructors are world-class and genuinely invest in your progress. My posture, strength, and flexibility have all improved dramatically. Completely obsessed." },
    { author: "Jessica L.",  source: "classpass", body: "I drive 30 minutes just to come here. The reformer classes are unlike anything else — intense, fun, and the community is incredible. Worth every single penny." },
    { author: "Natalie R.",  source: "google",    body: "Completely transformed my fitness routine. Instructors know your name, remember your goals, and push you just enough. Six months in and I'm the strongest I've ever been." },
    { author: "Amanda T.",   source: "classpass", body: "The energy in this studio is unmatched. Amazing instructors, great music, truly boutique experience. I've recommended JETSET to everyone I know — nobody has been disappointed." },
    { author: "Lauren K.",   source: "google",    body: "If you're on the fence, just try one class. You'll be hooked. The workout is challenging in all the right ways and the instructors make everyone feel welcome regardless of fitness level." },
    { author: "Priya N.",    source: "google",    body: "I was a skeptic — I thought Pilates was too slow-paced for me. After one class I was proven completely wrong. This is full-body strength training on a different level. I come 4x a week now." },
    { author: "Diana C.",    source: "classpass", body: "Professional, welcoming, and seriously effective. My back pain is completely gone and my core has never been stronger. The instructors really know their craft." },
    { author: "Michelle Y.", source: "google",    body: "Hands down the best group fitness experience I've had. Small class sizes mean actual attention to form, which has made a huge difference for me. Can't imagine going anywhere else." },
    { author: "Taylor E.",   source: "classpass", body: "JETSET has ruined all other workouts for me. Nothing compares. The combination of Pilates fundamentals with real strength training is brilliant. Every instructor brings something different to the class." },
    { author: "Camille B.",  source: "google",    body: "I've tried SoulCycle, Orangetheory, CrossFit — nothing has transformed my body like JETSET. The reformer is no joke. Within two months I had visible results I hadn't achieved in years." },
    { author: "Rachel P.",   source: "classpass", body: "The studio itself is beautiful — clean, modern, and well-maintained. But it's really the instructors that make this place special. They remember your name from day one and genuinely care." },
    { author: "Stephanie W.", source: "google",  body: "Incredible studio. The classes are always perfectly structured — tough enough to feel like you worked hard, but you leave feeling energized not destroyed. This is my happy place." },
  ];

  const FOUR_STAR: { author: string; body: string; source: string }[] = [
    { author: "Olivia S.",   source: "google",    body: "Really great studio with knowledgeable instructors. My only wish is that there were more class times available in the evenings — they fill up so fast! Still absolutely worth booking in advance." },
    { author: "Kate H.",     source: "classpass", body: "Fantastic workout and amazing instructors. Parking can be tricky depending on the time of day but once you're inside the studio is beautiful and the class is totally worth the hassle." },
    { author: "Brooke M.",   source: "google",    body: "Love this studio. The classes are challenging in all the right ways. Gave 4 stars only because the booking app is clunky sometimes, but the actual in-studio experience is top notch." },
    { author: "Lexi F.",     source: "classpass", body: "Great experience overall. Instructors are attentive and the reformers are high quality. A few instructor changes lately but the core team is still excellent. Will definitely keep coming." },
    { author: "Morgan D.",   source: "google",    body: "Really solid studio. The reformer Pilates format works so well — challenging but low impact so my joints feel great. I come about 3x a week and have noticed a huge improvement in my overall fitness." },
    { author: "Haley J.",    source: "classpass", body: "Super clean, professional, and the instructors clearly know their stuff. I'd give it 5 stars but the waitlist situation is real — you have to book days in advance for popular time slots." },
  ];

  const THREE_STAR: { author: string; body: string; source: string }[] = [
    { author: "Christina B.", source: "google",   body: "Used to be my favorite studio but quality has slipped over the past few months. A lot of instructor turnover and some of the newer instructors aren't quite at the same level yet. Hoping it gets back to where it was." },
    { author: "Allison T.",   source: "classpass", body: "Hit or miss depending on the instructor. When you get a great one it's a 5-star experience, but lately the consistency just isn't there. The concept is great — execution needs some work." },
    { author: "Dana R.",      source: "google",   body: "The reformers are high quality and the workout is solid, but I've noticed the studio feels less personal lately. Classes seem more rushed and there's less attention to individual form corrections." },
    { author: "Kira W.",      source: "classpass", body: "Average experience for the price point. Some instructors are excellent, others are just okay. The studio is clean and well-equipped but I expect more personalization at this price." },
  ];

  const TWO_STAR: { author: string; body: string; source: string }[] = [
    { author: "Monica V.",   source: "google",    body: "Really disappointed in how things have gone recently. Loved this place when it first opened but there have been a lot of changes and it just doesn't feel the same. Instructor departures, half-full classes — something's off." },
    { author: "Tara S.",     source: "classpass", body: "The late cancel policy is extremely punitive — $35 for canceling 10 hours before class due to an emergency. Workout is fine but the policies and the way customer service handled my complaint left a lot to be desired." },
    { author: "Brittany L.", source: "google",    body: "I really wanted to love this place. The equipment is great and the concept is solid, but the management feel has really declined. Class sizes feel too big now and instructors are stretched thin." },
  ];

  const NEW_STUDIO: { author: string; body: string; source: string }[] = [
    { author: "Grace A.",    source: "google",    body: "Just opened and already feels like a special place. The instructors are clearly passionate and so attentive. The studio is beautiful and the community is already forming. Can't wait to watch this place grow!" },
    { author: "Isabella H.", source: "classpass", body: "So happy this studio opened nearby. Modern equipment, excellent instruction, and a genuinely welcoming vibe. The instructors take extra time with newer clients which I really appreciate." },
    { author: "Sophie N.",   source: "google",    body: "Early adopter here and loving every single class. The instructors correct your form throughout and make sure you're getting the most out of the workout. Impressed with the quality for such a new studio." },
    { author: "Zoe K.",      source: "classpass", body: "Tried it on a whim and now I'm fully committed. Great energy for a brand new studio — already feels like a real community. Instructors are top tier. So glad they came to this area." },
    { author: "Ava R.",      source: "google",    body: "Brand new but already running like a well-oiled machine. Punctual classes, beautiful space, and instructors who genuinely care. Already booked my next two weeks of classes." },
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

    const o = studioIdx; // offset for picking different templates per studio
    const isAtRisk = sd.status === "at-risk";
    const isNew    = sd.status === "new";

    if (isNew) {
      const picks = [0, 1, 2, 3, (o % 2 === 0 ? 4 : 1)].slice(0, 4 + (o % 2));
      picks.forEach((pi, i) => {
        const t = NEW_STUDIO[pi % NEW_STUDIO.length];
        reviewData.push({ studioId: id, source: t.source, author: t.author, rating: 5, body: t.body, reviewDate: daysAgo(10 + i * 14 + (o % 7)) });
      });
      const four = FOUR_STAR[(o + 2) % FOUR_STAR.length];
      // Always ensure ClassPass is present
      reviewData.push({ studioId: id, source: "classpass", author: four.author, rating: 4, body: four.body, reviewDate: daysAgo(5 + (o % 8)) });

    } else if (isAtRisk) {
      const fivePick = FIVE_STAR[(o + 3) % FIVE_STAR.length];
      reviewData.push({ studioId: id, source: "google", author: fivePick.author, rating: 5, body: fivePick.body, reviewDate: daysAgo(90 + (o % 30)) });
      const fourPick = FOUR_STAR[(o + 1) % FOUR_STAR.length];
      // Always ensure ClassPass is present
      reviewData.push({ studioId: id, source: "classpass", author: fourPick.author, rating: 4, body: fourPick.body, reviewDate: daysAgo(60 + (o % 20)) });
      const threeA = THREE_STAR[o % THREE_STAR.length];
      reviewData.push({ studioId: id, source: threeA.source, author: threeA.author, rating: 3, body: threeA.body, reviewDate: daysAgo(30 + (o % 15)) });
      const threeB = THREE_STAR[(o + 2) % THREE_STAR.length];
      reviewData.push({ studioId: id, source: threeB.source, author: threeB.author, rating: 3, body: threeB.body, reviewDate: daysAgo(18 + (o % 10)) });
      const twoA = TWO_STAR[o % TWO_STAR.length];
      reviewData.push({ studioId: id, source: twoA.source, author: twoA.author, rating: 2, body: twoA.body, reviewDate: daysAgo(7 + (o % 6)) });
      if (o % 2 === 0) {
        const twoB = TWO_STAR[(o + 1) % TWO_STAR.length];
        reviewData.push({ studioId: id, source: twoB.source, author: twoB.author, rating: 2, body: twoB.body, reviewDate: daysAgo(3 + (o % 4)) });
      }

    } else {
      const fivePicks = [o % FIVE_STAR.length, (o + 2) % FIVE_STAR.length, (o + 5) % FIVE_STAR.length, (o + 8) % FIVE_STAR.length];
      const dateBases = [45, 28, 16, 6];
      fivePicks.forEach((pi, i) => {
        const t = FIVE_STAR[pi];
        reviewData.push({ studioId: id, source: t.source, author: t.author, rating: 5, body: t.body, reviewDate: daysAgo(dateBases[i] + (o % 8)) });
      });
      const fourA = FOUR_STAR[(o + o) % FOUR_STAR.length];
      reviewData.push({ studioId: id, source: "google", author: fourA.author, rating: 4, body: fourA.body, reviewDate: daysAgo(35 + (o % 12)) });
      const fourB = FOUR_STAR[(o + 3) % FOUR_STAR.length];
      // Always ensure ClassPass is present
      reviewData.push({ studioId: id, source: "classpass", author: fourB.author, rating: 4, body: fourB.body, reviewDate: daysAgo(10 + (o % 9)) });
      if (o % 3 === 0) {
        const three = THREE_STAR[o % THREE_STAR.length];
        reviewData.push({ studioId: id, source: three.source, author: three.author, rating: 3, body: three.body, reviewDate: daysAgo(55 + (o % 20)) });
      }
    }
  });

  await db.review.createMany({ data: reviewData as any });

  // ── CLASS METRICS ─────────────────────────────────────────────────────────

  // Representative time slots matching typical JetSet schedules
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
      // w=0 = most recent week; declining trend for at-risk, growing for new
      const weekFactor =
        isAtRisk ? 1.0 - (7 - w) * 0.04 :       // recent weeks lower
        isNew    ? 0.65 + (7 - w) * 0.05 :        // recent weeks higher
        1.0 + (si % 3 === 0 ? (w > 4 ? -0.05 : 0.02) : 0); // healthy: mild noise

      for (let day = 0; day < 7; day++) {
        for (const { slot, tf, evening } of SLOTS) {
          // Skip some slots on weekends to make it realistic
          if ((day === 0 || day === 6) && !["8:30am","9:30am","10:30am","11:30am","12:30pm","1:30pm","9:00am","10:00am"].includes(slot) && slot.includes("am") === false && slot.includes("6:00am")) continue;
          if ((day === 0 || day === 6) && parseFloat(slot) < 8 && slot.includes("am")) continue;

          const rawFill = Math.min(1, Math.max(0.05,
            baseFill * tf * weekFactor * (0.88 + Math.random() * 0.24)
          ));
          // Inject interesting pattern: some studios have one dead slot
          const deadSlot = ["8:00pm", "12:00pm", "4:00pm"][si % 3];
          const fillRate = slot === deadSlot && (isAtRisk || si % 4 === 0)
            ? rawFill * 0.40
            : rawFill;

          const spotsFilled = Math.max(0, Math.round(cap * fillRate));

          // Booking mix: evening slots skew ClassPass; morning skew members
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

  // Batch insert to keep seed fast
  for (let i = 0; i < classMetricData.length; i += 1000) {
    await db.classMetric.createMany({ data: classMetricData.slice(i, i + 1000) as any });
  }

  const open = studioDefs.filter(s => s.status !== "pre-launch").length;
  const pre  = studioDefs.filter(s => s.status === "pre-launch").length;
  console.log(`✓ Seeded ${studioDefs.length} studios (${open} open · ${pre} pre-launch), ${allMetrics.length} weekly metrics, ${instrData.length} instructors, 11 anomalies, ${reviewData.length} reviews, ${classMetricData.length} class metrics`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
