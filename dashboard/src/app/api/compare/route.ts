import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const a = searchParams.get("a");
  const b = searchParams.get("b");

  if (!a || !b) return Response.json({ error: "a and b required" }, { status: 400 });

  const studios = await db.studio.findMany({
    where: { id: { in: [a, b] } },
    include: {
      metrics: { orderBy: { weekOf: "desc" }, take: 13 },
    },
  });

  return Response.json(
    studios.map((s) => ({
      id:            s.id,
      name:          s.name,
      city:          s.city,
      state:         s.state,
      status:        s.status,
      openedAt:      s.openedAt?.toISOString() ?? null,
      metrics:       s.metrics.map((m) => ({
        weekOf:            m.weekOf.toISOString(),
        weeklyRevenue:     m.weeklyRevenue,
        activeMemberships: m.activeMemberships,
        classFillRate:     m.classFillRate,
        weeklyChurn:       m.weeklyChurn,
        memberBookings:    m.memberBookings,
        classPackBookings: m.classPackBookings,
        classPassBookings: m.classPassBookings,
      })),
    }))
  );
}
