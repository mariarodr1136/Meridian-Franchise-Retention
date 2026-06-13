import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function fetchAlerts() {
  return db.anomaly.findMany({
    where: { resolved: false },
    select: {
      id: true,
      severity: true,
      summary: true,
      category: true,
      studioId: true,
      generatedAt: true,
      studio: { select: { name: true, city: true } },
    },
    orderBy: [{ severity: "asc" }, { generatedAt: "desc" }],
  });
}

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const { signal } = request;

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Send heartbeat to establish connection
      send("heartbeat", { ts: Date.now() });

      let lastAlerts = await fetchAlerts();
      send("init", {
        count: lastAlerts.length,
        ids: lastAlerts.map((a) => a.id),
      });

      // Poll every 4 seconds; push events when alert set changes
      while (!signal.aborted) {
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 4000);
          signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
        });
        if (signal.aborted) break;

        const current = await fetchAlerts();
        const lastIds = new Set(lastAlerts.map((a) => a.id));
        const currentIds = new Set(current.map((a) => a.id));

        const added   = current.filter((a) => !lastIds.has(a.id));
        const removed = lastAlerts.filter((a) => !currentIds.has(a.id));

        if (added.length > 0 || removed.length > 0) {
          send("update", {
            count: current.length,
            delta: current.length - lastAlerts.length,
            added: added.map((a) => ({
              id: a.id,
              severity: a.severity,
              summary: a.summary,
              category: a.category,
              studioId: a.studioId,
              studioName: a.studio ? `${a.studio.name} · ${a.studio.city}` : null,
              generatedAt: a.generatedAt.toISOString(),
            })),
            removedIds: removed.map((a) => a.id),
          });
          lastAlerts = current;
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
