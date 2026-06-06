import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/studios/[id]/sales">
) {
  const { id } = await ctx.params;
  const records = await db.salesRecord.findMany({
    where: { studioId: id },
    orderBy: { month: "desc" },
  });

  return Response.json(
    records.map((r) => ({ ...r, month: r.month.toISOString(), createdAt: r.createdAt.toISOString() }))
  );
}
