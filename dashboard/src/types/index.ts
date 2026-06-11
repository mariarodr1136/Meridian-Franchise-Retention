export type StudioStatus = "healthy" | "at-risk" | "new" | "pre-launch";
export type AnomalySeverity = "high" | "medium" | "low";
export type CertificationStatus = "certified" | "pending" | "expired";
export type StaffRole = "director_of_operations" | "general_manager" | "studio_lead" | "instructor";

export interface Studio {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  region: string;
  status: StudioStatus;
  openedAt: string | null;
  franchiseeName: string;
  address: string | null;
  phone: string | null;
  email?: string | null;
}

export interface StudioMetric {
  id: string;
  studioId: string;
  weekOf: string;
  classFillRate: number;
  activeMemberships: number;
  weeklyChurn: number;
  weeklyRevenue: number;
  presalesPipelineCount: number;
  memberBookings: number;
  classPackBookings: number;
  classPassBookings: number;
}

export interface Instructor {
  id: string;
  studioId: string;
  name: string;
  role: StaffRole;
  certificationStatus: CertificationStatus;
  lastEvalDate: string | null;
  performanceScore: number | null;
}

export interface ClassMetric {
  id: string;
  studioId: string;
  dayOfWeek: number;
  timeSlot: string;
  weekOf: string;
  capacity: number;
  spotsFilled: number;
  memberBookings: number;
  classPackBookings: number;
  classPassBookings: number;
}

export interface Review {
  id: string;
  studioId: string;
  source: "google" | "classpass";
  author: string;
  rating: number;
  body: string;
  reviewDate: string;
}

export interface Anomaly {
  id: string;
  studioId: string | null;
  studioName?: string | null;
  generatedAt: string;
  summary: string;
  severity: AnomalySeverity;
  category: string;
  resolved: boolean;
}

export interface StudioWithLatestMetric extends Studio {
  latestMetric: StudioMetric | null;
}

export interface StudioDetail extends Studio {
  latestMetric: StudioMetric | null;
  metrics: StudioMetric[];
  instructors: Instructor[];
  anomalies: Anomaly[];
  reviews: Review[];
}

export interface SlotStat {
  dayOfWeek: number;
  timeSlot: string;
  avgFillRate: number;
  avgMemberPct: number;
  avgPackPct: number;
  avgPassPct: number;
  weekCount: number;
}

export interface InstructorStat {
  name: string;
  classCount: number;
  avgFillRate: number;
  classes: string[];
}

export interface NavSection {
  id: string;
  label: string;
}

export interface NetworkStats {
  totalStudios: number;
  openStudios: number;
  preLaunchStudios: number;
  atRiskStudios: number;
  totalActiveMemberships: number;
  networkOccupancy: number;
  totalWeeklyRevenue: number;
  unresolvedAnomalies: number;
}

export interface StudioOperations {
  id: string;
  studioId: string;
  leaseExpiresAt: string | null;
  landlordName: string | null;
  landlordPhone: string | null;
  landlordEmail: string | null;
  alarmCompany: string | null;
  alarmCode: string | null;
  alarmPhone: string | null;
  hvacCompany: string | null;
  hvacPhone: string | null;
  hvacContractExpiresAt: string | null;
  electricianName: string | null;
  electricianPhone: string | null;
  internetProvider: string | null;
  wifiPassword: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface SalesRecord {
  id: string;
  studioId: string;
  month: string;
  category: string;
  product: string;
  unitsSold: number;
  revenue: number;
}

export interface InventoryItem {
  id: string;
  studioId: string;
  month: string;
  name: string;
  category: string;
  openingQty: number;
  receivedQty: number;
  usedQty: number;
  closingQty: number;
  reorderPoint: number;
  updatedAt: string;
}
