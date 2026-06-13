import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { DigestClient } from "@/components/DigestClient";
import { DigestSections } from "@/components/DigestSections";
import { DigestAISummary } from "@/components/DigestAISummary";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

async function getDigestData() {
  const [studios, anomalies] = await Promise.all([
    db.studio.findMany({
      include: { metrics: { orderBy: { weekOf: "desc" }, take: 2 } },
      orderBy: [{ region: "asc" }, { name: "asc" }],
    }),
    db.anomaly.findMany({
      where: { resolved: false },
      include: { studio: { select: { name: true, city: true } } },
      orderBy: [{ severity: "asc" }, { generatedAt: "desc" }],
    }),
  ]);
  return { studios, anomalies };
}


export default async function DigestPage() {
  const { studios, anomalies } = await getDigestData();

  const openStudios = studios.filter((s) => s.status !== "pre-launch");
  const atRiskStudios = studios.filter((s) => s.status === "at-risk");
  const newStudios = studios.filter((s) => s.status === "new");
  const preLaunch = studios.filter((s) => s.status === "pre-launch");

  const totalMembers = openStudios.reduce((s, st) => s + (st.metrics[0]?.activeMemberships ?? 0), 0);
  const prevMembers  = openStudios.reduce((s, st) => s + (st.metrics[1]?.activeMemberships ?? 0), 0);
  const avgOccupancy = openStudios.length
    ? openStudios.reduce((s, st) => s + (st.metrics[0]?.classFillRate ?? 0), 0) / openStudios.length : 0;
  const prevOccupancy = openStudios.length
    ? openStudios.reduce((s, st) => s + (st.metrics[1]?.classFillRate ?? 0), 0) / openStudios.length : 0;
  const totalRevenue = openStudios.reduce((s, st) => s + (st.metrics[0]?.weeklyRevenue ?? 0), 0);
  const prevRevenue  = openStudios.reduce((s, st) => s + (st.metrics[1]?.weeklyRevenue ?? 0), 0);

  const memberDelta   = prevMembers  ? ((totalMembers  - prevMembers)  / prevMembers  * 100).toFixed(1) : null;
  const occupancyDelta = prevOccupancy ? ((avgOccupancy - prevOccupancy) / prevOccupancy * 100).toFixed(1) : null;
  const revenueDelta  = prevRevenue  ? ((totalRevenue  - prevRevenue)  / prevRevenue  * 100).toFixed(1) : null;

  const topStudios = [...openStudios]
    .filter((s) => s.metrics[0])
    .sort((a, b) => (b.metrics[0]?.weeklyRevenue ?? 0) - (a.metrics[0]?.weeklyRevenue ?? 0))
    .slice(0, 5);

  const weekLabel = openStudios[0]?.metrics[0]?.weekOf
    ? new Date(openStudios[0].metrics[0].weekOf).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "Current Week";

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      {/* Screen-only header */}
      <header className="sticky top-0 z-40 w-full print:hidden" style={{ background: "#4A638D" }}>
        <div className="max-w-[960px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={130} height={68} priority className="object-contain" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-white">Weekly Network Digest</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
            <Link href="/" className="text-sm font-medium text-white transition-opacity hover:opacity-70">← Network</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[960px] mx-auto px-6 py-8">
        {/* Print button (screen only) */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1F2937" }}>Weekly Network Digest</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Week of {weekLabel}</p>
          </div>
          <DigestClient />
        </div>

        {/* AI executive summary */}
        <DigestAISummary
          payload={{
            weekLabel,
            totalStudios: studios.length,
            openStudios: openStudios.length,
            healthyStudios: openStudios.filter((s) => s.status === "healthy").length,
            atRiskStudios: atRiskStudios.length,
            newStudios: newStudios.length,
            preLaunchStudios: preLaunch.length,
            totalMembers,
            memberDelta,
            avgOccupancy,
            occupancyDelta,
            totalRevenue,
            revenueDelta,
            topStudios: topStudios.map((s) => ({
              name: s.name,
              city: s.city,
              revenue: s.metrics[0]?.weeklyRevenue ?? 0,
            })),
            atRiskNames: atRiskStudios.map((s) => `${s.name} (${s.city})`),
            activeAlerts: anomalies.length,
            criticalAlerts: anomalies.filter((a) => a.severity === "high").length,
            alertSummaries: anomalies.slice(0, 4).map((a) => a.summary),
          }}
        />

        {/* ── Report content (printed + screen) ── */}
        <div id="digest-report">
          {/* Print header (hidden on screen) */}
          <div className="hidden print:flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: "#C8D8EE" }}>
            <div>
              <p className="text-2xl font-bold" style={{ color: "#4A638D", fontFamily: "Montserrat, sans-serif" }}>
                JETSET Modern Pilates
              </p>
              <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Weekly Network Digest · {weekLabel}</p>
            </div>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Confidential · HQ Internal</p>
          </div>

          {/* Network-wide KPIs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Active Members",    value: formatNumber(totalMembers),    delta: memberDelta,   good: true },
              { label: "Network Occupancy", value: formatPercent(avgOccupancy),   delta: occupancyDelta, good: true },
              { label: "Weekly Revenue",    value: formatCurrency(totalRevenue),  delta: revenueDelta,  good: true },
            ].map(({ label, value, delta, good }) => (
              <div
                key={label}
                className="rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}
              >
                <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: "#1F2937" }}>{value}</p>
                {delta && (
                  <p className="text-xs mt-1 font-medium"
                    style={{ color: (good ? Number(delta) >= 0 : Number(delta) < 0) ? "#16A34A" : "#EA580C" }}>
                    {Number(delta) >= 0 ? "↑" : "↓"} {Math.abs(Number(delta))}% vs prior week
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Studio counts row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Studios",  value: studios.length,           color: "#4A638D" },
              { label: "Open & Healthy", value: openStudios.filter(s => s.status === "healthy").length, color: "#16A34A" },
              { label: "At Risk",        value: atRiskStudios.length,     color: "#EA580C" },
              { label: "In Presales",    value: preLaunch.length,         color: "#9CA3AF" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}
              >
                <p className="text-3xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{label}</p>
              </div>
            ))}
          </div>

          <DigestSections
            topStudios={topStudios.map((s) => ({
              id: s.id,
              name: s.name,
              city: s.city,
              state: s.state,
              metrics: s.metrics.slice(0, 2).map((m) => ({
                weeklyRevenue: m.weeklyRevenue,
                classFillRate: m.classFillRate,
                activeMemberships: m.activeMemberships,
                weeklyChurn: m.weeklyChurn,
              })),
            }))}
            anomalies={anomalies.map((a) => ({
              id: a.id,
              severity: a.severity as "high" | "medium" | "low",
              summary: a.summary,
              generatedAt: a.generatedAt.toISOString(),
              category: a.category,
              studioId: a.studioId,
              studioName: a.studio?.name ?? null,
              studioCity: a.studio?.city ?? null,
            }))}
            atRiskStudios={atRiskStudios.map((s) => ({
              id: s.id,
              name: s.name,
              city: s.city,
              state: s.state,
              metrics: s.metrics.slice(0, 2).map((m) => ({
                weeklyRevenue: m.weeklyRevenue,
                classFillRate: m.classFillRate,
                activeMemberships: m.activeMemberships,
                weeklyChurn: m.weeklyChurn,
              })),
            }))}
            newStudios={newStudios.map((s) => ({
              id: s.id,
              name: s.name,
              city: s.city,
              state: s.state,
              metrics: s.metrics.slice(0, 1).map((m) => ({
                weeklyRevenue: m.weeklyRevenue,
                classFillRate: m.classFillRate,
                activeMemberships: m.activeMemberships,
                weeklyChurn: m.weeklyChurn,
              })),
            }))}
          />

          {/* Print footer */}
          <div className="mt-8 pt-4 border-t hidden print:block" style={{ borderColor: "#C8D8EE" }}>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              JetSet Modern Pilates · Franchise Intelligence Platform · Confidential · Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .hidden.print\\:block { display: block !important; }
          .hidden.print\\:flex { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
