const GEMINI_MODEL = "gemini-2.5-flash";

interface DigestPayload {
  weekLabel: string;
  totalStudios: number;
  openStudios: number;
  healthyStudios: number;
  atRiskStudios: number;
  newStudios: number;
  preLaunchStudios: number;
  totalMembers: number;
  memberDelta: string | null;
  avgOccupancy: number;
  occupancyDelta: string | null;
  totalRevenue: number;
  revenueDelta: string | null;
  topStudios: { name: string; city: string; revenue: number }[];
  atRiskNames: string[];
  activeAlerts: number;
  criticalAlerts: number;
  alertSummaries: string[];
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return new Response("GEMINI_API_KEY not configured", { status: 501 });
  }

  const payload = await req.json() as DigestPayload;

  const fmt    = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
  const fmtUsd = (n: number) => `$${fmt(n)}`;
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

  const prompt = `You are the intelligence layer for JetSet Modern Pilates, a premium boutique franchise.

Weekly network snapshot (${payload.weekLabel}):
- Network: ${payload.totalStudios} total studios (${payload.openStudios} open, ${payload.healthyStudios} healthy, ${payload.atRiskStudios} at-risk, ${payload.newStudios} new, ${payload.preLaunchStudios} pre-launch)
- Members: ${fmt(payload.totalMembers)} active${payload.memberDelta ? ` (${payload.memberDelta}% WoW)` : ""}
- Class fill rate: ${fmtPct(payload.avgOccupancy)}${payload.occupancyDelta ? ` (${payload.occupancyDelta}% WoW)` : ""}
- Weekly revenue: ${fmtUsd(payload.totalRevenue)}${payload.revenueDelta ? ` (${payload.revenueDelta}% WoW)` : ""}
- Top revenue studios: ${payload.topStudios.map((s) => `${s.name}, ${s.city} (${fmtUsd(s.revenue)})`).join(" · ")}
- At-risk studios: ${payload.atRiskNames.length > 0 ? payload.atRiskNames.join(", ") : "None"}
- Active alerts: ${payload.activeAlerts} (${payload.criticalAlerts} critical)
${payload.alertSummaries.length > 0 ? `- Top alerts: ${payload.alertSummaries.slice(0, 3).map((s) => s.slice(0, 100)).join(" | ")}` : ""}

Write a concise 3-paragraph executive briefing for JetSet HQ leadership. Use specific numbers. Be direct and data-driven.
Paragraph 1: Overall network health — what's working and what's the headline trend.
Paragraph 2: Top risks this week — what requires immediate attention and specific recommended actions.
Paragraph 3: One forward-looking observation about growth, pipeline, or an emerging opportunity.
No headers. No bullet points. Tone: professional, actionable, confident.`;

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
          } catch { /* skip malformed */ }
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
