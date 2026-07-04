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
  "Aria Pemberton", "Luna Fairchild", "Nova Ashford", "Stella Langley", "Cleo Clifton",
  "Sage Whitmore", "Remi Hollister", "Quinn Blackwell", "Juno Harlow", "Elara Westbrook",
  "Vera Prescott", "Petra Calloway", "Nora Moorfield", "Mila Sinclair", "Lyra Brentwood",
  "Isla Ashton", "Fern Fairfax", "Demi Langford", "Clara Hartwell", "Blythe Thornfield",
  "Anya Remington", "Wren Caldwell", "Tess Ellison", "Sable Whitfield", "Rowan Harrington",
  "Piper Ashby", "Opal Lockwood", "Nola Hensley", "Maren Clayfield", "Linden Clifford",
  "Katia Moorland", "June Westfield", "Iris Holloway", "Hazel Brentmore", "Gia Callaway",
  "Faye Langmore", "Eve Ellington", "Dawn Hartfield", "Coral Pemberton", "Briar Whitfield",
  "Ava Lockwood", "Alma Thornfield", "Alba Westfield", "Aida Harrington", "Zoe Remington",
  "Yara Ashmore", "Xena Caldfield", "Winona Whitmore", "Vivien Hartfield", "Uma Langford",
  "Tara Prescott", "Sylvie Clayford", "Suki Brentmore", "Sorrel Hollander", "Rory Whitwick",
  "Reeva Landfield", "Prue Moorland", "Orla Blackmore", "Niamh Hallford", "Maeve Whitwell",
  "Lola Brentfield", "Kyra Landmore", "Jules Caldmore", "Ingrid Hartland", "Hana Ashmore",
  "Greta Westmore", "Flora Moorfield", "Esme Langford", "Dora Whitfield", "Celeste Caldmore",
  "Bree Blackford", "Anais Hartmore", "Zuri Langmore", "Yael Whitfield", "Xara Hallmore",
  "Willa Fieldmore", "Veda Brentford", "Una Moormore", "Thea Landfield", "Seren Whitmore",
  "Rio Caldfield", "Peta Hartfield", "Ona Blackmore", "Noa Ashfield", "Mira Moorfield",
  "Leda Langmore", "Kira Whitfield", "Jora Caldmore", "Ines Hartmore", "Hera Fieldmore",
  "Gia Blackfield", "Fiona Langfield", "Elara Moormore", "Demi Whitmore", "Clio Caldfield",
  "Blythe Hartfield", "Aya Fieldmore", "Zara Blackmore", "Yuki Langmore", "Xanthe Whitfield",
  "Wren Caldmore", "Vera Hartmore", "Una Fieldmore", "Tova Blackfield", "Suri Langfield",
  "Romy Moormore", "Quin Whitmore", "Page Caldfield", "Nyx Hartfield", "Mina Fieldmore",
  "Lara Blackmore", "Kaia Langmore", "Joa Whitfield", "Ima Caldmore", "Hoa Hartmore",
  "Gia Fieldmore", "Fara Blackfield", "Ema Langfield", "Dara Moormore", "Cora Whitmore",
];

let fIdx = 0;
const f = () => FRANCHISEES[fIdx++ % FRANCHISEES.length];

