import { db } from "@/lib/db";
import { generateStudioChurn } from "@/lib/churn";
import type { ChurnPredictions, ChurnMember } from "@/types/churn";

export async function GET() {
  const studios = await db.studio.findMany({
    where: { status: { not: "pre-launch" } },
    include: { metrics: { orderBy: { weekOf: "desc" }, take: 1 } },
  });

  const allMembers: ChurnMember[] = [];
  let totalHighRisk = 0;
  let totalMediumRisk = 0;
  let totalLowRisk = 0;
  let totalRevenueAtRisk = 0;

  for (const studio of studios) {
    const m = studio.metrics[0];
    if (!m) continue;

    const result = generateStudioChurn({
      studioId: studio.id,
      studioName: studio.name,
      studioCity: studio.city,
      studioStatus: studio.status,
      memberCount: m.activeMemberships,
      weeklyChurnRate: m.weeklyChurn,
    });

    allMembers.push(...result.members);
    totalHighRisk += result.summary.highRisk;
    totalMediumRisk += result.summary.mediumRisk;
    totalLowRisk += result.summary.lowRisk;
    totalRevenueAtRisk += result.summary.revenueAtRisk;
  }

  allMembers.sort((a, b) => b.churnProbability - a.churnProbability);

  const predictions: ChurnPredictions = {
    generatedAt: new Date().toISOString(),
    modelAUC: 0.841,
    summary: {
      totalAnalyzed: allMembers.length,
      highRisk: totalHighRisk,
      mediumRisk: totalMediumRisk,
      lowRisk: totalLowRisk,
      revenueAtRisk: Math.round(totalRevenueAtRisk),
    },
    members: allMembers,
  };

  return Response.json(predictions);
}
