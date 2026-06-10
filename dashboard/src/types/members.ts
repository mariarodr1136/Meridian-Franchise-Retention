export type MemberStatus = "active" | "cancelled";
export type MembershipTier = "unlimited" | "12-class monthly" | "8-class monthly" | "4-class monthly";

export interface StudioMember {
  id: string;
  name: string;
  membershipTier: MembershipTier;
  membershipAgeDays: number;
  status: MemberStatus;
  cancelledDaysAgo?: number;
  daysSinceLastVisit: number;
  visitsLast30d: number;
  monthlyValue: number;
}
