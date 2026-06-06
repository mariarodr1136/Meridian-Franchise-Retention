import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/studios/[id]/operations">
) {
  const { id } = await ctx.params;
  const ops = await db.studioOperations.findUnique({ where: { studioId: id } });
  if (!ops) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({
    ...ops,
    leaseExpiresAt:        ops.leaseExpiresAt?.toISOString() ?? null,
    hvacContractExpiresAt: ops.hvacContractExpiresAt?.toISOString() ?? null,
    updatedAt:             ops.updatedAt.toISOString(),
    createdAt:             ops.createdAt.toISOString(),
  });
}

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/studios/[id]/operations">
) {
  const { id } = await ctx.params;
  const body = await req.json() as Record<string, unknown>;

  const allowed = [
    "leaseExpiresAt", "landlordName", "landlordPhone", "landlordEmail",
    "alarmCompany", "alarmCode", "alarmPhone",
    "hvacCompany", "hvacPhone", "hvacContractExpiresAt",
    "electricianName", "electricianPhone",
    "internetProvider", "wifiPassword", "notes",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      if ((key === "leaseExpiresAt" || key === "hvacContractExpiresAt") && body[key]) {
        data[key] = new Date(body[key] as string);
      } else {
        data[key] = body[key];
      }
    }
  }

  const ops = await db.studioOperations.upsert({
    where: { studioId: id },
    create: { studioId: id, ...data },
    update: data,
  });

  return Response.json({ id: ops.id });
}
