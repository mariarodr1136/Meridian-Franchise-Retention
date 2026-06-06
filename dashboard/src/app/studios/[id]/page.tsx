import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart } from "@/components/TrendChart";
import { AnomalyFeed } from "@/components/AnomalyFeed";
import { StudioSidebar } from "@/components/StudioSidebar";
import { MetricCharts } from "@/components/MetricCharts";
import { RetentionPreview } from "@/components/RetentionPreview";
import { generateStudioChurn } from "@/lib/churn";
import { formatPercent, formatNumber, formatCurrency, trendDirection, trendLabel, cn } from "@/lib/utils";
import type { StudioStatus, StudioMetric, Anomaly } from "@/types";

async function getStudio(id: string) {
  return db.studio.findUnique({
    where: { id },
    include: {
      metrics:   { orderBy: { weekOf: "desc" } },
      anomalies: { where: { resolved: false }, orderBy: { generatedAt: "desc" } },
    },
  });
}

export default async function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studio = await getStudio(id);
  if (!studio) notFound();

  const metrics: StudioMetric[] = studio.metrics.map((m) => ({
    id: m.id, studioId: m.studioId,
    weekOf: m.weekOf.toISOString(),
    classFillRate: m.classFillRate,
    activeMemberships: m.activeMemberships,
    weeklyChurn: m.weeklyChurn,
    weeklyRevenue: m.weeklyRevenue,
    presalesPipelineCount: m.presalesPipelineCount,
    memberBookings: m.memberBookings,
    classPackBookings: m.classPackBookings,
    classPassBookings: m.classPassBookings,
  }));

  const anomalies: Anomaly[] = studio.anomalies.map((a) => ({
    id: a.id, studioId: a.studioId, studioName: null,
    generatedAt: a.generatedAt.toISOString(),
    summary: a.summary,
    severity: a.severity as "high" | "medium" | "low",
    category: a.category,
    resolved: a.resolved,
  }));

  const current     = metrics[0];
  const prev        = metrics[1];
  const isPreLaunch = studio.status === "pre-launch";

  const openedLabel = studio.openedAt
    ? new Date(studio.openedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const retentionData = !isPreLaunch && current
    ? generateStudioChurn({
        studioId:        studio.id,
        studioName:      studio.name,
        studioCity:      studio.city,
        studioStatus:    studio.status,
        memberCount:     current.activeMemberships,
        weeklyChurnRate: current.weeklyChurn,
      })
    : null;

  // Sub-page navigation cards
  const subPages = isPreLaunch
    ? []
    : [
        { href: `/studios/${studio.id}/classes`,    label: "Classes",    desc: "Schedule, booking mix, slot performance, reviews by instructor" },
        { href: `/studios/${studio.id}/sales`,      label: "Sales",      desc: "Revenue by product, monthly & category trends"                 },
        { href: `/studios/${studio.id}/operations`, label: "Operations", desc: "Lease, alarm, HVAC, technician, internet"                      },
        { href: `/studios/${studio.id}/inventory`,  label: "Inventory",  desc: "End-of-month stock levels, reorder alerts"                     },
        { href: `/studios/${studio.id}/settings`,   label: "Settings",   desc: "Edit studio info, staff roster, certification status"          },
      ];

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={150} height={80} priority className="object-contain transition-opacity hover:opacity-80" /></Link>
          <Link href="/" className="text-sm font-medium transition-opacity hover:opacity-70 text-white">← Network</Link>
        </div>
      </header>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        {/* Studio title */}
        <div className="flex items-start justify-between mb-8 pb-6" style={{ borderBottom: "1px solid #C8D8EE" }}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{studio.name}</h1>
              <StatusBadge status={studio.status as StudioStatus} />
            </div>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              {studio.city}{studio.state ? `, ${studio.state}` : ""}
              {studio.country !== "US" ? ` · ${studio.country}` : ""}
              {" · "}<span style={{ color: "#4A638D" }}>{studio.region}</span>
            </p>
            <p className="text-xs" style={{ color: "#4A638D" }}>
              Franchisee: {studio.franchiseeName}
              {openedLabel && <> · Opened {openedLabel}</>}
            </p>
            {studio.address && <p className="text-xs" style={{ color: "#6B7280" }}>{studio.address}</p>}
            {studio.phone   && <p className="text-xs" style={{ color: "#6B7280" }}>{studio.phone}</p>}
          </div>
        </div>

        {/* Sidebar + content */}
        <div className="flex gap-8">
          <StudioSidebar studioId={studio.id} />

          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* KPI CARDS */}
            {isPreLaunch ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border p-6" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
                  <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Presales Pipeline</p>
                  <p className="text-4xl font-bold" style={{ color: "#C9A84C" }}>{current?.presalesPipelineCount ?? 0}</p>
                  <p className="text-xs mt-1" style={{ color: "#4A638D" }}>total leads captured</p>
                </div>
                <div className="rounded-xl border p-6" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
                  <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>Presales Trend</p>
                  <TrendChart metrics={metrics} field="presalesPipelineCount" color="#C9A84C" label="" />
                </div>
              </div>
            ) : current ? (
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Class Occupancy", value: formatPercent(current.classFillRate),    trend: trendDirection(current.classFillRate,    prev?.classFillRate    ?? current.classFillRate),    trendStr: prev ? trendLabel(current.classFillRate,    prev.classFillRate)    : undefined },
                  { label: "Active Members",  value: formatNumber(current.activeMemberships), trend: trendDirection(current.activeMemberships, prev?.activeMemberships ?? current.activeMemberships), trendStr: prev ? trendLabel(current.activeMemberships, prev.activeMemberships) : undefined },
                  { label: "Weekly Revenue",  value: formatCurrency(current.weeklyRevenue),   trend: trendDirection(current.weeklyRevenue,    prev?.weeklyRevenue    ?? current.weeklyRevenue),    trendStr: prev ? trendLabel(current.weeklyRevenue,    prev.weeklyRevenue)    : undefined },
                  { label: "Weekly Churn",    value: formatPercent(current.weeklyChurn),      trend: trendDirection(current.weeklyChurn,      prev?.weeklyChurn      ?? current.weeklyChurn),      trendStr: prev ? trendLabel(current.weeklyChurn,      prev.weeklyChurn)      : undefined, reverse: true },
                ].map(({ label, value, trend, trendStr, reverse }) => (
                  <div key={label} className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
                    <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>{label}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    {trendStr && (
                      <p className={cn("text-xs mt-1.5 font-medium",
                        trend === "flat" ? "text-neutral-400" :
                        (trend === "up" && !reverse) || (trend === "down" && reverse) ? "text-green-600" : "text-orange-500"
                      )}>
                        {trendStr} WoW
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            {/* TREND CHARTS */}
            {!isPreLaunch && metrics.length > 0 && (
              <MetricCharts metrics={metrics} />
            )}

            {/* RETENTION PREVIEW */}
            {retentionData && (
              <RetentionPreview studioId={studio.id} summary={retentionData.summary} />
            )}

            {/* ACTIVE ALERTS */}
            {anomalies.length > 0 && (
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#4A638D" }}>Active Alerts</p>
                <AnomalyFeed anomalies={anomalies} />
              </div>
            )}

            {/* SUB-PAGE NAV CARDS */}
            {subPages.length > 0 && (
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>Studio Sections</p>
                <div className="grid grid-cols-1 gap-3">
                  {subPages.map(({ href, label, desc }) => (
                    <Link
                      key={href}
                      href={href}
                      className="rounded-xl border px-5 py-4 flex items-center justify-between group transition-all hover:shadow-sm"
                      style={{ background: "#fff", borderColor: "#C8D8EE" }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{desc}</p>
                      </div>
                      <span className="text-sm transition-transform group-hover:translate-x-0.5" style={{ color: "#C8D8EE" }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
