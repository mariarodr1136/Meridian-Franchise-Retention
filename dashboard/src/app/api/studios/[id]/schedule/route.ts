import { db } from "@/lib/db";
import { fetchStudioSchedule } from "@/lib/schedule";
import type { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/studios/[id]/schedule">
) {
  const { id } = await ctx.params;
  const weekOffset = parseInt(req.nextUrl.searchParams.get("weekOffset") ?? "0", 10);

  const studio = await db.studio.findUnique({
    where: { id },
    select: { name: true, state: true },
  });
  if (!studio) return Response.json([], { status: 404 });

  const schedule = await fetchStudioSchedule(studio.name, studio.state, weekOffset);
  return Response.json(schedule);
}
