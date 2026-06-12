"use client";

import { useState } from "react";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { ScheduleAnalytics, BookingMixSection } from "@/components/ScheduleAnalytics";
import { ReviewsScroll } from "@/components/ReviewsScroll";
import type { StudioMetric, Instructor, Review, ClassMetric, SlotStat, InstructorStat } from "@/types";
import type { ScheduleDay } from "@/lib/schedule";

interface Props {
  studioId:        string;
  studioName:      string;
  metrics:         StudioMetric[];
  current:         StudioMetric | null;
  classMetrics:    ClassMetric[];
  instructors:     Instructor[];
  reviews:         Review[];
  schedule:        ScheduleDay[];
  scheduleHref:    string;
  slotStats:       SlotStat[];
  instructorStats: InstructorStat[];
  hasSchedule:     boolean;
}

interface StatDetail { label: string; value: string }

// ── StatBubble ─────────────────────────────────────────────────────────────────

function StatBubble({
  label, value, sub, description, details, accent = "#4A638D", accentBg = "#fff", borderColor = "#C8D8EE",
}: {
  label: string; value: string; sub: string; description: string;
  details: StatDetail[]; accent?: string; accentBg?: string; borderColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="rounded-xl border p-5 relative cursor-default select-none"
      style={{
        background:  accentBg,
        borderColor: hovered ? accent : borderColor,
        boxShadow:   hovered ? `0 8px 24px rgba(74,99,141,0.15)` : "0 1px 3px rgba(0,0,0,0.04)",
        transform:   hovered ? "translateY(-2px)" : "translateY(0)",
        transition:  "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-xs mb-1" style={{ color: accent, opacity: 0.7 }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: accent, opacity: 0.6 }}>{sub}</p>
      <div
        className="absolute left-0 right-0 bottom-full mb-2 rounded-xl border p-4 z-50"
        style={{
          background:    "#fff",
          borderColor:   accent,
          boxShadow:     "0 8px 28px rgba(74,99,141,0.18)",
          opacity:       hovered ? 1 : 0,
          transform:     hovered ? "translateY(0)" : "translateY(4px)",
          pointerEvents: hovered ? "auto" : "none",
          transition:    "opacity 150ms ease, transform 150ms ease",
        }}
      >
        <p className="text-xs mb-3" style={{ color: accent }}>{description}</p>
        {details.map(({ label: dl, value: dv }) => (
          <div key={dl} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid #F0F5FB" }}>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>{dl}</span>
            <span className="text-xs font-semibold" style={{ color: "#1F2937" }}>{dv}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BookingCard ────────────────────────────────────────────────────────────────

function BookingCard({ segment: s }: { segment: { label: string; value: number; color: string; pct: number } }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      className="rounded-xl p-4 cursor-default"
      style={{
        background:  "#F8FAFD",
        border:      `1px solid ${hov ? s.color : "#EEF3FB"}`,
        transform:   hov ? "translateY(-3px)" : "translateY(0)",
        boxShadow:   hov ? `0 6px 18px ${s.color}22` : "none",
        transition:  "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
        <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>{s.label}</span>
      </div>
      <p className="text-xl font-bold mb-0.5" style={{ color: "#1F2937" }}>{s.value.toLocaleString()}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#E5EDF8" }}>
          <div className="h-1 rounded-full" style={{ width: `${s.pct * 100}%`, background: s.color }} />
        </div>
        <span className="text-xs font-bold flex-shrink-0" style={{ color: s.color }}>{Math.round(s.pct * 100)}%</span>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

export function ClassesPageContent({
  studioId, studioName, metrics, current, classMetrics,
  reviews, schedule, scheduleHref,
  slotStats, instructorStats, hasSchedule,
}: Props) {

  const bookingTotal = current
    ? current.memberBookings + current.classPackBookings + current.classPassBookings
    : 0;
  const bookingSegments = current && bookingTotal > 0
    ? [
        { label: "Members",     value: current.memberBookings,    color: "#4A638D", pct: current.memberBookings    / bookingTotal },
        { label: "Class Packs", value: current.classPackBookings, color: "#C9A84C", pct: current.classPackBookings / bookingTotal },
        { label: "ClassPass",   value: current.classPassBookings, color: "#9CA3AF", pct: current.classPassBookings / bookingTotal },
      ]
    : [];

  const avgFill   = slotStats.length ? slotStats.reduce((s, x) => s + x.avgFillRate, 0) / slotStats.length : 0;
  const highSlots = slotStats.filter((s) => s.avgFillRate >= 0.80).sort((a, b) => b.avgFillRate - a.avgFillRate);
  const lowSlots  = slotStats.filter((s) => s.avgFillRate < 0.60).sort((a, b) => a.avgFillRate - b.avgFillRate);
  const hasBubbles = slotStats.length > 0;

  return (
    <div className="flex flex-col gap-6">

      {/* ── STAT BUBBLES ─────────────────────────────────────── */}
      {hasBubbles && (
        <div className="grid grid-cols-4 gap-4" style={{ zIndex: 10, position: "relative" }}>
          <StatBubble
            label="Class Slots"
            value={String(slotStats.length)}
            sub="unique time slots"
            description="Total distinct day/time combinations on the schedule."
            details={[
              { label: "Mon–Fri slots", value: String(slotStats.filter((s) => s.dayOfWeek >= 1 && s.dayOfWeek <= 5).length) },
              { label: "Weekend slots", value: String(slotStats.filter((s) => s.dayOfWeek === 0 || s.dayOfWeek === 6).length) },
              { label: "Weeks of data", value: String(slotStats[0]?.weekCount ?? 0) },
            ]}
          />
          <StatBubble
            label="Avg Fill Rate"
            value={`${Math.round(avgFill * 100)}%`}
            sub="across all slots"
            description="Average fill rate across every scheduled slot this week."
            details={[
              { label: "Slots above 80%", value: String(highSlots.length) },
              { label: "Slots 60–80%",    value: String(slotStats.filter((s) => s.avgFillRate >= 0.60 && s.avgFillRate < 0.80).length) },
              { label: "Slots below 60%", value: String(lowSlots.length) },
            ]}
          />
          <StatBubble
            label="Healthy Slots"
            value={String(highSlots.length)}
            sub="≥ 80% fill rate"
            description="Slots consistently filling at 80% or higher."
            details={highSlots.slice(0, 3).map((s) => ({
              label: `${DAY_LABELS[s.dayOfWeek]} · ${s.timeSlot}`,
              value: `${Math.round(s.avgFillRate * 100)}%`,
            }))}
            accent="#1B3352"
            borderColor="#C8D8EE"
          />
          <StatBubble
            label="Needs Attention"
            value={String(lowSlots.length)}
            sub="< 60% fill rate"
            description="Slots regularly falling below 60% — opportunities to boost demand."
            details={lowSlots.slice(0, 3).map((s) => ({
              label: `${DAY_LABELS[s.dayOfWeek]} · ${s.timeSlot}`,
              value: `${Math.round(s.avgFillRate * 100)}%`,
            }))}
            accent="#4A638D"
            borderColor="#C8D8EE"
          />
        </div>
      )}

      {/* ── HOW CLIENTS BOOK ─────────────────────────────────── */}
      {bookingSegments.length > 0 && (
        <section id="booking" className="scroll-mt-24">
          <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: "#4A638D" }}>How Clients Book</h3>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Booking source mix · this week</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: "#1F2937" }}>{bookingTotal.toLocaleString()}</p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>total bookings</p>
              </div>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden mb-5 gap-px">
              {bookingSegments.map((s) => (
                <div key={s.label} style={{ width: `${s.pct * 100}%`, background: s.color, transition: "width 0.3s ease" }} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {bookingSegments.map((s) => (
                <BookingCard key={s.label} segment={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WEEKLY SCHEDULE ───────────────────────────────────── */}
      {hasSchedule && (
        <section id="schedule" className="scroll-mt-24">
          <ScheduleGrid
            days={schedule}
            classMetrics={classMetrics}
            scheduleHref={scheduleHref}
            studioId={studioId}
          />
        </section>
      )}

      {/* ── REVIEWS ──────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section id="reviews" className="scroll-mt-24">
          <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <ReviewsScroll reviews={reviews} studioId={studioId} studioName={studioName} />
          </div>
        </section>
      )}

      {/* ── BOOKING MIX BY TIME OF DAY ───────────────────────── */}
      {slotStats.length > 0 && <BookingMixSection slotStats={slotStats} />}

      {/* ── HEATMAP + INSTRUCTORS ─────────────────────────────── */}
      {(slotStats.length > 0 || instructorStats.length > 0) && (
        <ScheduleAnalytics slotStats={slotStats} instructorStats={instructorStats} hideBookingMix />
      )}
    </div>
  );
}
