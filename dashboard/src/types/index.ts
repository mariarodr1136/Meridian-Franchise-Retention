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
