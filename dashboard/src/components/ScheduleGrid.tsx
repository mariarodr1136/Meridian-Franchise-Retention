"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { ClassMetric } from "@/types";
import type { ScheduleDay, ScheduleClass } from "@/lib/schedule";

const DAY_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function extractTimeSlot(time: string): string {
  return time.split(" ")[0];
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
  chartData[chartData.length - 1].label = "Now";

  return { dayOfWeek: day, timeSlot: slot, capacity: cap, latestFilled: rows[0].spotsFilled, avgFillRate, trend, memberPct, classPackPct, classPassPct, chartData };
}

interface Props {
  days: ScheduleDay[];
  classMetrics: ClassMetric[];
  scheduleHref: string;
  analyticsHref?: string;
  studioId?: string;
}

function shiftWeek(baseDays: ScheduleDay[], offset: number): ScheduleDay[] {
  if (offset === 0) return baseDays;
  const now = new Date();
  const year = now.getFullYear();
  return baseDays.map((day) => {
    const [rawMm, rawDd] = day.date.split("/").map(Number);
    const d = new Date(year, rawMm - 1, rawDd);
    d.setDate(d.getDate() + offset * 7);
    const newDate = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    const classes = day.classes.map((cls) => {
      const h = Math.floor(cls.startHour);
      const m = Math.round((cls.startHour - h) * 60);
      const classTime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
      return { ...cls, date: newDate, isPast: classTime.getTime() < now.getTime() };
    });
    return { ...day, date: newDate, classes };
  });
}

