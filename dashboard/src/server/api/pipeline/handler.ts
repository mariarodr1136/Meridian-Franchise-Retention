import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  const body = await req.json() as {
    id: string;
    stage?: string;
    docsComplete?: boolean;
    leaseComplete?: boolean;
    trainingBooked?: boolean;
  };
  const { id, stage, ...rest } = body;

  const data: Record<string, unknown> = { ...rest };
  if (stage !== undefined) {
    data.stage = stage;
    data.stageEnteredAt = new Date();
  }

  await db.franchiseLead.update({ where: { id }, data });
  return Response.json({ ok: true });
}

export async function POST(req: Request) {
  const body = await req.json() as {
    franchiseeName: string;
    market: string;
    state?: string;
    assignedTo: string;
    stage?: string;
    territoryType?: string;
    expectedOpenDate?: string;
    notes?: string;
  };

  const created = await db.franchiseLead.create({
    data: {
      franchiseeName: body.franchiseeName,
      market: body.market,
      state: body.state,
      assignedTo: body.assignedTo,
      stage: body.stage ?? "Discovery",
      territoryType: body.territoryType ?? "suburban",
      expectedOpenDate: body.expectedOpenDate ? new Date(body.expectedOpenDate) : null,
      notes: body.notes,
    },
  });

  return Response.json({
    lead: {
      id: created.id,
      franchiseeName: created.franchiseeName,
      market: created.market,
      state: created.state ?? "",
      stage: created.stage,
      stageEnteredAt: created.stageEnteredAt.toISOString(),
      expectedOpenDate: created.expectedOpenDate?.toISOString() ?? null,
      territoryType: created.territoryType,
      notes: created.notes ?? null,
      docsComplete: created.docsComplete,
      leaseComplete: created.leaseComplete,
      trainingBooked: created.trainingBooked,
      assignedTo: created.assignedTo,
    },
  });
}
