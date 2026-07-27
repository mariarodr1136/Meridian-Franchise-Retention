import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; iid: string }> }
) {
  const { iid } = await ctx.params;
  const body = await req.json() as { name?: string; role?: string; email?: string | null; phone?: string | null; lastEvalDate?: string | null };

  const updated = await db.instructor.update({
    where: { id: iid },
    data: {
      ...(body.name  !== undefined && { name: body.name.trim() }),
      ...(body.role  !== undefined && { role: body.role }),
      ...("email" in body && { email: body.email ?? null }),
      ...("phone" in body && { phone: body.phone ?? null }),
      ...("lastEvalDate" in body && {
        lastEvalDate: body.lastEvalDate ? new Date(body.lastEvalDate) : null,
      }),
    },
  });

  return Response.json({
    ...updated,
    lastEvalDate: updated.lastEvalDate?.toISOString() ?? null,
  });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; iid: string }> }
) {
  const { iid } = await ctx.params;
  await db.instructor.delete({ where: { id: iid } });
  return Response.json({ ok: true });
}
