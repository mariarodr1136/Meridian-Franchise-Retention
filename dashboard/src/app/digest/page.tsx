import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { DigestClient } from "@/components/DigestClient";
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

  const highAlerts   = anomalies.filter((a) => a.severity === "high");
  const mediumAlerts = anomalies.filter((a) => a.severity === "medium");

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
              <div key={label} className="rounded-xl border p-4" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
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
              { label: "Total Studios",     value: studios.length,           color: "#4A638D" },
              { label: "Open & Healthy",    value: openStudios.filter(s => s.status === "healthy").length, color: "#16A34A" },
              { label: "At Risk",           value: atRiskStudios.length,     color: "#EA580C" },
              { label: "In Presales",       value: preLaunch.length,         color: "#9CA3AF" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border p-4 text-center" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
                <p className="text-3xl font-bold" style={{ color }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Top studios by revenue */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#E4EDF8" }}>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Top Studios · Weekly Revenue</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {topStudios.map((s, i) => (
                    <tr key={s.id} className="border-b last:border-0" style={{ borderColor: "#E4EDF8" }}>
                      <td className="px-4 py-2.5 text-xs text-center w-8" style={{ color: "#9CA3AF" }}>{i + 1}</td>
                      <td className="py-2.5 pr-4">
                        <p className="text-sm font-medium" style={{ color: "#1F2937" }}>{s.name}</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>{s.city}, {s.state}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>
                          {formatCurrency(s.metrics[0]?.weeklyRevenue ?? 0)}
                        </p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          {formatPercent(s.metrics[0]?.classFillRate ?? 0)} fill
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Active alerts */}
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E4EDF8" }}>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Active Alerts</p>
                <div className="flex items-center gap-2">
                  {highAlerts.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "#DC2626" }}>
                      {highAlerts.length} critical
                    </span>
                  )}
                  {mediumAlerts.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "#D97706" }}>
                      {mediumAlerts.length} warning
                    </span>
                  )}
                </div>
              </div>
              {anomalies.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>No active alerts</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "#E4EDF8" }}>
                  {anomalies.slice(0, 5).map((a) => (
                    <div key={a.id} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span
                          className="flex-shrink-0 mt-0.5 text-xs font-bold uppercase px-1.5 py-0.5 rounded"
                          style={{
                            background: a.severity === "high" ? "#FEE2E2" : a.severity === "medium" ? "#FEF3C7" : "#EEF3FB",
                            color:      a.severity === "high" ? "#DC2626" : a.severity === "medium" ? "#D97706" : "#4A638D",
                          }}
                        >{a.severity}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: "#1F2937" }}>
                            {a.studio ? `${a.studio.name} · ${a.studio.city}` : "Network"}
                          </p>
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "#6B7280" }}>{a.summary}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {anomalies.length > 5 && (
                    <p className="px-4 py-2 text-xs text-center" style={{ color: "#9CA3AF" }}>
                      +{anomalies.length - 5} more alerts
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* At-risk studios detail */}
          {atRiskStudios.length > 0 && (
            <div className="rounded-xl border overflow-hidden mb-6" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#E4EDF8", background: "#FFF5F5" }}>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#DC2626" }}>
                  At-Risk Studios — Requires Attention
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#E4EDF8" }}>
                    {["Studio", "Fill Rate", "Members", "Weekly Rev", "Churn Rate"].map((h) => (
                      <th key={h} className="px-4 py-2 text-xs text-left font-medium" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudios.map((s) => (
                    <tr key={s.id} className="border-b last:border-0" style={{ borderColor: "#E4EDF8" }}>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: "#1F2937" }}>{s.name}</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>{s.city}, {s.state}</p>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#EA580C" }}>
                        {formatPercent(s.metrics[0]?.classFillRate ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-sm">{formatNumber(s.metrics[0]?.activeMemberships ?? 0)}</td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(s.metrics[0]?.weeklyRevenue ?? 0)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#EA580C" }}>
                        {formatPercent(s.metrics[0]?.weeklyChurn ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* New studio ramp */}
          {newStudios.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: "#E4EDF8" }}>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>New Studios — Ramp Progress</p>
              </div>
              <div className="grid grid-cols-3 gap-0 divide-x" style={{ borderColor: "#E4EDF8" }}>
                {newStudios.map((s) => (
                  <div key={s.id} className="px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: "#1F2937" }}>{s.name}</p>
                    <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>{s.city}, {s.state}</p>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "#E4EDF8" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: formatPercent(s.metrics[0]?.classFillRate ?? 0), background: "#4A638D" }}
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      {formatPercent(s.metrics[0]?.classFillRate ?? 0)} fill · {formatNumber(s.metrics[0]?.activeMemberships ?? 0)} members
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
