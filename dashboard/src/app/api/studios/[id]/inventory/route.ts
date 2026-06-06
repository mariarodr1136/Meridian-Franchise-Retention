import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/studios/[id]/inventory">
) {
  const { id } = await ctx.params;
  const items = await db.inventoryItem.findMany({
    where: { studioId: id },
    orderBy: [{ month: "desc" }, { category: "asc" }, { name: "asc" }],
  });

  return Response.json(
    items.map((i) => ({ ...i, month: i.month.toISOString(), updatedAt: i.updatedAt.toISOString(), createdAt: i.createdAt.toISOString() }))
  );
}

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/studios/[id]/inventory">
) {
  const { id } = await ctx.params;
  const body = await req.json() as {
    itemId: string;
    openingQty?: number;
    receivedQty?: number;
    usedQty?: number;
    closingQty?: number;
    reorderPoint?: number;
  };

  const data: Record<string, unknown> = {};
  const fields = ["openingQty", "receivedQty", "usedQty", "closingQty", "reorderPoint"] as const;
  for (const f of fields) {
    if (f in body) data[f] = body[f];
  }

  const item = await db.inventoryItem.update({
    where: { id: body.itemId, studioId: id },
    data,
  });

  return Response.json({ id: item.id });
}
