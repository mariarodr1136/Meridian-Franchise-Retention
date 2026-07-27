import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
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
