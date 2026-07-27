import type { NextRequest } from "next/server";

import * as h0 from "@/server/api/anomalies/handler";
import * as h1 from "@/server/api/churn/handler";
import * as h2 from "@/server/api/compare/handler";
import * as h3 from "@/server/api/health/handler";
import * as h4 from "@/server/api/instructors/handler";
import * as h5 from "@/server/api/pipeline/handler";
import * as h6 from "@/server/api/search/handler";
import * as h7 from "@/server/api/studios/handler";
import * as h8 from "@/server/api/alerts/stream/handler";
import * as h9 from "@/server/api/anomalies/brief/handler";
import * as h10 from "@/server/api/anomalies/generate/handler";
import * as h11 from "@/server/api/digest/summary/handler";
import * as h12 from "@/server/api/anomalies/[id]/handler";
import * as h13 from "@/server/api/maintenance/[itemId]/handler";
import * as h14 from "@/server/api/studios/[id]/handler";
import * as h15 from "@/server/api/studios/[id]/instructors/handler";
import * as h16 from "@/server/api/studios/[id]/inventory/handler";
import * as h17 from "@/server/api/studios/[id]/maintenance/handler";
import * as h18 from "@/server/api/studios/[id]/operations/handler";
import * as h19 from "@/server/api/studios/[id]/sales/handler";
import * as h20 from "@/server/api/studios/[id]/schedule/handler";
import * as h21 from "@/server/api/studios/[id]/instructors/[iid]/handler";

// All API routes are dynamic; the SSE stream in particular must not be cached.
export const dynamic = "force-dynamic";

// Every API route is served from this single catch-all. Next.js emits one
// serverless function per route file, and the Hobby plan caps a deployment at
// 12 — the individual route files live in src/server/api and are dispatched
// here instead. URLs are unchanged.

type Handler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<Response> | Response;

type Handlers = Record<string, Handler | undefined>;

const routes: { segments: string[]; mod: Handlers }[] = [
  { segments: ["anomalies"], mod: h0 as unknown as Handlers },
  { segments: ["churn"], mod: h1 as unknown as Handlers },
  { segments: ["compare"], mod: h2 as unknown as Handlers },
  { segments: ["health"], mod: h3 as unknown as Handlers },
  { segments: ["instructors"], mod: h4 as unknown as Handlers },
  { segments: ["pipeline"], mod: h5 as unknown as Handlers },
  { segments: ["search"], mod: h6 as unknown as Handlers },
  { segments: ["studios"], mod: h7 as unknown as Handlers },
  { segments: ["alerts","stream"], mod: h8 as unknown as Handlers },
  { segments: ["anomalies","brief"], mod: h9 as unknown as Handlers },
  { segments: ["anomalies","generate"], mod: h10 as unknown as Handlers },
  { segments: ["digest","summary"], mod: h11 as unknown as Handlers },
  { segments: ["anomalies","[id]"], mod: h12 as unknown as Handlers },
  { segments: ["maintenance","[itemId]"], mod: h13 as unknown as Handlers },
  { segments: ["studios","[id]"], mod: h14 as unknown as Handlers },
  { segments: ["studios","[id]","instructors"], mod: h15 as unknown as Handlers },
  { segments: ["studios","[id]","inventory"], mod: h16 as unknown as Handlers },
  { segments: ["studios","[id]","maintenance"], mod: h17 as unknown as Handlers },
  { segments: ["studios","[id]","operations"], mod: h18 as unknown as Handlers },
  { segments: ["studios","[id]","sales"], mod: h19 as unknown as Handlers },
  { segments: ["studios","[id]","schedule"], mod: h20 as unknown as Handlers },
  { segments: ["studios","[id]","instructors","[iid]"], mod: h21 as unknown as Handlers },
];

function match(path: string[]) {
  for (const route of routes) {
    if (route.segments.length !== path.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    for (let i = 0; i < route.segments.length; i++) {
      const seg = route.segments[i];
      if (seg.startsWith("[")) params[seg.slice(1, -1)] = decodeURIComponent(path[i]);
      else if (seg !== path[i]) { ok = false; break; }
    }
    if (ok) return { mod: route.mod, params };
  }
  return null;
}

async function dispatch(
  req: NextRequest,
  ctx: { params: Promise<{ segments?: string[] }> },
  method: string
): Promise<Response> {
  const { segments = [] } = await ctx.params;
  const hit = match(segments);
  if (!hit) return Response.json({ error: "Not found" }, { status: 404 });

  const handler = hit.mod[method];
  if (!handler) return Response.json({ error: "Method not allowed" }, { status: 405 });

  return handler(req, { params: Promise.resolve(hit.params) });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ segments?: string[] }> }
): Promise<Response> {
  return dispatch(req, ctx, "GET");
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ segments?: string[] }> }
): Promise<Response> {
  return dispatch(req, ctx, "POST");
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ segments?: string[] }> }
): Promise<Response> {
  return dispatch(req, ctx, "PUT");
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ segments?: string[] }> }
): Promise<Response> {
  return dispatch(req, ctx, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ segments?: string[] }> }
): Promise<Response> {
  return dispatch(req, ctx, "DELETE");
}