const STUDIO_CONTACT: Record<string, { address: string | null; phone: string | null }> = {
  // Florida – open
  "Aventura":                          { address: "3421 Biscayne Way, Suite 12",              phone: "(305) 555-0128" },
  "Brickell":                          { address: "88 South Harbor Dr., Suite 301",            phone: "(786) 555-0243" },
  "Carrollwood":                       { address: "15023 N. Parkview Blvd.",                   phone: "(813) 555-0372" },
  "Coconut Grove":                     { address: "3148 Sunset Ave.",                           phone: "(786) 555-0481" },
  "Coral Springs":                     { address: "7712 N. University Way",                    phone: "(954) 555-0195" },
  "Delray":                            { address: "403 East 5th Ave.",                          phone: "(561) 555-0367" },
  "Downtown Miami":                    { address: "82 NE Commerce St., Suite 7",               phone: "(305) 555-0514" },
  "Downtown Tampa":                    { address: "224 W. Harbor Blvd.",                        phone: "(813) 555-0629" },
  "Dr. Phillips":                      { address: "6124 Regency Pkwy., Suite 205",              phone: "(407) 555-0741" },
  "Edgewater":                         { address: "3312 Biscayne Ct., Suite 110",               phone: "(305) 555-0856" },
  "Estero – Coconut Point":            { address: "18409 Market Circle, Suite 88",              phone: "(239) 555-0917" },
  "Fort Lauderdale – Flagler Village": { address: "614 NE 4th St., Suite 220",                  phone: "(954) 555-0183" },
  "Jacksonville – Gate Parkway":       { address: "8821 Park Pkwy. North",                      phone: "(904) 555-0294" },
  "Jax Beach":                         { address: "2308 4th St. North",                         phone: "(904) 555-0437" },
  "JETSET Miami":                      { address: "200 Ocean Dr., Suite B12",                   phone: "(305) 555-0562" },
  "Merrick Park":                      { address: "5017-B Ponce Ave.",                          phone: "(305) 555-0673" },
  "Midtown Doral":                     { address: "9342 NW 112th Ave., Suite #201",             phone: "(305) 555-0784" },
  "North Miami":                       { address: "14400 Biscayne Way, Suite 210",              phone: "(786) 555-0895" },
  "Oviedo":                            { address: "88 W. Lakewood Rd., Suite #420",             phone: "(407) 555-0916" },
  "Palm Beach Gardens":                { address: "12245 Palmway Plaza, Suite 220",              phone: "(561) 555-0127" },
  "South Tampa":                       { address: "2519 S. Bay Ave., Suite C100",               phone: "(813) 555-0238" },
  "Sunset Harbour":                    { address: "2204 Canal Ave., 3rd Floor",                 phone: "(786) 555-0349" },
  "Wellington":                        { address: "3198 S. Parkway 7, Unit 222",                phone: "(561) 555-0451" },
  "West Boca":                         { address: "9512 Palmetto Rd.",                          phone: "(561) 555-0562" },
  "West Palm Beach":                   { address: "517 Harbor Blvd.",                           phone: "(561) 555-0673" },
  "Weston":                            { address: "2219 Commerce St.",                          phone: "(954) 555-0784" },
  "Winter Park":                       { address: "2341 Aloma Way, Unit 1140",                  phone: "(407) 555-0895" },
  // Georgia – open
  "Alpharetta":                        { address: "5231 Commerce Lake St.",                     phone: "(770) 555-0127" },
  "Buckhead":                          { address: "4418 Peachtree Rd. NE",                      phone: "(678) 555-0238" },
  // North Carolina – open
  "Charlotte – South End":             { address: "3417 Industrial Ave., Suite 280",            phone: "(980) 555-0192" },
  "Downtown Raleigh":                  { address: "612 N. Commerce St., Suite 90",              phone: "(919) 555-0284" },
  "Holly Springs":                     { address: "4422 McMillan Rd.",                          phone: "(919) 555-0371" },
  "Lake Norman":                       { address: "10122 Lakeside Dr.",                         phone: "(704) 555-0462" },
  "Raleigh – North Hills":             { address: "300 Park at Highland St.",                   phone: "(919) 555-0553" },
  "Research Triangle Park":            { address: "4275 Meridian Dr.",                          phone: "(919) 555-0644" },
  // South Carolina – open
  "West End Greenville":               { address: "315 Riverside Walk",                         phone: "(864) 555-0127" },
  // Tennessee – open
  "Midtown Nashville":                 { address: "1042 21st Ave. S",                           phone: "(615) 555-0238" },
  // New York – open
  "Boerum Hill":                       { address: "594 Atlantic Way",                           phone: "(718) 555-0127" },
  "Chelsea":                           { address: "254 West 22nd St.",                          phone: "(646) 555-0238" },
  "Gramercy":                          { address: "371 4th Ave.",                               phone: "(646) 555-0349" },
  "NoHo":                              { address: "418 Bleecker St.",                           phone: "(646) 555-0451" },
  "Park Avenue":                       { address: "8 Park Avenue",                              phone: "(212) 555-0562" },
  "SoHo":                              { address: "473 W. Canal St.",                           phone: "(646) 555-0673" },
  // New Jersey – open
  "Florham Park":                      { address: "243 Columbia Way",                           phone: "(973) 555-0127" },
  "Montclair":                         { address: "418 Pompton Blvd.",                          phone: "(973) 555-0238" },
  "Somerville":                        { address: "247 West Elm St.",                           phone: "(908) 555-0349" },
  "Wayne":                             { address: "714 Valley Rd., Unit #32",                   phone: "(973) 555-0451" },
  "Woodcliff Lake":                    { address: "581 Chestnut Ridge Way",                     phone: "(201) 555-0562" },
  // Connecticut – open
  "Darien":                            { address: "37 Old Post Rd. N",                          phone: "(203) 555-0127" },
  // Massachusetts – open
  "Wellesley":                         { address: "124 Center St.",                             phone: "(617) 555-0127" },
  // Pennsylvania – open
  "Graduate Hospital":                 { address: "740 South 26th St.",                         phone: "(215) 555-0127" },
  "Main Line Haverford":               { address: "428 West Lancaster Way",                     phone: "(610) 555-0238" },
  // Washington DC – open
  "Union Market":                      { address: "1450 Union St. NE, Suite #5",                phone: "(202) 555-0127" },
  // Texas – open
  "Austin – Downtown":                 { address: "1248 West 6th St.",                          phone: "(512) 555-0127" },
  "Austin – South":                    { address: "6812 Brodie Way",                            phone: "(512) 555-0238" },
  "Bridgeland":                        { address: "22400 Bridgeland Creek Dr.",                 phone: "(832) 555-0349" },
  "Heath":                             { address: "617 Laurence Way",                           phone: "(469) 555-0451" },
  "Houston – River Oaks":              { address: "4208 West Dallas Way",                       phone: "(713) 555-0562" },
  "League City":                       { address: "1587 East League City Way",                  phone: "(281) 555-0673" },
  "Preston Hollow":                    { address: "5114 E. Northwest Hwy.",                     phone: "(214) 555-0784" },
  "West McKinney":                     { address: "3894 S Custer Way, Suite #220",              phone: "(469) 555-0895" },
  // California – open
  "Irvine Crossroads":                 { address: "4525 Barranca Way, Suite K",                 phone: "(949) 555-0127" },
  "Torrey Hills":                      { address: "5817 Carmel Mountain Way, Suite 215",        phone: "(858) 555-0238" },
  // Mountain West – open
  "Denver – RiNo":                     { address: "3847 Walnut Way",                            phone: "(720) 555-0127" },
  "Sugar House":                       { address: "1334 Wilmington Way",                        phone: "(801) 555-0238" },
  "Albuquerque Uptown":                { address: "2751 Louisiana Way NE, Suite 12E",           phone: "(505) 555-0349" },
  // Midwest – open
  "Edwardsville":                      { address: "3107 Commerce Road",                         phone: "(618) 555-0127" },
  "Northbrook":                        { address: "1241 Willow Way, Unit G",                    phone: "(224) 555-0238" },
  "Creve Coeur":                       { address: "12847 Olive Way",                            phone: "(314) 555-0349" },
  // Pre-launch – California
  "Folsom Ranch":                      { address: "NWC Meadow Creek Blvd. & E Fairway St.",     phone: null },
  "Liberty Station":                   { address: "3140 Womble Way",                            phone: null },
  "Los Gatos":                         { address: "16412 Union Ave., Suite B-9",                phone: null },
  "Marina District":                   { address: "2214 Marina Blvd.",                          phone: null },
  "San Marcos":                        { address: "418 S. Crossroads Village Rd.",              phone: null },
  "Santa Clara Rivermark":             { address: "4218 Rivermark Way",                         phone: "(408) 555-0127" },
  // Pre-launch – Mountain West
  "Boulder Crossroads":                { address: "3500 Pearl Way, Unit 2100",                  phone: null },
  "Holladay":                          { address: "5124 S Highland Way",                        phone: null },
  "South Lake Union":                  { address: "1342 Denny Way, Suite 8",                    phone: null },
  // Pre-launch – Northeast
  "Westport":                          { address: "640 Post Road East",                         phone: null },
  "Belmont":                           { address: "78 Leonard Way",                             phone: null },
  "Marlton":                           { address: "628 Route 73 South, Suite C28",              phone: null },
  "Oakhurst":                          { address: "2041 NJ-35, Suite D4",                       phone: null },
  "Parsippany":                        { address: "1714 NJ-10, Suite #D-08",                    phone: null },
  "Latham":                            { address: "812 Loudon Way",                             phone: "(518) 555-0127" },
  "Main Line Wayne":                   { address: "717 W Lancaster Way",                        phone: null },
  "Northern Liberties":                { address: "168 West Girard Way",                        phone: "(215) 555-0238" },
  "Warrington":                        { address: "1921 Main Street, Unit 410",                 phone: null },
  "Tysons":                            { address: "1820 Boro Place, Suite 308",                 phone: null },
  "14th Street":                       { address: "2218 14th Street NW",                        phone: null },
  // Pre-launch – Southeast Florida
  "Boynton Beach":                     { address: "512 N Congress Way #215",                    phone: null },
  "Jacksonville – Pearl Square":       { address: "641 N Pearl Street",                         phone: null },
  "Kendall":                           { address: "9314 Mills Drive, Suite 412",                phone: null },
  "Lake Nona":                         { address: "6814 Lake Nona Blvd., Suite 280",            phone: null },
  "Lakewood Ranch":                    { address: "9218 Market Street",                         phone: null },
  "Naples":                            { address: "6814 Premier Way, Unit 218",                 phone: null },
  "Oakland Park":                      { address: "4128 N Federal Way",                         phone: null },
  "Pembroke Pines":                    { address: "16302 SW 7th St.",                           phone: "(954) 555-0127" },
  "Pinecrest":                         { address: "10412 South Dixie Way",                      phone: "(305) 555-0238" },
  "Port St. Lucie":                    { address: "11418 SW Discovery Way",                     phone: null },
  "Tallahassee":                       { address: "528 North Monroe Way",                       phone: "(850) 555-0349" },
  "Viera":                             { address: "3217 Sadore Way",                            phone: null },
  "Westchase":                         { address: "11423 Montague Way",                         phone: null },
  "Winter Garden":                     { address: "28 East Plant Street",                       phone: null },
  "World Golf Village":                { address: "218 Village Commons Drive, B-206",           phone: null },
  // Pre-launch – Southeast Georgia
  "Buford":                            { address: "3412 Buford Way, Suite 640",                 phone: null },
  "Dunwoody":                          { address: "6318 Chamblee Dunwoody Way, Suite 42B",      phone: null },
  "East Cobb":                         { address: "1518 Johnson Ferry Way",                     phone: null },
  // Pre-launch – Southeast Carolinas / TN
  "Durham":                            { address: "528 South Roxboro Way, Suite 240",           phone: "(984) 555-0127" },
  "Forest Acres":                      { address: "3218 Gervais Street, Suite 310",             phone: null },
  "Brentwood":                         { address: "317 Franklin Way",                           phone: "(615) 555-0238" },
  // Pre-launch – Texas
  "Austin – Arboretum":                { address: "11200 Research Boulevard, Suite #248",       phone: null },
  "District West":                     { address: "23418 FM 1093 Way",                          phone: null },
  "Flower Mound":                      { address: "7212 Long Prairie Way, Suite 840",           phone: "(972) 555-0127" },
  "Friendswood":                       { address: "218 Whispering Pines Way, Suite 218",        phone: null },
  "GTX":                               { address: "1528 W University Way",                      phone: null },
  "Sienna":                            { address: "11240 Highway 6",                            phone: "(832) 555-0238" },
  "Sugar Land":                        { address: "3018 Town Center Blvd N.",                   phone: null },
  "Uptown Dallas":                     { address: "3814 McKinney Ave., Suite 220",              phone: null },
  "Vintage Park":                      { address: "248 Vintage Park Blvd., Suite J",            phone: null },
  // Pre-launch – Midwest
  "Gold Coast":                        { address: "18-20 W. Maple Way",                         phone: null },
  "Lakeview":                          { address: "3518 N. Clark Street, 2-C",                  phone: null },
  "Naperville":                        { address: "2841 W 75th Street",                         phone: null },
  "Carmel":                            { address: "1213 W. Main Street, Suite 14",              phone: null },
  "Fishers":                           { address: "12517 East Union St., Suite 220",            phone: null },
  "West Des Moines":                   { address: "1124 Jordan Creek Pkwy., Suite D",           phone: null },
  "Overland Park":                     { address: "8214 W 161st St., Suite J-220",              phone: null },
  "Des Peres":                         { address: "1248 North Ballas Way",                      phone: "(314) 555-0451" },
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
    "Elara Whitmore", "Petra Caldwell", "Nora Langfield", "Mila Ashford",
    "Lyra Hartmore", "Isla Moorland", "Fern Prescott", "Demi Clifton",
    "Clara Brentmore", "Blythe Fairchild", "Anya Hollister", "Wren Blackwell",
    "Tess Harlow", "Sable Westbrook", "Rowan Callaway", "Piper Sinclair",
    "Opal Remington", "Nola Langley", "Maren Thornfield", "Linden Ellison",
    "Katia Whitfield", "June Caldmore", "Iris Hartwell", "Hazel Fieldmore",
  ];
  const gmPool = [
    "Aria Lockwood", "Luna Hensley", "Nova Clayfield", "Stella Clifford",
    "Cleo Moorland", "Sage Westfield", "Remi Holloway", "Quinn Brentmore",
    "Juno Callaway", "Vera Langmore", "Alba Ellington", "Zoe Hartfield",
    "Yara Pemberton", "Xena Whitfield", "Winona Lockwood", "Vivien Thornfield",
    "Uma Westfield", "Tara Harrington", "Sylvie Remington", "Suki Ashmore",
    "Sorrel Caldfield", "Rory Whitmore", "Reeva Hartfield", "Prue Langford",
    "Orla Prescott", "Niamh Clayford", "Maeve Brentmore", "Lola Hollander",
    "Kyra Whitwick", "Jules Landfield", "Ingrid Moorland", "Hana Blackmore",
    "Greta Hallford", "Flora Whitwell", "Esme Brentfield", "Dora Landmore",
    "Celeste Caldmore", "Bree Hartland", "Anais Ashmore", "Zuri Westmore",
    "Yael Moorfield", "Xara Langford", "Willa Whitfield", "Veda Caldmore",
    "Una Blackford", "Thea Hartmore", "Seren Langmore", "Rio Whitfield",
    "Quin Hallmore", "Peta Fieldmore", "Ona Brentford", "Noa Moormore",
    "Mira Landfield", "Leda Whitmore", "Kira Caldfield", "Jora Hartfield",
    "Ines Blackmore", "Hera Ashfield", "Gia Moorfield", "Fiona Langmore",
    "Elara Whitfield", "Demi Caldmore", "Clio Hartmore", "Blythe Fieldmore",
    "Aya Blackfield", "Zara Langfield", "Yuki Moormore", "Xanthe Whitmore",
    "Wren Caldfield", "Vera Hartfield", "Una Fieldmore", "Tova Blackmore",
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
      });
    }
  }

  // Seed staff for every open studio
  for (const sd of studioDefs.filter(s => s.status !== "pre-launch")) {
    const atRisk = sd.status === "at-risk";
    const isNew  = sd.status === "new";
    // Bigger/established markets get more instructors; new studios fewer; at-risk fewest
    const instrCount = atRisk ? 3 : isNew ? 4 : 6;
    const leadCount  = atRisk ? 1 : isNew ? 1 : 2;
    addStaff(sd.name, { instructors: instrCount, leads: leadCount, atRisk });
  }

  await db.instructor.createMany({ data: instrData as any });

  // ── INSTRUCTOR ID LOOKUPS (for linking reviews to specific instructors) ────
  const seededInstructors = await db.instructor.findMany({
    where: { role: "instructor" },
    select: { id: true, studioId: true, name: true },
  });
  const idByStudioAndName = new Map<string, string>();
  const studioInstructorIds: Record<string, string[]> = {};
  for (const r of seededInstructors) {
    idByStudioAndName.set(`${r.studioId}::${r.name}`, r.id);
  }
  for (const sd of studioDefs.filter(s => s.status !== "pre-launch")) {
    const sid = byName[sd.name];
    studioInstructorIds[sd.name] = seededInstructors.filter(r => r.studioId === sid).map(r => r.id);
  }

  function pickInstructorId(studioName: string): string | null {
    const ids = studioInstructorIds[studioName];
    if (!ids?.length) return null;
    return ids[Math.floor(Math.random() * ids.length)];
  }

  // ── MULTI-LOCATION INSTRUCTORS ──────────────────────────────────────────────
  // A small, realistic handful of instructors who teach at two nearby/same-city
  // studios. Each pair shares a `personKey` across their two Instructor rows so
  // the Instructor IP roster can merge their reviews/score across locations.
  const MULTI_LOCATION_PAIRS: { a: string; b: string }[] = [
    { a: "Sunset Harbour",    b: "Edgewater" },       // Miami Beach / Miami
    { a: "Downtown Miami",   b: "North Miami" },      // Miami
    { a: "Merrick Park",     b: "Coconut Grove" },    // Coral Gables / Coconut Grove
    { a: "Chelsea",          b: "Gramercy" },         // New York
    { a: "SoHo",             b: "NoHo" },             // New York
    { a: "Austin – Downtown", b: "Austin – South" },  // Austin
    { a: "Downtown Tampa",   b: "South Tampa" },      // Tampa
  ];

  for (let i = 0; i < MULTI_LOCATION_PAIRS.length; i++) {
    const { a, b } = MULTI_LOCATION_PAIRS[i];
    const namesAtA = studioInstructorNames[a];
    const idsAtA = studioInstructorIds[a];
    const studioIdB = byName[b];
    if (!namesAtA?.length || !idsAtA?.length || !studioIdB) continue;

    const sourceName = namesAtA[0];
    const sourceId = idsAtA[0];
    const personKey = `multi-location-${i}`;

    await db.instructor.update({ where: { id: sourceId }, data: { personKey } });
    const created = await db.instructor.create({
      data: {
        studioId: studioIdB,
        name: sourceName,
        role: "instructor",
        certificationStatus: "certified",
        lastEvalDate: new Date("2026-04-20"),
        personKey,
      },
    });

    studioInstructorIds[b]   = [...(studioInstructorIds[b] ?? []), created.id];
    studioInstructorNames[b] = [...(studioInstructorNames[b] ?? []), sourceName];
    idByStudioAndName.set(`${studioIdB}::${sourceName}`, created.id);
  }

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
    { author: "Christina B.", source: "google",   body: "Used to be my favorite studio but quality has slipped over the past few months. A lot of instructor turnover and some of the newer instructors aren't quite at the same level yet. Hoping it gets back to where it was." },
    { author: "Allison T.",   source: "classpass", body: "Hit or miss depending on the instructor. When you get a great one it's a 5-star experience, but lately the consistency just isn't there. The concept is great — execution needs some work." },
    { author: "Dana R.",      source: "google",   body: "The reformers are high quality and the workout is solid, but I've noticed the studio feels less personal lately. Classes seem more rushed and there's less attention to individual form corrections." },
    { author: "Kira W.",      source: "classpass", body: "Average experience for the price point. Some instructors are excellent, others are just okay. The studio is clean and well-equipped but I expect more personalization at this price." },
    { author: "Patricia F.", source: "google",    body: "The reformer quality and facility are genuinely excellent. But I've had two instructors who didn't offer any modifications for a small injury I mentioned. At this price point I expect better attention to individual needs." },
    { author: "Valerie H.",  source: "classpass", body: "Mixed feelings. The best classes here are legitimately 5 stars. But there's a significant gap between the senior and newer instructors. If you can specifically book the veterans, do — otherwise it's pretty average." },
    { author: "Sandra N.",   source: "google",    body: "Good not great. The equipment is pristine and the studio looks beautiful. But over the past couple of months the class experience has felt more transactional. Less of the community feel that made me sign up." },
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

    const o = studioIdx; // offset for picking different templates per studio
    const isAtRisk = sd.status === "at-risk";
    const isNew    = sd.status === "new";

    if (isNew) {
      const picks = [0, 1, 2, 3, 4, (o % 3 === 0 ? 5 : o % 3 === 1 ? 6 : 7)].slice(0, 5 + (o % 2));
      picks.forEach((pi, i) => {
        const t = NEW_STUDIO[pi % NEW_STUDIO.length];
        reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: t.source, author: t.author, rating: 5, body: t.body, reviewDate: daysAgo(8 + i * 12 + (o % 7)) });
      });
      const four = FOUR_STAR[(o + 2) % FOUR_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: "classpass", author: four.author, rating: 4, body: four.body, reviewDate: daysAgo(5 + (o % 8)) });
      const fourB = FOUR_STAR[(o + 5) % FOUR_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: "google", author: fourB.author, rating: 4, body: fourB.body, reviewDate: daysAgo(20 + (o % 10)) });

    } else if (isAtRisk) {
      const fivePick = FIVE_STAR[(o + 3) % FIVE_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: "google", author: fivePick.author, rating: 5, body: fivePick.body, reviewDate: daysAgo(90 + (o % 30)) });
      const fourPick = FOUR_STAR[(o + 1) % FOUR_STAR.length];
      // Always ensure ClassPass is present
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: "classpass", author: fourPick.author, rating: 4, body: fourPick.body, reviewDate: daysAgo(60 + (o % 20)) });
      const threeA = THREE_STAR[o % THREE_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: threeA.source, author: threeA.author, rating: 3, body: threeA.body, reviewDate: daysAgo(30 + (o % 15)) });
      const threeB = THREE_STAR[(o + 2) % THREE_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: threeB.source, author: threeB.author, rating: 3, body: threeB.body, reviewDate: daysAgo(18 + (o % 10)) });
      const threeC = THREE_STAR[(o + 4) % THREE_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: threeC.source, author: threeC.author, rating: 3, body: threeC.body, reviewDate: daysAgo(10 + (o % 8)) });
      const twoA = TWO_STAR[o % TWO_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: twoA.source, author: twoA.author, rating: 2, body: twoA.body, reviewDate: daysAgo(7 + (o % 6)) });
      if (o % 2 === 0) {
        const twoB = TWO_STAR[(o + 1) % TWO_STAR.length];
        reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: twoB.source, author: twoB.author, rating: 2, body: twoB.body, reviewDate: daysAgo(3 + (o % 4)) });
      }

    } else {
      const fivePicks = [o % FIVE_STAR.length, (o + 2) % FIVE_STAR.length, (o + 4) % FIVE_STAR.length, (o + 7) % FIVE_STAR.length, (o + 10) % FIVE_STAR.length, (o + 13) % FIVE_STAR.length];
      const dateBases = [60, 42, 30, 20, 10, 3];
      fivePicks.forEach((pi, i) => {
        const t = FIVE_STAR[pi];
        reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: t.source, author: t.author, rating: 5, body: t.body, reviewDate: daysAgo(dateBases[i] + (o % 8)) });
      });
      const fourA = FOUR_STAR[(o + o) % FOUR_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: "google", author: fourA.author, rating: 4, body: fourA.body, reviewDate: daysAgo(35 + (o % 12)) });
      const fourB = FOUR_STAR[(o + 3) % FOUR_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: "classpass", author: fourB.author, rating: 4, body: fourB.body, reviewDate: daysAgo(10 + (o % 9)) });
      const fourC = FOUR_STAR[(o + 6) % FOUR_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: fourC.source, author: fourC.author, rating: 4, body: fourC.body, reviewDate: daysAgo(22 + (o % 7)) });
      const three = THREE_STAR[o % THREE_STAR.length];
      reviewData.push({ studioId: id, instructorId: pickInstructorId(sd.name), source: three.source, author: three.author, rating: 3, body: three.body, reviewDate: daysAgo(55 + (o % 20)) });
    }
  });

  // Named reviews that mention specific instructors by first name
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
        instructorId: idByStudioAndName.get(`${id}::${names[i]}`) ?? pickInstructorId(sd.name),
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
    { product: "BODYARMOR Sport Water", category: "water",          unitPrice: 4,   baseUnits: 28 },
    { product: "Water Bottle",          category: "water",          unitPrice: 35,  baseUnits: 12 },
    { product: "Liquid IV Energy",      category: "energy_drinks",  unitPrice: 5,   baseUnits: 20 },
    { product: "PRIME Energy Drink",    category: "energy_drinks",  unitPrice: 4,   baseUnits: 24 },
    { product: "JETSET Tote Bag",       category: "merch",          unitPrice: 45,  baseUnits: 8  },
    { product: "JETSET Leggings",       category: "merch",          unitPrice: 95,  baseUnits: 5  },
    { product: "JETSET Sports Bra",     category: "merch",          unitPrice: 65,  baseUnits: 7  },
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
    // ── Retail ─────────────────────────────────────────────────────────────────
    { name: "Grip Socks – Small",       category: "retail",   reorderPoint: 20,  baseQty: 80  },
    { name: "Grip Socks – Medium",      category: "retail",   reorderPoint: 20,  baseQty: 100 },
    { name: "Grip Socks – Large",       category: "retail",   reorderPoint: 20,  baseQty: 60  },
    { name: "Water Bottles",            category: "retail",   reorderPoint: 10,  baseQty: 30  },
    { name: "Resistance Bands",         category: "retail",   reorderPoint: 10,  baseQty: 25  },
    { name: "BODYARMOR Sport Water",    category: "retail",   reorderPoint: 24,  baseQty: 72  },
    { name: "Liquid IV Packets",        category: "retail",   reorderPoint: 20,  baseQty: 60  },
    { name: "PRIME Energy Drink",       category: "retail",   reorderPoint: 24,  baseQty: 72  },
    { name: "JETSET Tote Bag",          category: "retail",   reorderPoint: 8,   baseQty: 20  },
    { name: "JETSET Leggings",          category: "retail",   reorderPoint: 6,   baseQty: 18  },
    { name: "JETSET Sports Bra",        category: "retail",   reorderPoint: 6,   baseQty: 16  },
    { name: "JETSET Tank Top",          category: "retail",   reorderPoint: 8,   baseQty: 22  },
    { name: "JETSET Zip Hoodie",        category: "retail",   reorderPoint: 5,   baseQty: 14  },
    { name: "JETSET Headband",          category: "retail",   reorderPoint: 10,  baseQty: 30  },
    { name: "Foam Roller",              category: "retail",   reorderPoint: 4,   baseQty: 10  },
    // ── Supplies ───────────────────────────────────────────────────────────────
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

  const open = studioDefs.filter(s => s.status !== "pre-launch").length;
  const pre  = studioDefs.filter(s => s.status === "pre-launch").length;
  console.log(`✓ Seeded ${studioDefs.length} studios (${open} open · ${pre} pre-launch), ${allMetrics.length} weekly metrics, ${instrData.length} instructors, 11 anomalies, ${reviewData.length} reviews, ${classMetricData.length} class metrics, ${operationsData.length} operations, ${salesData.length} sales records, ${inventoryData.length} inventory items`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
