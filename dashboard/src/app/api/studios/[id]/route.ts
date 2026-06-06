import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/studios/[id]">
) {
  const { id } = await ctx.params;

  const studio = await db.studio.findUnique({
    where: { id },
    include: {
      metrics: { orderBy: { weekOf: "desc" } },
      instructors: { orderBy: { name: "asc" } },
      anomalies: {
        where: { resolved: false },
        orderBy: { generatedAt: "desc" },
      },
    },
  });

  if (!studio) {
    return Response.json({ error: "Studio not found" }, { status: 404 });
  }

  return Response.json({
    id: studio.id,
    name: studio.name,
    city: studio.city,
    state: studio.state,
    country: studio.country,
    region: studio.region,
    status: studio.status,
    openedAt: studio.openedAt?.toISOString() ?? null,
    franchiseeName: studio.franchiseeName,
    address: studio.address,
    phone: studio.phone,
    email: studio.email,
    latestMetric: studio.metrics[0]
      ? { ...studio.metrics[0], weekOf: studio.metrics[0].weekOf.toISOString() }
      : null,
    metrics: studio.metrics.map((m) => ({ ...m, weekOf: m.weekOf.toISOString() })),
    instructors: studio.instructors.map((i) => ({
      ...i,
      lastEvalDate: i.lastEvalDate?.toISOString() ?? null,
    })),
    anomalies: studio.anomalies.map((a) => ({
      ...a,
      generatedAt: a.generatedAt.toISOString(),
    })),
  });
}

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/studios/[id]">
) {
  const { id } = await ctx.params;
  const body = await req.json() as Record<string, unknown>;

  const allowed = ["name", "address", "phone", "email", "franchiseeName", "status"] as const;
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const updated = await db.studio.update({ where: { id }, data });
  return Response.json({ id: updated.id, name: updated.name });
}
