"use client";

import { ScheduleGrid } from "@/components/ScheduleGrid";
import { ScheduleAnalytics } from "@/components/ScheduleAnalytics";
import { MetricsComparison } from "@/components/MetricsComparison";
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


export function ClassesPageContent({
  studioId, studioName, metrics, current, classMetrics,
  reviews, schedule, scheduleHref,
  slotStats, instructorStats, hasSchedule,
}: Props) {

  // Booking mix from current week
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

  return (
    <div className="flex flex-col gap-6">

      {/* ── HOW CLIENTS BOOK ─────────────────────────────────── */}
      {bookingSegments.length > 0 && (
        <section id="booking" className="scroll-mt-24">
          <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <h3 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>How Clients Book</h3>
            <div className="flex h-5 rounded-full overflow-hidden mb-5 gap-0.5">
              {bookingSegments.map((s) => (
                <div key={s.label} style={{ width: `${s.pct * 100}%`, background: s.color }} title={`${s.label}: ${s.value}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {bookingSegments.map((s) => (
                <div key={s.label} className="rounded-xl p-4" style={{ background: "#F8FAFD" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "#1F2937" }}>{s.value.toLocaleString()}</p>
                  <p className="text-xs mt-1" style={{ color: "#4A638D" }}>{Math.round(s.pct * 100)}% of bookings</p>
                </div>
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

      {/* ── SLOT & INSTRUCTOR ANALYTICS ──────────────────────── */}
      {(slotStats.length > 0 || instructorStats.length > 0) && (
        <section id="analytics" className="scroll-mt-24">
          <ScheduleAnalytics slotStats={slotStats} instructorStats={instructorStats} />
        </section>
      )}

      {/* ── COMPARE PERIODS ──────────────────────────────────── */}
      {metrics.length >= 2 && (
        <section id="periods" className="scroll-mt-24">
          <MetricsComparison metrics={metrics} />
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
    </div>
  );
}
