import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { AlertsGrid } from "@/components/AlertsGrid";
import type { Anomaly } from "@/types";

const severityOrder = { high: 0, medium: 1, low: 2 };

async function getAnomalies() {
  const rows = await db.anomaly.findMany({
    include: { studio: { select: { name: true, city: true } } },
    orderBy: { generatedAt: "desc" },
  });

  const mapped = rows
    .sort((a, b) =>
      (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) -
      (severityOrder[b.severity as keyof typeof severityOrder] ?? 3)
    )
    .map((a): Anomaly => ({
      id: a.id,
      studioId: a.studioId,
      studioName: a.studio ? `${a.studio.name} · ${a.studio.city}` : null,
      generatedAt: a.generatedAt.toISOString(),
      summary: a.summary,
      severity: a.severity as "high" | "medium" | "low",
      category: a.category,
      resolved: a.resolved,
    }));

  return {
    active: mapped.filter((a) => !a.resolved),
    resolved: mapped.filter((a) => a.resolved),
  };
}

export default async function AlertsPage() {
  const { active, resolved } = await getAnomalies();

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-10 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={150} height={80} priority className="object-contain transition-opacity hover:opacity-80" /></Link>
          <Link href="/" className="text-sm font-medium transition-opacity hover:opacity-70 text-white">← Network</Link>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#1F2937" }}>Network Alerts</h1>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            {active.length} active alert{active.length !== 1 ? "s" : ""} across the network
          </p>
        </div>

        <AlertsGrid anomalies={active} resolvedAnomalies={resolved} />
      </div>
    </div>
  );
}
