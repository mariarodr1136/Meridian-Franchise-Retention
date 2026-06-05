import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { TrendChart } from "@/components/TrendChart";
import { StaffRoster } from "@/components/StaffRoster";
import { AnomalyFeed } from "@/components/AnomalyFeed";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { fetchStudioSchedule, extractInstructors, scheduleUrl } from "@/lib/schedule";
import { formatPercent, formatNumber, formatCurrency, trendDirection, trendLabel, cn } from "@/lib/utils";
import type { StudioStatus, StudioMetric, Instructor, Anomaly, Review, ClassMetric } from "@/types";
import { MetricsComparison } from "@/components/MetricsComparison";

async function getStudio(id: string) {
  return db.studio.findUnique({
    where: { id },
    include: {
      metrics:     { orderBy: { weekOf: "desc" } },
      instructors: { orderBy: { name: "asc" } },
      anomalies:   { where: { resolved: false }, orderBy: { generatedAt: "desc" } },
      reviews:     { orderBy: { reviewDate: "desc" }, take: 6 },
      classMetrics: true,
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

  const schedule = studio.status !== "pre-launch"
    ? await fetchStudioSchedule(studio.name, studio.state)
    : [];

  const metrics: StudioMetric[] = studio.metrics.map((m) => ({
    id: m.id,
    studioId: m.studioId,
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

  const seededStaff: Instructor[] = studio.instructors.map((i) => ({
    id: i.id,
    studioId: i.studioId,
    name: i.name,
    role: (i.role ?? "instructor") as "director_of_operations" | "general_manager" | "studio_lead" | "instructor",
    certificationStatus: i.certificationStatus as "certified" | "pending" | "expired",
    lastEvalDate: i.lastEvalDate?.toISOString() ?? null,
    performanceScore: i.performanceScore,
  }));

  const realInstructorNames = extractInstructors(schedule);
  const realInstructors: Instructor[] = realInstructorNames.map((name, idx) => ({
    id: `sched-${idx}`,
    studioId: studio.id,
    name,
    role: "instructor",
    certificationStatus: "certified",
    lastEvalDate: null,
    performanceScore: null,
  }));

  const instructors: Instructor[] = [
    ...seededStaff.filter((i) => i.role !== "instructor"),
    ...(realInstructors.length > 0 ? realInstructors : seededStaff.filter((i) => i.role === "instructor")),
  ];

  const reviews: Review[] = studio.reviews.map((r) => ({
    id: r.id,
    studioId: r.studioId,
    source: r.source as "google" | "classpass",
    author: r.author,
    rating: r.rating,
    body: r.body,
    reviewDate: r.reviewDate.toISOString(),
  }));

  const classMetrics: ClassMetric[] = studio.classMetrics.map((m) => ({
    id: m.id,
    studioId: m.studioId,
    dayOfWeek: m.dayOfWeek,
    timeSlot: m.timeSlot,
    weekOf: m.weekOf.toISOString(),
    capacity: m.capacity,
    spotsFilled: m.spotsFilled,
    memberBookings: m.memberBookings,
    classPackBookings: m.classPackBookings,
    classPassBookings: m.classPassBookings,
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

        {/* Period Comparison */}
        {metrics.length >= 2 && <MetricsComparison metrics={metrics} />}

        {/* Booking Method Breakdown */}
        {!isPreLaunch && current && (current.memberBookings + current.classPackBookings + current.classPassBookings) > 0 && (() => {
          const total = current.memberBookings + current.classPackBookings + current.classPassBookings;
          const segments = [
            { label: "Members",     value: current.memberBookings,    color: "#4A638D", pct: current.memberBookings / total },
            { label: "Class Packs", value: current.classPackBookings, color: "#C9A84C", pct: current.classPackBookings / total },
            { label: "ClassPass",   value: current.classPassBookings, color: "#9CA3AF", pct: current.classPassBookings / total },
          ];
          return (
            <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <h3 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>
                How Clients Book
              </h3>
              {/* Stacked bar */}
              <div className="flex h-6 rounded-full overflow-hidden mb-4 gap-0.5">
                {segments.map((s) => (
                  <div
                    key={s.label}
                    style={{ width: `${s.pct * 100}%`, background: s.color }}
                    title={`${s.label}: ${s.value}`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="grid grid-cols-3 gap-4">
                {segments.map((s) => (
                  <div key={s.label} className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                    </div>
                    <p className="text-xl font-bold pl-4">{s.value.toLocaleString()}</p>
                    <p className="text-xs pl-4" style={{ color: "#4A638D" }}>{Math.round(s.pct * 100)}% of bookings</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Weekly Schedule */}
        {schedule.length > 0 && (
          <ScheduleGrid
            days={schedule}
            classMetrics={classMetrics}
            scheduleHref={scheduleUrl(studio.name, studio.state)}
          />
        )}

        {/* Recent Reviews */}
        {reviews.length > 0 && (() => {
          const SOURCE_LABEL: Record<string, string> = { google: "Google", classpass: "ClassPass" };
          const sources = ["google", "classpass"].filter(s => reviews.some(r => r.source === s));
          const sourceStats = Object.fromEntries(sources.map(s => {
            const bucket = reviews.filter(r => r.source === s);
            const avg = bucket.reduce((sum, r) => sum + r.rating, 0) / bucket.length;
            return [s, { avg, count: bucket.length }];
          }));
          return (
            <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Recent Reviews</h3>
                <div className="flex items-center gap-4">
                  {sources.map(s => {
                    const { avg, count } = sourceStats[s];
                    const full = Math.round(avg);
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "#4A638D" }}>
                          {SOURCE_LABEL[s]}
                        </span>
                        <span className="text-sm font-bold" style={{ color: "#1F2937" }}>{avg.toFixed(1)}</span>
                        <span style={{ color: "#C9A84C", fontSize: "13px" }}>{"★".repeat(full)}{"☆".repeat(5 - full)}</span>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>({count})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Review grid */}
              <div className="grid grid-cols-2 gap-3">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded-lg p-4" style={{ background: "#F8FAFD", border: "1px solid #EEF3FB" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{r.author}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#C9A84C" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium text-white" style={{ background: "#4A638D" }}>
                          {SOURCE_LABEL[r.source]}
                        </span>
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>
                          {new Date(r.reviewDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#4B5563" }}>{r.body}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

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
