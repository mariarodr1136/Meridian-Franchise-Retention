import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/studios/[id]/instructors">
) {
  const { id } = await ctx.params;
  const body = await req.json() as { name: string; role: string; email?: string | null; phone?: string | null; lastEvalDate?: string | null };

  const instructor = await db.instructor.create({
    data: {
      studioId: id,
      name: body.name.trim(),
      role: body.role,
      certificationStatus: "certified",
      email: body.email ?? null,
      phone: body.phone ?? null,
      lastEvalDate: body.lastEvalDate ? new Date(body.lastEvalDate) : null,
    },
  });

  return Response.json({
    ...instructor,
    lastEvalDate: instructor.lastEvalDate?.toISOString() ?? null,
  });
}
