"use client";

import { useState } from "react";
import type { SlotStat, InstructorStat } from "@/types";

const DAY_LABELS: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function parseHour(t: string): number {
  const m = t.match(/^(\d+):(\d+)(am|pm)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  if (m[3].toLowerCase() === "pm" && h !== 12) h += 12;
  if (m[3].toLowerCase() === "am" && h === 12) h = 0;
  return h + min / 60;
}

function heatStyle(rate: number): React.CSSProperties {
  if (rate >= 0.90) return { background: "#4A638D", color: "#fff" };
  if (rate >= 0.75) return { background: "#6B8AB4", color: "#fff" };
  if (rate >= 0.60) return { background: "#A8BFDB", color: "#1F2937" };
  if (rate >= 0.40) return { background: "#C8D8EE", color: "#4A638D" };
  return { background: "#FEE2E2", color: "#B91C1C" };
}

interface Props {
  slotStats: SlotStat[];
  instructorStats: InstructorStat[];
}

export function ScheduleAnalytics({ slotStats, instructorStats }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const activeDays = DAY_ORDER.filter((d) => slotStats.some((s) => s.dayOfWeek === d));
  const timeSlots  = [...new Set(slotStats.map((s) => s.timeSlot))].sort((a, b) => parseHour(a) - parseHour(b));
  const slotLookup = new Map<string, SlotStat>(slotStats.map((s) => [`${s.dayOfWeek}|${s.timeSlot}`, s]));

  const avgFill    = slotStats.length ? slotStats.reduce((s, x) => s + x.avgFillRate, 0) / slotStats.length : 0;
  const highSlots  = slotStats.filter((s) => s.avgFillRate >= 0.80);
  const lowSlots   = slotStats.filter((s) => s.avgFillRate < 0.60).sort((a, b) => a.avgFillRate - b.avgFillRate);

  const buckets = [
    { label: "Morning",   desc: "Before 12pm",  slots: slotStats.filter((s) => parseHour(s.timeSlot) < 12) },
    { label: "Afternoon", desc: "12pm – 5pm",   slots: slotStats.filter((s) => { const h = parseHour(s.timeSlot); return h >= 12 && h < 17; }) },
    { label: "Evening",   desc: "5pm onward",   slots: slotStats.filter((s) => parseHour(s.timeSlot) >= 17) },
  ].filter((b) => b.slots.length > 0);

  return (
    <div className="flex flex-col gap-6">

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Class Slots",      value: slotStats.length,                         sub: "unique time slots" },
          { label: "Avg Fill Rate",    value: `${Math.round(avgFill * 100)}%`,           sub: "across all slots" },
          { label: "Healthy Slots",    value: highSlots.length,                          sub: "≥ 80% fill rate",  accent: "#16a34a" },
          { label: "Needs Attention",  value: lowSlots.length,                           sub: "< 60% fill rate",  accent: lowSlots.length > 0 ? "#DC2626" : "#1F2937" },
        ].map(({ label, value, sub, accent }) => (
          <div key={label} className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: accent ?? "#1F2937" }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div id="heatmap" className="rounded-xl border p-5 scroll-mt-24" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Fill Rate Heatmap</h3>
          <div className="flex items-center gap-3">
            {[
              { label: "< 40%",   bg: "#FEE2E2" },
              { label: "40–60%",  bg: "#C8D8EE" },
              { label: "60–75%",  bg: "#A8BFDB" },
              { label: "75–90%",  bg: "#6B8AB4" },
              { label: "90%+",    bg: "#4A638D" },
            ].map(({ label, bg }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: bg }} />
                <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="text-left pb-3 pr-4 font-medium" style={{ color: "#9CA3AF", minWidth: "70px" }}>Time</th>
                {activeDays.map((d) => (
                  <th key={d} className="pb-3 px-1 font-bold text-center" style={{ color: "#4A638D", minWidth: "56px" }}>
                    {DAY_LABELS[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot, rowIdx) => (
                <tr key={slot}>
                  <td className="py-1 pr-4 font-medium whitespace-nowrap" style={{ color: "#6B7280" }}>{slot}</td>
                  {activeDays.map((d) => {
                    const stat = slotLookup.get(`${d}|${slot}`);
                    const key  = `${d}|${slot}`;
                    if (!stat) return <td key={d} className="py-1 px-1"><div className="h-9 rounded-lg" style={{ background: "#F8FAFD" }} /></td>;
                    const style   = heatStyle(stat.avgFillRate);
                    const isHov   = hovered === key;
                    return (
                      <td key={d} className="py-1 px-1">
                        <div
                          className="relative h-9 rounded-lg flex items-center justify-center font-bold cursor-default select-none"
                          style={{ ...style, transition: "transform 0.15s", transform: isHov ? "scale(1.12)" : "scale(1)", zIndex: isHov ? 10 : "auto" }}
                          onMouseEnter={() => setHovered(key)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          {Math.round(stat.avgFillRate * 100)}%
                          {isHov && (
                            <div
                              className={`absolute ${rowIdx <= 1 ? "top-full mt-2" : "bottom-full mb-2"} left-1/2 -translate-x-1/2 rounded-xl p-3 shadow-xl z-50 whitespace-nowrap pointer-events-none`}
                              style={{ background: "#F0F5FB", color: "#1F2937", border: "1px solid #C8D8EE", boxShadow: "0 4px 16px rgba(74,99,141,0.14)", minWidth: "140px" }}
                            >
                              <p className="font-semibold text-xs mb-2" style={{ color: "#4A638D" }}>{DAY_LABELS[d]} · {slot}</p>
                              {[
                                { label: "Members",     pct: stat.avgMemberPct, color: "#4A638D" },
                                { label: "Class Packs", pct: stat.avgPackPct,   color: "#C9A84C" },
                                { label: "ClassPass",   pct: stat.avgPassPct,   color: "#9CA3AF" },
                              ].map(({ label, pct, color }) => (
                                <div key={label} className="flex items-center justify-between gap-4 text-[10px] mb-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                                    <span style={{ color: "#6B7280" }}>{label}</span>
                                  </div>
                                  <span className="font-semibold" style={{ color: "#1F2937" }}>{Math.round(pct * 100)}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructor performance */}
      {instructorStats.length > 0 && (
        <div id="instructors" className="rounded-xl border p-5 scroll-mt-24" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
          <h3 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#4A638D" }}>Instructor Fill Rates</h3>
          <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Average fill across each instructor's scheduled classes this week</p>
          <div className="grid grid-cols-2 gap-3">
            {instructorStats.map((instr) => {
              const pct   = Math.round(instr.avgFillRate * 100);
              const color = pct >= 75 ? "#16a34a" : pct >= 55 ? "#d97706" : "#dc2626";
              return (
                <div key={instr.name} className="rounded-lg p-4" style={{ background: "#F8FAFD", border: "1px solid #EEF3FB" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold truncate mr-2" style={{ color: "#1F2937" }}>{instr.name}</p>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "#EEF3FB" }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                    {instr.classCount} class{instr.classCount !== 1 ? "es" : ""} this week
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Needs attention + Top performers */}
      <div id="slot-performance" className="grid grid-cols-2 gap-4 scroll-mt-24">
        {lowSlots.length > 0 && (
          <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#DC2626" }}>Needs Attention</h3>
            <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Slots consistently below 60% fill</p>
            <div className="flex flex-col gap-1.5">
              {lowSlots.slice(0, 10).map((s) => (
                <div key={`${s.dayOfWeek}-${s.timeSlot}`} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#FEF2F2" }}>
                  <span className="text-xs font-medium" style={{ color: "#374151" }}>{DAY_LABELS[s.dayOfWeek]} · {s.timeSlot}</span>
                  <span className="text-xs font-bold" style={{ color: "#DC2626" }}>{Math.round(s.avgFillRate * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {highSlots.length > 0 && (
          <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#16a34a" }}>Top Performers</h3>
            <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Slots consistently at 80%+ fill</p>
            <div className="flex flex-col gap-1.5">
              {[...highSlots].sort((a, b) => b.avgFillRate - a.avgFillRate).slice(0, 10).map((s) => (
                <div key={`${s.dayOfWeek}-${s.timeSlot}`} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "#F0FDF4" }}>
                  <span className="text-xs font-medium" style={{ color: "#374151" }}>{DAY_LABELS[s.dayOfWeek]} · {s.timeSlot}</span>
                  <span className="text-xs font-bold" style={{ color: "#16a34a" }}>{Math.round(s.avgFillRate * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Booking mix by time of day */}
      {buckets.length > 0 && (
        <div id="booking-mix" className="rounded-xl border p-5 scroll-mt-24" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
          <h3 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>Booking Mix by Time of Day</h3>
          <div className="grid grid-cols-3 gap-4">
            {buckets.map(({ label, desc, slots }) => {
              const avgFillBucket = slots.reduce((s, x) => s + x.avgFillRate, 0) / slots.length;
              const memberPct = slots.reduce((s, x) => s + x.avgMemberPct, 0) / slots.length;
              const packPct   = slots.reduce((s, x) => s + x.avgPackPct,   0) / slots.length;
              const passPct   = Math.max(0, 1 - memberPct - packPct);
              const segs = [
                { label: "Members",     pct: memberPct, color: "#4A638D" },
                { label: "Class Packs", pct: packPct,   color: "#C9A84C" },
                { label: "ClassPass",   pct: passPct,   color: "#9CA3AF" },
              ];
              return (
                <div key={label} className="rounded-xl p-4" style={{ background: "#F8FAFD", border: "1px solid #EEF3FB" }}>
                  <p className="text-sm font-bold mb-0.5" style={{ color: "#1F2937" }}>{label}</p>
                  <p className="text-[10px] mb-3" style={{ color: "#9CA3AF" }}>{desc} · {Math.round(avgFillBucket * 100)}% avg fill</p>
                  <div className="flex h-3 rounded-full overflow-hidden mb-3 gap-px">
                    {segs.map((seg) => (
                      <div key={seg.label} style={{ width: `${seg.pct * 100}%`, background: seg.color }} />
                    ))}
                  </div>
                  {segs.map((seg) => (
                    <div key={seg.label} className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                        <span className="text-[10px]" style={{ color: "#6B7280" }}>{seg.label}</span>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: "#374151" }}>{Math.round(seg.pct * 100)}%</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
