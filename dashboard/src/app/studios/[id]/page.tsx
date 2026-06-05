import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart } from "@/components/TrendChart";
import { StaffRoster } from "@/components/StaffRoster";
import { AnomalyFeed } from "@/components/AnomalyFeed";
import { formatPercent, formatNumber, formatCurrency, trendDirection, trendLabel, cn } from "@/lib/utils";
import type { StudioStatus, StudioMetric, Instructor, Anomaly } from "@/types";

async function getStudio(id: string) {
  return db.studio.findUnique({
    where: { id },
    include: {
      metrics:     { orderBy: { weekOf: "desc" } },
      instructors: { orderBy: { name: "asc" } },
      anomalies:   { where: { resolved: false }, orderBy: { generatedAt: "desc" } },
    },
  });
}

function KpiCard({
  label, value, prev, reverse = false,
}: {
  label: string;
  value: string;
  prev?: number;
  current?: number;
  reverse?: boolean;
}) {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {prev !== undefined && (
        <p className="text-xs mt-1" style={{ color: "#4A638D" }}>
          vs prev week
        </p>
      )}
    </div>
  );
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
    id: m.id,
    studioId: m.studioId,
    weekOf: m.weekOf.toISOString(),
    classFillRate: m.classFillRate,
    activeMemberships: m.activeMemberships,
    weeklyChurn: m.weeklyChurn,
    weeklyRevenue: m.weeklyRevenue,
    presalesPipelineCount: m.presalesPipelineCount,
  }));

  const instructors: Instructor[] = studio.instructors.map((i) => ({
    id: i.id,
    studioId: i.studioId,
    name: i.name,
    role: (i.role ?? "instructor") as "director_of_operations" | "general_manager" | "studio_lead" | "instructor",
    certificationStatus: i.certificationStatus as "certified" | "pending" | "expired",
    lastEvalDate: i.lastEvalDate?.toISOString() ?? null,
    performanceScore: i.performanceScore,
  }));

  const anomalies: Anomaly[] = studio.anomalies.map((a) => ({
    id: a.id,
    studioId: a.studioId,
    studioName: null,
    generatedAt: a.generatedAt.toISOString(),
    summary: a.summary,
    severity: a.severity as "high" | "medium" | "low",
    category: a.category,
    resolved: a.resolved,
  }));

  const current = metrics[0];
  const prev    = metrics[1];
  const isPreLaunch = studio.status === "pre-launch";

  const openedLabel = studio.openedAt
    ? new Date(studio.openedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  const doo          = instructors.find((i) => i.role === "director_of_operations");
  const gm           = instructors.find((i) => i.role === "general_manager");
  const expiredCount = instructors.filter((i) => i.certificationStatus === "expired").length;
  const avgScore     = instructors
    .filter((i) => i.performanceScore != null)
    .reduce((sum, i, _, arr) => sum + (i.performanceScore! / arr.length), 0);

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Image
            src="/jetset-logo-transparent.png"
            alt="JetSet Modern Pilates"
            width={150}
            height={80}
            priority
            className="object-contain"
          />
          <Link href="/" className="text-sm font-medium transition-opacity hover:opacity-70 text-white">
            ← Network
          </Link>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Studio title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{studio.name}</h1>
              <StatusBadge status={studio.status as StudioStatus} />
            </div>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              {studio.city}{studio.state ? `, ${studio.state}` : ""}
              {studio.country !== "US" ? ` · ${studio.country}` : ""}
              {" · "}
              <span style={{ color: "#4A638D" }}>{studio.region}</span>
            </p>
            <p className="text-xs" style={{ color: "#4A638D" }}>
              Franchisee: {studio.franchiseeName}
              {openedLabel && <> · Opened {openedLabel}</>}
            </p>
            {studio.address && (
              <p className="text-xs" style={{ color: "#6B7280" }}>{studio.address}</p>
            )}
            {studio.phone && (
              <p className="text-xs" style={{ color: "#6B7280" }}>{studio.phone}</p>
            )}
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4 text-right mr-16">
            {expiredCount > 0 && (
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{expiredCount}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>expired cert{expiredCount !== 1 ? "s" : ""}</p>
              </div>
            )}
            {avgScore > 0 && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#4A638D" }}>
                  <p className="text-lg font-bold text-white">{avgScore.toFixed(0)}</p>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Performance Index</p>
              </div>
            )}
          </div>
        </div>

        {isPreLaunch ? (
          /* Pre-launch view */
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Presales Pipeline</p>
              <p className="text-4xl font-bold" style={{ color: "var(--gold)" }}>
                {current?.presalesPipelineCount ?? 0}
              </p>
              <p className="text-xs mt-1" style={{ color: "#4A638D" }}>total leads captured</p>
            </div>
            <div className="rounded-xl border p-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Presales Trend</p>
              <TrendChart
                metrics={metrics}
                field="presalesPipelineCount"
                color="#C9A84C"
                label=""
              />
            </div>
          </div>
        ) : current ? (
          /* Open studio KPI row */
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "Class Occupancy",
                  value: formatPercent(current.classFillRate),
                  trend: trendDirection(current.classFillRate, prev?.classFillRate ?? current.classFillRate),
                  trendStr: prev ? trendLabel(current.classFillRate, prev.classFillRate) : undefined,
                },
                {
                  label: "Active Members",
                  value: formatNumber(current.activeMemberships),
                  trend: trendDirection(current.activeMemberships, prev?.activeMemberships ?? current.activeMemberships),
                  trendStr: prev ? trendLabel(current.activeMemberships, prev.activeMemberships) : undefined,
                },
                {
                  label: "Weekly Revenue",
                  value: formatCurrency(current.weeklyRevenue),
                  trend: trendDirection(current.weeklyRevenue, prev?.weeklyRevenue ?? current.weeklyRevenue),
                  trendStr: prev ? trendLabel(current.weeklyRevenue, prev.weeklyRevenue) : undefined,
                },
                {
                  label: "Weekly Churn",
                  value: formatPercent(current.weeklyChurn),
                  trend: trendDirection(current.weeklyChurn, prev?.weeklyChurn ?? current.weeklyChurn),
                  trendStr: prev ? trendLabel(current.weeklyChurn, prev.weeklyChurn) : undefined,
                  reverse: true,
                },
              ].map(({ label, value, trend, trendStr, reverse }) => (
                <div
                  key={label}
                  className="rounded-xl border p-5"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
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

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div
                className="rounded-xl border p-5"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <TrendChart
                  metrics={metrics}
                  field="weeklyRevenue"
                  color="#C9A84C"
                  label="Weekly Revenue (8 weeks)"
                />
              </div>
              <div
                className="rounded-xl border p-5"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <TrendChart
                  metrics={metrics}
                  field="activeMemberships"
                  color="#3b82f6"
                  label="Active Memberships (8 weeks)"
                />
              </div>
            </div>
          </>
        ) : null}

        {/* Recent Reviews */}
        <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
              Recent Reviews
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#EEF3FB", color: "#4A638D" }}>
              Google · Yelp · ClassPass
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <svg className="w-8 h-8" style={{ color: "#C8D8EE" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: "#6B7280" }}>No reviews connected yet</p>
            <p className="text-xs text-center max-w-xs" style={{ color: "#9CA3AF" }}>
              Connect your Google Business, Yelp, and ClassPass accounts to pull member reviews directly into this dashboard.
            </p>
            <button
              className="mt-1 text-xs px-4 py-1.5 rounded-full font-medium transition-opacity hover:opacity-75"
              style={{ background: "#4A638D", color: "#FFFFFF" }}
            >
              Connect accounts
            </button>
          </div>
        </div>

        {/* Bottom row: staff + anomalies */}
        <div className="grid grid-cols-[1fr_320px] gap-6">
          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>
              Staff Roster
            </h3>
            <StaffRoster staff={instructors} />
          </div>

          {anomalies.length > 0 ? (
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>
                Active Alerts
              </h3>
              <AnomalyFeed anomalies={anomalies} />
            </div>
          ) : (
            <div
              className="rounded-xl border p-5 flex items-center justify-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="text-center">
                <p className="text-2xl mb-2">✓</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No active alerts</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
