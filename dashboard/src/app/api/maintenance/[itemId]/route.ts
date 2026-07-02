import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const body = await req.json();

  const resolving = body.status === "resolved";

  const item = await db.maintenanceItem.update({
    where: { id: itemId },
    data: {
      status:     body.status,
      resolvedAt: resolving ? new Date() : null,
      notes:      body.notes !== undefined ? body.notes : undefined,
    },
  });

  return Response.json({
    id:          item.id,
    studioId:    item.studioId,
    reportedAt:  item.reportedAt.toISOString(),
    category:    item.category,
    equipment:   item.equipment,
    description: item.description,
    priority:    item.priority,
    status:      item.status,
    resolvedAt:  item.resolvedAt?.toISOString() ?? null,
    notes:       item.notes,
  });
}
