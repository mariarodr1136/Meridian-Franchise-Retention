"use client";

import { useState, useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { ClassMetric } from "@/types";
import type { ScheduleDay, ScheduleClass } from "@/lib/schedule";

const DAY_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const MAX_VISIBLE = 10;

function extractTimeSlot(time: string): string {
  return time.split(" ")[0]; // "7:30am - 8:20am" → "7:30am"
}

function fillColor(rate: number): string {
  if (rate >= 0.80) return "#16a34a";
  if (rate >= 0.55) return "#d97706";
  return "#dc2626";
}

type ClassStats = {
  dayOfWeek: number;
  timeSlot: string;
  capacity: number;
  latestFilled: number;
  avgFillRate: number;
  trend: "up" | "down" | "stable";
  memberPct: number;
  classPackPct: number;
  classPassPct: number;
  chartData: { label: string; fill: number; member: number; pack: number; pass: number }[];
};

function computeStats(metrics: ClassMetric[], day: number, slot: string): ClassStats | null {
  const rows = metrics
    .filter((m) => m.dayOfWeek === day && m.timeSlot === slot)
    .sort((a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime());
  if (!rows.length) return null;

  const cap = rows[0].capacity;
  const rates = rows.map((r) => r.spotsFilled / cap);
  const avgFillRate = rates.reduce((s, v) => s + v, 0) / rates.length;
  const recentAvg = rates.slice(0, 4).reduce((s, v) => s + v, 0) / Math.min(4, rates.length);
  const olderAvg = rates.length > 4 ? rates.slice(4).reduce((s, v) => s + v, 0) / (rates.length - 4) : recentAvg;
  const trend = recentAvg - olderAvg > 0.08 ? "up" : recentAvg - olderAvg < -0.08 ? "down" : "stable";

  const totalFilled = rows.reduce((s, r) => s + r.spotsFilled, 0);
  const memberPct    = totalFilled > 0 ? rows.reduce((s, r) => s + r.memberBookings, 0) / totalFilled : 0;
  const classPackPct = totalFilled > 0 ? rows.reduce((s, r) => s + r.classPackBookings, 0) / totalFilled : 0;
  const classPassPct = Math.max(0, 1 - memberPct - classPackPct);

  const chartData = [...rows].reverse().map((r, i) => ({
    label: `W-${rows.length - 1 - i}`,
    fill: Math.round((r.spotsFilled / cap) * 100),
    member: r.memberBookings,
    pack: r.classPackBookings,
    pass: r.classPassBookings,
  }));
  chartData[chartData.length - 1].label = "This wk";

  return { dayOfWeek: day, timeSlot: slot, capacity: cap, latestFilled: rows[0].spotsFilled, avgFillRate, trend, memberPct, classPackPct, classPassPct, chartData };
}

interface Props {
  days: ScheduleDay[];
  classMetrics: ClassMetric[];
  scheduleHref: string;
}

export function ScheduleGrid({ days, classMetrics, scheduleHref }: Props) {
  const [selected, setSelected] = useState<{ cls: ScheduleClass; stats: ClassStats | null } | null>(null);

  // Pre-compute stats for all unique day+slot combos visible in schedule
  const statsCache = useMemo(() => {
    const cache = new Map<string, ClassStats | null>();
    for (const day of days) {
      const dow = DAY_NUM[day.day] ?? -1;
      for (const cls of day.classes) {
        const slot = extractTimeSlot(cls.time);
        const key = `${dow}-${slot}`;
        if (!cache.has(key)) cache.set(key, computeStats(classMetrics, dow, slot));
      }
    }
    return cache;
  }, [days, classMetrics]);

  if (!days.length) return null;

  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}`;

  function handleSelect(cls: ScheduleClass, dayStr: string) {
    const dow = DAY_NUM[dayStr] ?? -1;
    const slot = extractTimeSlot(cls.time);
    const stats = statsCache.get(`${dow}-${slot}`) ?? null;
    setSelected((prev) =>
      prev?.cls.time === cls.time && prev?.cls.day === cls.day ? null : { cls, stats }
    );
  }

  return (
    <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Weekly Schedule</h3>
        <a href={scheduleHref} target="_blank" rel="noopener noreferrer"
          className="text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "#4A638D" }}>
          Open full schedule →
        </a>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(({ day, date, classes }) => {
          const isToday = date === todayStr;
          const visible = classes.slice(0, MAX_VISIBLE);
          const overflow = classes.length - MAX_VISIBLE;

          return (
            <div key={date} className="flex flex-col rounded-lg p-2 min-w-0"
              style={{ background: isToday ? "#EEF3FB" : "transparent", border: isToday ? "1px solid #C8D8EE" : "1px solid transparent" }}>
              {/* Day header */}
              <div className="text-center mb-2">
                <p className="text-xs font-bold uppercase" style={{ color: isToday ? "#4A638D" : "#6B7280" }}>{day}</p>
                <p className="text-xs" style={{ color: isToday ? "#4A638D" : "#9CA3AF" }}>{date}</p>
                {isToday && <span className="inline-block w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: "#4A638D" }} />}
              </div>

              {/* Classes */}
              {classes.length === 0 ? (
                <p className="text-center text-xs py-2" style={{ color: "#D1D5DB" }}>—</p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {visible.map((cls, i) => {
                    const dow = DAY_NUM[day] ?? -1;
                    const slot = extractTimeSlot(cls.time);
                    const stats = statsCache.get(`${dow}-${slot}`);
                    const isSelected = selected?.cls.time === cls.time && selected?.cls.day === cls.day;
                    const fillRate = stats ? stats.latestFilled / stats.capacity : null;

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelect(cls, day)}
                        className="rounded px-1 py-1 text-left w-full transition-all"
                        style={{
                          background: isSelected ? "#4A638D" : cls.isPast ? "transparent" : "#F8FAFD",
                          opacity: cls.isPast && !isSelected ? 0.45 : 1,
                          border: `1px solid ${isSelected ? "#4A638D" : stats ? fillColor(stats.avgFillRate) + "33" : "transparent"}`,
                        }}
                      >
                        <p className="leading-tight truncate font-medium" style={{ color: isSelected ? "#fff" : "#374151", fontSize: "10px" }}>
                          {extractTimeSlot(cls.time)}
                        </p>
                        <p className="leading-tight truncate" style={{ color: isSelected ? "#C8D8EE" : "#6B7280", fontSize: "10px" }}>
                          {cls.instructor}
                        </p>
                        {/* Fill rate bar */}
                        {fillRate !== null && (
                          <div className="mt-0.5 h-0.5 rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${Math.round(fillRate * 100)}%`, background: isSelected ? "#C8D8EE" : fillColor(stats!.avgFillRate) }} />
                          </div>
                        )}
                        {/* Trend indicator */}
                        {stats && stats.trend !== "stable" && (
                          <p style={{ fontSize: "8px", color: isSelected ? "#C8D8EE" : stats.trend === "up" ? "#16a34a" : "#dc2626", lineHeight: 1.2 }}>
                            {stats.trend === "up" ? "↑ filling up" : "↓ declining"}
                          </p>
                        )}
                      </button>
                    );
                  })}
                  {overflow > 0 && (
                    <p className="text-center mt-0.5" style={{ color: "#9CA3AF", fontSize: "10px" }}>+{overflow} more</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="mt-4 rounded-xl p-5 border" style={{ background: "#F8FAFD", borderColor: "#C8D8EE" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-bold" style={{ color: "#1F2937" }}>
                {selected.cls.day} · {extractTimeSlot(selected.cls.time)} · {selected.cls.instructor}
              </p>
              {selected.stats ? (
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  {selected.stats.latestFilled}/{selected.stats.capacity} spots filled this week
                  {" · "}avg {Math.round(selected.stats.avgFillRate * 100)}% over 8 weeks
                </p>
              ) : (
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>No historical data for this slot yet</p>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-xs px-2 py-1 rounded" style={{ color: "#6B7280", background: "#E5E7EB" }}>✕</button>
          </div>

          {selected.stats && (
            <div className="grid grid-cols-[1fr_220px] gap-6">
              {/* Left: fill rate chart */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#4A638D" }}>Fill rate — last 8 weeks</p>
                <ResponsiveContainer width="100%" height={90}>
                  <AreaChart data={selected.stats.chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4A638D" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4A638D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 6 }}
                      formatter={(v) => [`${v}%`, "Fill rate"]}
                    />
                    <Area type="monotone" dataKey="fill" stroke="#4A638D" strokeWidth={2} fill="url(#fillGrad)" dot={{ r: 2, fill: "#4A638D" }} />
                  </AreaChart>
                </ResponsiveContainer>
                {/* Trend insight */}
                <p className="text-xs mt-2 font-medium"
                  style={{ color: selected.stats.trend === "up" ? "#16a34a" : selected.stats.trend === "down" ? "#dc2626" : "#6B7280" }}>
                  {selected.stats.trend === "up"
                    ? "↑ This slot is filling up — up vs. the prior 4-week average"
                    : selected.stats.trend === "down"
                    ? "↓ This slot is declining — fill rate dropped vs. prior 4-week average"
                    : "→ Stable fill rate over the last 8 weeks"}
                </p>
              </div>

              {/* Right: booking mix */}
              <div>
                <p className="text-xs font-semibold mb-3" style={{ color: "#4A638D" }}>Who books this class</p>
                {[
                  { label: "Members",     pct: selected.stats.memberPct,    color: "#4A638D" },
                  { label: "Class Packs", pct: selected.stats.classPackPct, color: "#C9A84C" },
                  { label: "ClassPass",   pct: selected.stats.classPassPct, color: "#9CA3AF" },
                ].map((seg) => (
                  <div key={seg.label} className="mb-2">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs" style={{ color: "#374151" }}>{seg.label}</span>
                      <span className="text-xs font-semibold" style={{ color: seg.color }}>{Math.round(seg.pct * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#E5E7EB" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.round(seg.pct * 100)}%`, background: seg.color }} />
                    </div>
                  </div>
                ))}
                {/* Dominant booking type note */}
                {(() => {
                  const s = selected.stats!;
                  const dominant =
                    s.memberPct > 0.60 ? "member-heavy — a reliable recurring revenue class" :
                    s.classPassPct > 0.35 ? "ClassPass-heavy — high discovery, lower retention" :
                    s.classPackPct > 0.30 ? "class pack-heavy — transactional, moderate loyalty" :
                    "balanced booking mix";
                  return (
                    <p className="text-xs mt-3 leading-relaxed" style={{ color: "#6B7280" }}>
                      This slot is <strong>{dominant}</strong>.
                    </p>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
