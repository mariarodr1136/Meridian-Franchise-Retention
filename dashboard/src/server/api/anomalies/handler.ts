import { db } from "@/lib/db";

export async function GET() {
  const anomalies = await db.anomaly.findMany({
    where: { resolved: false },
    include: { studio: { select: { name: true, city: true } } },
    orderBy: [
      { severity: "asc" },
      { generatedAt: "desc" },
    ],
  });

  const severityOrder = { high: 0, medium: 1, low: 2 };

  const sorted = anomalies.sort((a, b) =>
    (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) -
    (severityOrder[b.severity as keyof typeof severityOrder] ?? 3)
  );

  return Response.json(
    sorted.map((a) => ({
      id: a.id,
      studioId: a.studioId,
      studioName: a.studio ? `${a.studio.name} · ${a.studio.city}` : null,
      generatedAt: a.generatedAt.toISOString(),
      summary: a.summary,
      severity: a.severity,
      category: a.category,
      resolved: a.resolved,
    }))
  );
}
