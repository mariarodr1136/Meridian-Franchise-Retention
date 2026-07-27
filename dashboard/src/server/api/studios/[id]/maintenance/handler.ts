import { db } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const items = await db.maintenanceItem.findMany({
    where: { studioId: id },
    orderBy: [{ status: "asc" }, { priority: "asc" }, { reportedAt: "desc" }],
  });

  return Response.json(items.map((item) => ({
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
  })));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const item = await db.maintenanceItem.create({
    data: {
      studioId:    id,
      category:    body.category,
      equipment:   body.equipment || null,
      description: body.description,
      priority:    body.priority ?? "medium",
      status:      "open",
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
    resolvedAt:  null,
    notes:       item.notes,
  }, { status: 201 });
}
