import { db } from "@/lib/db";

export async function GET() {
  const studios = await db.studio.findMany({
    include: {
      metrics: {
        orderBy: { weekOf: "desc" },
        take: 1,
      },
    },
    orderBy: [{ region: "asc" }, { name: "asc" }],
  });

  const result = studios.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    state: s.state,
    country: s.country,
    region: s.region,
    status: s.status,
    openedAt: s.openedAt?.toISOString() ?? null,
    franchiseeName: s.franchiseeName,
    latestMetric: s.metrics[0]
      ? {
          id: s.metrics[0].id,
          studioId: s.metrics[0].studioId,
          weekOf: s.metrics[0].weekOf.toISOString(),
          classFillRate: s.metrics[0].classFillRate,
          activeMemberships: s.metrics[0].activeMemberships,
          weeklyChurn: s.metrics[0].weeklyChurn,
          weeklyRevenue: s.metrics[0].weeklyRevenue,
          presalesPipelineCount: s.metrics[0].presalesPipelineCount,
        }
      : null,
  }));

  return Response.json(result);
}
