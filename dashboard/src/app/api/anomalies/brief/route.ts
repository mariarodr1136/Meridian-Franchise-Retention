import { db } from "@/lib/db";
import OpenAI from "openai";

export async function POST() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return new Response("OPENAI_API_KEY not configured", { status: 501 });
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
  const atRisk = studios.filter((s) => s.status === "at-risk");
  const highAlerts = anomalies.filter((a) => a.severity === "high");

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

  const client = new OpenAI({ apiKey: key });
  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    stream: true,
    max_tokens: 320,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
  });
}