export function ScheduleGrid({ days, classMetrics, scheduleHref, analyticsHref, studioId }: Props) {
  const [selected, setSelected] = useState<{ cls: ScheduleClass; stats: ClassStats | null } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentDays = useMemo(() => shiftWeek(days, weekOffset), [days, weekOffset]);

  function navigate(delta: number) {
    setWeekOffset((prev) => prev + delta);
    setSelected(null);
  }

  const weekLabel = useMemo(() => {
    if (!currentDays.length) return "";
    return `${currentDays[0].date} – ${currentDays[currentDays.length - 1].date}`;
  }, [currentDays]);

  const statsCache = useMemo(() => {
    const cache = new Map<string, ClassStats | null>();
    for (const day of currentDays) {
      const dow = DAY_NUM[day.day] ?? -1;
      for (const cls of day.classes) {
        const slot = extractTimeSlot(cls.time);
        const key = `${dow}-${slot}`;
        if (!cache.has(key)) cache.set(key, computeStats(classMetrics, dow, slot));
      }
    }
    return cache;
  }, [currentDays, classMetrics]);

  if (!currentDays.length && weekOffset === 0) return null;

  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}`;

  function handleHoverEnter(cls: ScheduleClass, dayStr: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const dow = DAY_NUM[dayStr] ?? -1;
    const slot = extractTimeSlot(cls.time);
    const stats = statsCache.get(`${dow}-${slot}`) ?? null;
    setSelected({ cls, stats });
  }

  function handleHoverLeave() {
    closeTimer.current = setTimeout(() => setSelected(null), 200);
  }

  return (
    <div className="relative">
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid #C8D8EE", boxShadow: "0 2px 12px rgba(74,99,141,0.08)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid #EEF3FB", background: "#FAFCFF" }}
      >
        <div className="flex items-center gap-4">
          {analyticsHref ? (
            <Link
              href={analyticsHref}
              className="text-[11px] font-bold tracking-widest uppercase transition-opacity hover:opacity-70"
              style={{ color: "#4A638D" }}
            >
              Weekly Schedule
            </Link>
          ) : (
            <h3 className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
              Weekly Schedule
            </h3>
          )}

          {studioId && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate(-1)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-colors hover:bg-[#EEF3FB] cursor-pointer"
                style={{ color: "#4A638D" }}
              >
                ‹
              </button>
              <span
                className="text-[11px] tabular-nums font-medium"
                style={{ color: "#6B7280", minWidth: 96, textAlign: "center" }}
              >
                {weekOffset === 0 ? "This week" : weekLabel}
              </span>
              <button
                onClick={() => navigate(1)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-colors hover:bg-[#EEF3FB] cursor-pointer"
                style={{ color: "#4A638D" }}
              >
                ›
              </button>
            </div>
          )}
        </div>

        {analyticsHref && (
          <Link
            href={analyticsHref}
            className="text-[11px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: "#9CA3AF" }}
          >
            View analytics →
          </Link>
        )}
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-4 px-5 py-2"
        style={{ borderBottom: "1px solid #EEF3FB", background: "#FAFCFF" }}
      >
        {[
          { color: "#16a34a", label: "≥80% full" },
          { color: "#d97706", label: "55–79%" },
          { color: "#dc2626", label: "<55%" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* 7-day columns */}
      <div className="grid grid-cols-7">
        {currentDays.map(({ day, date, classes }, colIdx) => {
          const isToday = date === todayStr;
          return (
            <div
              key={date}
              className="flex flex-col min-w-0"
              style={{
                borderRight: colIdx < 6 ? "1px solid #EEF3FB" : "none",
                background: isToday ? "rgba(238,243,251,0.45)" : "transparent",
              }}
            >
              {/* Day header */}
              <div
                className="px-2 py-3 text-center flex flex-col items-center gap-1"
                style={{ borderBottom: "1px solid #EEF3FB" }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: isToday ? "#4A638D" : "#9CA3AF" }}
                >
                  {day}
                </p>
                {isToday ? (
                  <span
                    className="text-[10px] font-bold rounded-full px-1.5 py-0.5 text-white"
                    style={{ background: "#4A638D", letterSpacing: 0 }}
                  >
                    {date}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium" style={{ color: "#374151" }}>
                    {date}
                  </span>
                )}
              </div>

              {/* Classes */}
              <div className="p-1.5 flex flex-col gap-1">
                {classes.length === 0 ? (
                  <div className="flex items-center justify-center py-6">
                    <span style={{ color: "#E5E7EB", fontSize: 16 }}>—</span>
                  </div>
                ) : (
                  classes.map((cls, i) => {
                    const dow = DAY_NUM[day] ?? -1;
                    const slot = extractTimeSlot(cls.time);
                    const stats = statsCache.get(`${dow}-${slot}`);
                    const isSelected = selected?.cls.time === cls.time && selected?.cls.day === cls.day;
                    const fillRate = stats ? stats.latestFilled / stats.capacity : null;
                    const accent = stats ? fillColor(stats.avgFillRate) : "#C8D8EE";

                    return (
                      <button
                        key={i}
                        className="rounded-lg text-left w-full cursor-pointer transition-all"
                        style={{
                          display: "flex",
                          overflow: "hidden",
                          opacity: cls.isPast && !isSelected ? 0.38 : 1,
                          border: `1px solid ${isSelected ? "#4A638D" : "#EEF3FB"}`,
                          boxShadow: isSelected ? "0 2px 10px rgba(74,99,141,0.18)" : "0 1px 2px rgba(74,99,141,0.04)",
                          background: isSelected ? "#4A638D" : "#fff",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          handleHoverEnter(cls, day);
                          if (!isSelected) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "#B8CCE8";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(74,99,141,0.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          handleHoverLeave();
                          if (!isSelected) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "#EEF3FB";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 2px rgba(74,99,141,0.04)";
                          }
                        }}
                      >
                        {/* Left accent strip */}
                        <div
                          style={{
                            width: 3,
                            flexShrink: 0,
                            background: isSelected ? "rgba(255,255,255,0.35)" : accent,
                          }}
                        />
                        <div className="px-1.5 py-1.5 flex-1 min-w-0">
                          <p
                            className="leading-tight truncate font-semibold"
                            style={{ color: isSelected ? "#fff" : "#1F2937", fontSize: "10px" }}
                          >
                            {extractTimeSlot(cls.time)}
                          </p>
                          <p
                            className="leading-tight truncate mt-0.5"
                            style={{ color: isSelected ? "rgba(255,255,255,0.65)" : "#9CA3AF", fontSize: "9px" }}
                          >
                            {cls.instructor}
                          </p>
                          {fillRate !== null && (
                            <div
                              className="mt-1.5 rounded-full overflow-hidden"
                              style={{ height: 2, background: isSelected ? "rgba(255,255,255,0.2)" : "#F0F5FB" }}
                            >
                              <div
                                style={{
                                  width: `${Math.round(fillRate * 100)}%`,
                                  height: "100%",
                                  borderRadius: 9999,
                                  background: isSelected ? "rgba(255,255,255,0.55)" : accent,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="absolute right-4 top-[140px] w-72 rounded-2xl z-30 overflow-hidden"
          style={{
            background: "#fff",
            border: "1px solid #C8D8EE",
            boxShadow: "0 12px 32px rgba(74,99,141,0.16)",
            animation: "popupEnter 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards",
            transformOrigin: "top right",
            willChange: "transform, opacity",
          }}
          onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
          onMouseLeave={() => handleHoverLeave()}
        >
          {/* Panel header */}
          <div
            className="px-4 py-3 flex items-start justify-between"
            style={{ background: "#4A638D" }}
          >
            <div>
              <p className="text-sm font-bold text-white">
                {selected.cls.day} · {extractTimeSlot(selected.cls.time)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                {selected.cls.instructor}
              </p>
              {selected.stats ? (
                <p className="text-[10px] mt-1 font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {selected.stats.latestFilled}/{selected.stats.capacity} spots filled · avg {Math.round(selected.stats.avgFillRate * 100)}%
                </p>
              ) : (
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  No historical data yet
                </p>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-2 cursor-pointer transition-colors"
              style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {selected.stats && (
            <div className="p-4 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 380 }}>
              {/* Fill rate chart */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5" style={{ color: "#9CA3AF" }}>
                  Fill rate · last 8 weeks
                </p>
                <ResponsiveContainer width="100%" height={72}>
                  <AreaChart data={selected.stats.chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4A638D" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4A638D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, background: "#fff", border: "1px solid #EEF3FB", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      formatter={(v) => [`${v}%`, "Fill"]}
                    />
                    <Area type="monotone" dataKey="fill" stroke="#4A638D" strokeWidth={1.5} fill="url(#fillGrad)" dot={{ r: 2, fill: "#4A638D", strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
                <p
                  className="text-[10px] mt-1.5 font-semibold"
                  style={{
                    color: selected.stats.trend === "up" ? "#16a34a"
                      : selected.stats.trend === "down" ? "#dc2626"
                      : "#9CA3AF",
                  }}
                >
                  {selected.stats.trend === "up" ? "↑ Trending up vs. prior avg"
                    : selected.stats.trend === "down" ? "↓ Declining vs. prior avg"
                    : "→ Stable over last 8 weeks"}
                </p>
              </div>

              {/* Booking mix */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-2.5" style={{ color: "#9CA3AF" }}>
                  Booking mix
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Members",     pct: selected.stats.memberPct,    color: "#4A638D" },
                    { label: "Class Packs", pct: selected.stats.classPackPct, color: "#C9A84C" },
                    { label: "ClassPass",   pct: selected.stats.classPassPct, color: "#9CA3AF" },
                  ].map((seg) => (
                    <div key={seg.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px]" style={{ color: "#374151" }}>{seg.label}</span>
                        <span className="text-[11px] font-semibold" style={{ color: seg.color }}>
                          {Math.round(seg.pct * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F0F5FB" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.round(seg.pct * 100)}%`, background: seg.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {(() => {
                  const s = selected.stats!;
                  const dominant =
                    s.memberPct > 0.60 ? "member-heavy — reliable recurring revenue" :
                    s.classPassPct > 0.35 ? "ClassPass-heavy — high discovery, lower retention" :
                    s.classPackPct > 0.30 ? "class pack-heavy — transactional, moderate loyalty" :
                    "balanced booking mix";
                  return (
                    <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "#9CA3AF" }}>
                      This slot is <strong style={{ color: "#6B7280" }}>{dominant}</strong>.
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
