import { db } from "@/lib/db";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.anomaly.update({ where: { id }, data: { resolved: true } });
  return Response.json({ ok: true });
}
