"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import type { SlotStat, InstructorStat } from "@/types";
import { assignStaffPhotos } from "@/lib/staffPhotos";

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
  hideBookingMix?: boolean;
}

// ── BookingBucketCard ──────────────────────────────────────────────────────────

function BookingBucketCard({ label, desc, slots }: {
  label: string;
  desc: string;
  slots: SlotStat[];
}) {
  const [hov, setHov] = useState(false);

  const avgFillBucket = slots.reduce((s, x) => s + x.avgFillRate, 0) / slots.length;
  const memberPct = slots.reduce((s, x) => s + x.avgMemberPct, 0) / slots.length;
  const packPct   = slots.reduce((s, x) => s + x.avgPackPct,   0) / slots.length;
  const passPct   = Math.max(0, 1 - memberPct - packPct);
  const segs = [
    { label: "Members",     pct: memberPct, color: "#4A638D" },
    { label: "Class Packs", pct: packPct,   color: "#C9A84C" },
    { label: "ClassPass",   pct: passPct,   color: "#9CA3AF" },
  ];
  const wdSlots = slots.filter((s) => s.dayOfWeek >= 1 && s.dayOfWeek <= 5);
  const weSlots = slots.filter((s) => s.dayOfWeek === 0 || s.dayOfWeek === 6);
  const topSlot = [...slots].sort((a, b) => b.avgFillRate - a.avgFillRate)[0];
  const dominant = [...segs].sort((a, b) => b.pct - a.pct)[0];

  return (
    <div
      className="rounded-xl p-4 relative cursor-default"
      style={{
        background:  "#F8FAFD",
        border:      `1px solid ${hov ? "#4A638D" : "#EEF3FB"}`,
        transform:   hov ? "translateY(-3px)" : "translateY(0)",
        boxShadow:   hov ? "0 8px 20px rgba(74,99,141,0.13)" : "none",
        transition:  "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <p className="text-sm font-bold mb-0.5" style={{ color: "#1F2937" }}>{label}</p>
      <p className="text-[10px] mb-1" style={{ color: "#9CA3AF" }}>{desc} · {slots.length} slot{slots.length !== 1 ? "s" : ""}</p>
      <p className="text-[10px] font-semibold mb-3" style={{ color: "#4A638D" }}>{Math.round(avgFillBucket * 100)}% avg fill</p>
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
      {wdSlots.length > 0 && weSlots.length > 0 && (
        <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid #E5EDF8" }}>
          <div className="flex-1 rounded-lg p-2 text-center" style={{ background: "#EEF3FB" }}>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9CA3AF" }}>Weekdays</p>
            <p className="text-xs font-bold" style={{ color: "#4A638D" }}>{Math.round(wdSlots.reduce((s, x) => s + x.avgFillRate, 0) / wdSlots.length * 100)}%</p>
          </div>
          <div className="flex-1 rounded-lg p-2 text-center" style={{ background: "#EEF3FB" }}>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#9CA3AF" }}>Weekends</p>
            <p className="text-xs font-bold" style={{ color: "#4A638D" }}>{Math.round(weSlots.reduce((s, x) => s + x.avgFillRate, 0) / weSlots.length * 100)}%</p>
          </div>
        </div>
      )}

      {/* Hover popup */}
      <div
        className="absolute left-0 right-0 bottom-full mb-2 rounded-xl border p-4 z-50"
        style={{
          background:    "#fff",
          borderColor:   "#4A638D",
          boxShadow:     "0 8px 28px rgba(74,99,141,0.18)",
          opacity:       hov ? 1 : 0,
          transform:     hov ? "translateY(0)" : "translateY(4px)",
          pointerEvents: "none",
          transition:    "opacity 160ms ease, transform 160ms ease",
        }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: "#4A638D" }}>{label} breakdown</p>
        {[
          { label: "Avg fill rate",   value: `${Math.round(avgFillBucket * 100)}%` },
          { label: "Total slots",     value: String(slots.length) },
          { label: "Dominant source", value: dominant.label },
          ...(topSlot ? [{ label: "Best slot", value: `${DAY_LABELS[topSlot.dayOfWeek]} · ${topSlot.timeSlot} (${Math.round(topSlot.avgFillRate * 100)}%)` }] : []),
          ...(wdSlots.length > 0 ? [{ label: "Weekday avg", value: `${Math.round(wdSlots.reduce((s, x) => s + x.avgFillRate, 0) / wdSlots.length * 100)}%` }] : []),
          ...(weSlots.length > 0 ? [{ label: "Weekend avg", value: `${Math.round(weSlots.reduce((s, x) => s + x.avgFillRate, 0) / weSlots.length * 100)}%` }] : []),
        ].map(({ label: l, value: v }) => (
          <div key={l} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid #F0F5FB" }}>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>{l}</span>
            <span className="text-xs font-semibold" style={{ color: "#1F2937" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PillButton ─────────────────────────────────────────────────────────────────

function PillButton({ label, active, color, bg, activeBg, onClick }: {
  label: string; active: boolean; color: string; bg: string; activeBg: string; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        background:  active ? activeBg : hov ? color : bg,
        color:       active || hov ? "#fff" : color,
        border:      `1px solid ${active || hov ? activeBg : color}33`,
        transform:   hov && !active ? "translateY(-1px)" : "translateY(0)",
        boxShadow:   hov && !active ? `0 3px 8px ${color}33` : "none",
        transition:  "background 150ms ease, color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {label}
    </button>
  );
}

// ── PageButton ─────────────────────────────────────────────────────────────────

function PageButton({ children, active, disabled, onClick }: {
  children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
      style={{
        background:  active ? "#4A638D" : hov && !disabled ? "#EEF3FB" : "#F8FAFD",
        color:       active ? "#fff" : disabled ? "#C8D8EE" : hov ? "#4A638D" : "#6B7280",
        border:      `1px solid ${active ? "#4A638D" : "#C8D8EE"}`,
        transform:   hov && !disabled && !active ? "translateY(-1px)" : "translateY(0)",
        boxShadow:   hov && !disabled && !active ? "0 2px 6px rgba(74,99,141,0.15)" : "none",
        transition:  "background 150ms ease, color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
        cursor:      disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
}

// ── Instructor Card ────────────────────────────────────────────────────────────

function InstructorCard({ instr, photo }: { instr: InstructorStat; photo?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered]   = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const pct        = Math.round(instr.avgFillRate * 100);
  const fillColor  = "#4A638D";
  const fillBg     = "#EEF3FB";
  const fillBorder = "#C8D8EE";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border:     `1px solid ${expanded ? "#4A638D" : hovered ? "#A8BFDB" : "#C8D8EE"}`,
        background: "#fff",
        boxShadow:  expanded ? "0 4px 16px rgba(74,99,141,0.12)" : hovered ? "0 4px 12px rgba(74,99,141,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform:  !expanded && hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header row */}
      <button
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
        style={{ display: "block", cursor: "pointer" }}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border" style={{ borderColor: "#C8D8EE" }}>
            {photo ? (
              <Image src={photo} alt={instr.name} width={36} height={36} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm" style={{ background: "linear-gradient(135deg, #4A638D 0%, #6B8AB4 100%)", color: "#fff" }}>
                {instr.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#1F2937" }}>{instr.name}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
              {instr.classCount} class{instr.classCount !== 1 ? "es" : ""} this week
            </p>
          </div>

          <div
            className="flex-shrink-0 rounded-lg px-3 py-1.5"
            style={{ background: fillBg, border: `1px solid ${fillBorder}` }}
          >
            <span className="text-sm font-bold" style={{ color: fillColor }}>{pct}%</span>
          </div>

          <div
            className="flex-shrink-0 ml-1"
            style={{
              color: "#9CA3AF",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 250ms ease",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Fill bar */}
        <div className="px-5 pb-4">
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "#EEF3FB" }}>
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: fillColor }}
            />
          </div>
        </div>
      </button>

      {/* Smooth expand panel */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: "grid-template-rows 280ms ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            ref={detailRef}
            className="px-5 pb-5"
            style={{ borderTop: "1px solid #F0F5FB" }}
          >
            <div className="pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>Fill Rate</p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-bold" style={{ color: fillColor }}>{pct}%</span>
                  <span className="text-xs mb-1" style={{ color: "#9CA3AF" }}>avg across their slots</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#EEF3FB" }}>
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: expanded ? `${pct}%` : "0%", background: fillColor }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px]" style={{ color: "#9CA3AF" }}>0%</span>
                  <span className="text-[10px]" style={{ color: "#9CA3AF" }}>100%</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>
                  Classes They Teach
                </p>
                {instr.classes.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {instr.classes.map((cls) => (
                      <div
                        key={cls}
                        className="flex items-center gap-2 rounded-lg px-3 py-2"
                        style={{ background: "#F0F5FB" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4A638D" }} />
                        <span className="text-xs font-medium" style={{ color: "#1F2937" }}>{cls}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Class names not available from schedule.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 4;
type FilterTier = "all" | "strong" | "moderate" | "low";

export function ScheduleAnalytics({ slotStats, instructorStats, hideBookingMix = false }: Props) {
  const [hovered, setHovered]   = useState<string | null>(null);
  const [filter, setFilter]     = useState<FilterTier>("all");
  const [page, setPage]         = useState(1);

  const activeDays = DAY_ORDER.filter((d) => slotStats.some((s) => s.dayOfWeek === d));
  const timeSlots  = [...new Set(slotStats.map((s) => s.timeSlot))].sort((a, b) => parseHour(a) - parseHour(b));
  const slotLookup = new Map<string, SlotStat>(slotStats.map((s) => [`${s.dayOfWeek}|${s.timeSlot}`, s]));

  const lowSlots  = slotStats.filter((s) => s.avgFillRate < 0.60).sort((a, b) => a.avgFillRate - b.avgFillRate);
  const highSlots = slotStats.filter((s) => s.avgFillRate >= 0.80).sort((a, b) => b.avgFillRate - a.avgFillRate);

  return (
    <div className="flex flex-col gap-6">

      {/* ── FILL RATE HEATMAP ─────────────────────────────────── */}
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

      {/* ── INSTRUCTOR FILL RATES ─────────────────────────────── */}
      {instructorStats.length > 0 && (() => {
        const photoMap = assignStaffPhotos(instructorStats.map((i) => i.name));
        const filtered = instructorStats.filter((i) => {
          const pct = Math.round(i.avgFillRate * 100);
          if (filter === "strong")   return pct >= 75;
          if (filter === "moderate") return pct >= 55 && pct < 75;
          if (filter === "low")      return pct < 55;
          return true;
        });
        const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
        const safePage   = Math.min(page, totalPages || 1);
        const visible    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

        const pills: { key: FilterTier; label: string; color: string; bg: string; activeBg: string }[] = [
          { key: "all",      label: "All",      color: "#4A638D", bg: "#F0F5FB", activeBg: "#4A638D" },
          { key: "strong",   label: "Strong",   color: "#4A638D", bg: "#F0F5FB", activeBg: "#4A638D" },
          { key: "moderate", label: "Moderate", color: "#4A638D", bg: "#F0F5FB", activeBg: "#4A638D" },
          { key: "low",      label: "Low",      color: "#4A638D", bg: "#F0F5FB", activeBg: "#4A638D" },
        ];

        return (
          <div id="instructors" className="rounded-xl border p-5 scroll-mt-24" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#4A638D" }}>Instructor Fill Rates</h3>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Average fill across each instructor's classes</p>
              </div>
              {/* Filter pills */}
              <div className="flex items-center gap-2">
                {pills.map(({ key, label, color, bg, activeBg }) => {
                  const active = filter === key;
                  return (
                    <PillButton
                      key={key}
                      label={label}
                      active={active}
                      color={color}
                      bg={bg}
                      activeBg={activeBg}
                      onClick={() => { setFilter(key); setPage(1); }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3">
              {visible.length > 0 ? (
                visible.map((instr) => <InstructorCard key={instr.name} instr={instr} photo={photoMap.get(instr.name)} />)
              ) : (
                <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>No instructors in this tier.</p>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <PageButton disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 9L4.5 6l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </PageButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PageButton key={p} active={p === safePage} onClick={() => setPage(p)}>
                    {p}
                  </PageButton>
                ))}
                <PageButton disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </PageButton>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── NEEDS ATTENTION + TOP PERFORMERS ─────────────────── */}
      <div id="slot-performance" className="grid grid-cols-2 gap-4 scroll-mt-24">
        {lowSlots.length > 0 && (
          <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#4A638D" }}>Needs Attention</h3>
            <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Slots consistently below 60% fill</p>
            <div className="relative">
              {lowSlots.length > 4 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10 rounded-b-lg"
                  style={{ background: "linear-gradient(to bottom, transparent, #fff)" }} />
              )}
              <div
                className="flex flex-col gap-1.5"
                style={{ maxHeight: "160px", overflowY: "auto", scrollbarWidth: "none" } as React.CSSProperties}
              >
                {lowSlots.slice(0, 10).map((s) => (
                  <div
                    key={`${s.dayOfWeek}-${s.timeSlot}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg cursor-default"
                    style={{ background: "#EEF3FB", transition: "background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease" }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.background = "#C8D8EE";
                      el.style.transform = "translateX(3px)";
                      el.style.boxShadow = "0 2px 8px rgba(74,99,141,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.background = "#EEF3FB";
                      el.style.transform = "translateX(0)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    <span className="text-xs font-medium" style={{ color: "#374151" }}>{DAY_LABELS[s.dayOfWeek]} · {s.timeSlot}</span>
                    <span className="text-xs font-bold" style={{ color: "#4A638D" }}>{Math.round(s.avgFillRate * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {highSlots.length > 0 && (
          <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#1B3352" }}>Top Performers</h3>
            <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Slots consistently at 80%+ fill</p>
            <div className="relative">
              {highSlots.length > 4 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10 rounded-b-lg"
                  style={{ background: "linear-gradient(to bottom, transparent, #fff)" }} />
              )}
              <div
                className="flex flex-col gap-1.5"
                style={{ maxHeight: "160px", overflowY: "auto", scrollbarWidth: "none" } as React.CSSProperties}
              >
                {highSlots.slice(0, 10).map((s) => (
                  <div
                    key={`${s.dayOfWeek}-${s.timeSlot}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg cursor-default"
                    style={{ background: "#EEF3FB", transition: "background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease" }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      el.style.background = "#C8D8EE";
                      el.style.transform = "translateX(3px)";
                      el.style.boxShadow = "0 2px 8px rgba(74,99,141,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget;
                      el.style.background = "#EEF3FB";
                      el.style.transform = "translateX(0)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    <span className="text-xs font-medium" style={{ color: "#374151" }}>{DAY_LABELS[s.dayOfWeek]} · {s.timeSlot}</span>
                    <span className="text-xs font-bold" style={{ color: "#1B3352" }}>{Math.round(s.avgFillRate * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!hideBookingMix && <BookingMixSection slotStats={slotStats} />}
    </div>
  );
}

// ── BookingMixSection (exported for use outside ScheduleAnalytics) ─────────────

export function BookingMixSection({ slotStats }: { slotStats: SlotStat[] }) {
  const weekdaySlots = slotStats.filter((s) => s.dayOfWeek >= 1 && s.dayOfWeek <= 5);
  const weekendSlots = slotStats.filter((s) => s.dayOfWeek === 0 || s.dayOfWeek === 6);
  const buckets = [
    { label: "Morning",   desc: "Before 12pm",  slots: slotStats.filter((s) => parseHour(s.timeSlot) < 12) },
    { label: "Afternoon", desc: "12pm – 5pm",   slots: slotStats.filter((s) => { const h = parseHour(s.timeSlot); return h >= 12 && h < 17; }) },
    { label: "Evening",   desc: "5pm onward",   slots: slotStats.filter((s) => parseHour(s.timeSlot) >= 17) },
  ].filter((b) => b.slots.length > 0);

  if (buckets.length === 0) return null;

  return (
    <div id="booking-mix" className="rounded-xl border p-5 scroll-mt-24" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      <div className="mb-4">
        <h3 className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#4A638D" }}>Booking Mix by Time of Day</h3>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>
          Who books each part of the day — averaged across all slots in that window, Mon–Sun.
          {weekdaySlots.length > 0 && weekendSlots.length > 0 && (
            <> Weekday avg: <strong style={{ color: "#4A638D" }}>{Math.round(weekdaySlots.reduce((s, x) => s + x.avgFillRate, 0) / weekdaySlots.length * 100)}%</strong> fill · Weekend avg: <strong style={{ color: "#4A638D" }}>{Math.round(weekendSlots.reduce((s, x) => s + x.avgFillRate, 0) / weekendSlots.length * 100)}%</strong> fill.</>
          )}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {buckets.map(({ label, desc, slots }) => (
          <BookingBucketCard key={label} label={label} desc={desc} slots={slots} />
        ))}
      </div>
    </div>
  );
}
