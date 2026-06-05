export type RiskLevel = "high" | "medium" | "low";

export interface ChurnMember {
  id: string;
  name: string;
  studioName: string;
  studioCity: string;
  studioStatus: string;
  membershipTier: "unlimited" | "12-class monthly" | "8-class monthly" | "4-class monthly";
  membershipAgeDays: number;
  daysSinceLastVisit: number;
  visitsLast30d: number;
  visitsPrev30d: number;
  noShowRate: number;
  churnProbability: number;
  riskScore: number;
  riskLevel: RiskLevel;
  monthlyValue: number;
  topFactors: string[];
  suggestedAction: string;
}

export interface ChurnSummary {
  totalAnalyzed: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  revenueAtRisk: number;
}

export interface ChurnPredictions {
  generatedAt: string;
  modelAUC: number;
  summary: ChurnSummary;
  members: ChurnMember[];
}

export interface StudioRiskProfile {
  studioName: string;
  studioCity: string;
  studioStatus: string;
  totalMembers: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  revenueAtRisk: number;
  topMember: ChurnMember | null;
}
