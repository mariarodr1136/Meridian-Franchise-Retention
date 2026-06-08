import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { StudioGrid } from "@/components/StudioGrid";
import { AnomalyFeed } from "@/components/AnomalyFeed";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { StudioStatus, StudioWithLatestMetric, Anomaly } from "@/types";

async function getNetworkData() {
  const [studios, anomalies] = await Promise.all([
    db.studio.findMany({
      include: {
        metrics: { orderBy: { weekOf: "desc" }, take: 1 },
      },
      orderBy: [{ region: "asc" }, { name: "asc" }],
    }),
    db.anomaly.findMany({
      where: { resolved: false },
      include: { studio: { select: { name: true, city: true } } },
      orderBy: { generatedAt: "desc" },
    }),
  ]);
  return { studios, anomalies };
}

function NetworkStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="text-center px-6 py-4">
      <p className="text-2xl font-bold text-white whitespace-nowrap">{value}</p>
      <p className="text-xs mt-0.5 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.6)" }}>
        {label}{sub ? ` · ${sub}` : ""}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  const { studios, anomalies } = await getNetworkData();

  const openStudios = studios.filter((s) => s.status !== "pre-launch");
  const atRiskCount = studios.filter((s) => s.status === "at-risk").length;
  const totalMembers = openStudios.reduce((sum, s) => sum + (s.metrics[0]?.activeMemberships ?? 0), 0);
  const avgOccupancy = openStudios.length
    ? openStudios.reduce((sum, s) => sum + (s.metrics[0]?.classFillRate ?? 0), 0) / openStudios.length
    : 0;
  const totalRevenue = openStudios.reduce((sum, s) => sum + (s.metrics[0]?.weeklyRevenue ?? 0), 0);

  const studioList: StudioWithLatestMetric[] = studios.map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    state: s.state,
    country: s.country,
    region: s.region,
    status: s.status as StudioStatus,
    openedAt: s.openedAt?.toISOString() ?? null,
    franchiseeName: s.franchiseeName,
    address: s.address ?? null,
    phone: s.phone ?? null,
    latestMetric: s.metrics[0]
      ? {
          id: s.metrics[0].id,
          studioId: s.metrics[0].studioId,
          weekOf: s.metrics[0].weekOf.toISOString(),
          classFillRate: s.metrics[0].classFillRate,
          activeMemberships: s.metrics[0].activeMemberships,
          weeklyChurn: s.metrics[0].weeklyChurn,
          weeklyRevenue: s.metrics[0].weeklyRevenue,
          presalesPipelineCount: s.metrics[0].presalesPipelineCount,
          memberBookings: s.metrics[0].memberBookings,
          classPackBookings: s.metrics[0].classPackBookings,
          classPassBookings: s.metrics[0].classPassBookings,
        }
      : null,
  }));

  const anomalyList: Anomaly[] = anomalies.map((a) => ({
    id: a.id,
    studioId: a.studioId,
    studioName: a.studio ? `${a.studio.name} · ${a.studio.city}` : null,
    generatedAt: a.generatedAt.toISOString(),
    summary: a.summary,
    severity: a.severity as "high" | "medium" | "low",
    category: a.category,
    resolved: a.resolved,
  }));

  return (
    <div className="min-h-screen w-full" style={{ background: "#F0F5FB" }}>
      {/* Hero + stat bar */}
      <div className="relative overflow-hidden" style={{ width: "100vw", height: "280px" }}>
        <Image
          src="/jetset-hero2.jpg"
          alt="JetSet Modern Pilates studio"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center 20%" }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

        {/* Franchise Intelligence title */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: "88px" }}>
          <h1 className="text-white uppercase"
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "58.64px",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}>
            Franchise Intelligence
          </h1>
        </div>

        {/* Stat bar — logo left · stats center · Retention AI right */}
        <div className="absolute top-0 left-0 right-0" style={{ background: "#4A638D" }}>
          <div className="max-w-[1400px] mx-auto px-6 flex items-center">
            {/* Logo */}
            <div className="flex-none">
              <Image
                src="/jetset-logo-transparent.png"
                alt="JetSet Modern Pilates"
                width={130}
                height={68}
                priority
                className="object-contain"
              />
            </div>

            {/* Stats centered */}
            <div className="flex flex-1 items-center justify-center">
              {[
                { label: "Total Studios",     value: String(studios.length), sub: `${openStudios.length} open` },
                { label: "Active Members",    value: formatNumber(totalMembers) },
                { label: "Network Occupancy", value: formatPercent(avgOccupancy) },
                { label: "Weekly Revenue",    value: formatCurrency(totalRevenue) },
                { label: "At-Risk Studios",   value: String(atRiskCount) },
                { label: "Open Anomalies",    value: String(anomalies.length) },
              ].map((stat, i, arr) => (
                <div key={stat.label} className="flex items-center">
                  <NetworkStat label={stat.label} value={stat.value} sub={stat.sub} />
                  {i < arr.length - 1 && (
                    <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>

            {/* Retention AI */}
            <div className="flex-none">
              <Link href="/churn" className="text-sm font-medium transition-opacity hover:opacity-70 text-white whitespace-nowrap">
                Retention AI →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          <StudioGrid studios={studioList} />

          {/* Anomaly feed sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-4">
              {/* Status legend */}
              <div className="mb-4 rounded-xl border p-4"
                style={{ borderColor: "#C8D8EE", background: "#FFFFFF" }}>
                <p className="text-xs font-medium mb-3" style={{ color: "#4A638D" }}>Studio Status</p>
                <div className="flex flex-col gap-2">
                  {(["healthy", "at-risk", "new", "pre-launch"] as StudioStatus[]).map((s) => (
                    <div key={s} className="flex items-center justify-between">
                      <StatusBadge status={s} size="sm" />
                      <span className="text-xs" style={{ color: "#6B7280" }}>
                        {studios.filter((st) => st.status === s).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <Link href="/alerts" className="text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-70" style={{ color: "#4A638D" }}>
                  Network Alerts →
                </Link>
                {anomalies.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "#C8D8EE", color: "#4A638D" }}>
                    {anomalies.length} active
                  </span>
                )}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
                <AnomalyFeed anomalies={anomalyList} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
