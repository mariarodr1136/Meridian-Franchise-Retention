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
