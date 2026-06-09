import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  const { id, stage } = await req.json() as { id: string; stage: string };
  await db.franchiseLead.update({
    where: { id },
    data: { stage, stageEnteredAt: new Date() },
  });
  return Response.json({ ok: true });
}
