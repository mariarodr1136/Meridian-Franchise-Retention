import { db } from "@/lib/db";

const GEMINI_MODEL = "gemini-2.5-flash";

async function streamGemini(key: string, prompt: string): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${key}&alt=sse`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 700, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Gemini request failed", { status: 502 });
  }

  const encoder = new TextEncoder();
  const reader  = upstream.body.pipeThrough(new TextDecoderStream()).getReader();

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = "";

      function flush() {
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const chunk = JSON.parse(json);
            const text: string = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          } catch { /* skip malformed SSE lines */ }
        }
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) { flush(); break; }
        buffer += value;
        flush();
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
  });
}

export async function POST() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return new Response("GEMINI_API_KEY not configured", { status: 501 });
  }

  const [studios, anomalies] = await Promise.all([
    db.studio.findMany({
      where: { status: { not: "pre-launch" } },
      include: { metrics: { orderBy: { weekOf: "desc" }, take: 1 } },
    }),
    db.anomaly.findMany({
      where: { resolved: false },
      include: { studio: { select: { name: true, city: true } } },
      orderBy: [{ severity: "asc" }, { generatedAt: "desc" }],
    }),
  ]);

  const totalMembers = studios.reduce((s, st) => s + (st.metrics[0]?.activeMemberships ?? 0), 0);
  const avgFill = studios.length
    ? studios.reduce((s, st) => s + (st.metrics[0]?.classFillRate ?? 0), 0) / studios.length
    : 0;
  const totalRevenue = studios.reduce((s, st) => s + (st.metrics[0]?.weeklyRevenue ?? 0), 0);
  const atRisk       = studios.filter((s) => s.status === "at-risk");
  const highAlerts   = anomalies.filter((a) => a.severity === "high");

  const prompt = `You are the AI intelligence layer for JetSet Modern Pilates, a premium boutique fitness franchise.

Network snapshot (this week):
- Open studios: ${studios.length}
- Total active members: ${totalMembers.toLocaleString()}
- Network avg class fill rate: ${(avgFill * 100).toFixed(1)}%
- Total weekly revenue: $${Math.round(totalRevenue).toLocaleString()}
- At-risk studios (${atRisk.length}): ${atRisk.map((s) => `${s.name} (${s.city})`).join(", ") || "none"}
- Active alerts (${anomalies.length} total, ${highAlerts.length} critical):
${anomalies.slice(0, 8).map((a) => `  • [${a.severity.toUpperCase()}] ${a.studio ? a.studio.name + " · " + a.studio.city : "Network"}: ${a.summary.slice(0, 120)}`).join("\n")}

Write a concise 3-paragraph Network Intelligence Briefing for HQ leadership. Paragraph 1: overall network health. Paragraph 2: top risks and recommended actions. Paragraph 3: one forward-looking observation. Be specific, data-driven, and direct. No headers, no bullet points.`;

  return streamGemini(key, prompt);
}
