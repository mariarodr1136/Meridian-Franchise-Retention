"use client";

import { useState, useMemo } from "react";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { ScheduleAnalytics } from "@/components/ScheduleAnalytics";
import { MetricsComparison } from "@/components/MetricsComparison";
import { formatPercent } from "@/lib/utils";
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

const STAR = "★";
const EMPTY_STAR = "☆";

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "#C9A84C", fontSize: 13 }}>
      {Array.from({ length: 5 }, (_, i) => (i < rating ? STAR : EMPTY_STAR)).join("")}
    </span>
  );
}

function sourceBadge(source: string) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{
        background: source === "google" ? "#EEF3FB" : "#F5F3FF",
        color:      source === "google" ? "#4A638D" : "#6D28D9",
      }}
    >
      {source === "google" ? "Google" : "ClassPass"}
    </span>
  );
}

function reviewDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function matchInstructor(body: string, instructors: Instructor[]): Instructor | null {
  const lower = body.toLowerCase();
  for (const inst of instructors) {
    const first = inst.name.split(" ")[0].toLowerCase();
    if (first.length >= 4 && lower.includes(first)) return inst;
    if (lower.includes(inst.name.toLowerCase())) return inst;
  }
  return null;
}

export function ClassesPageContent({
  studioId, studioName, metrics, current, classMetrics,
  instructors, reviews, schedule, scheduleHref,
  slotStats, instructorStats, hasSchedule,
}: Props) {

  const [reviewFilter, setReviewFilter] = useState<string>("all");

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

  // Group reviews by matched instructor
  const reviewGroups = useMemo(() => {
    const groups = new Map<string, { instructor: Instructor | null; reviews: Review[] }>();
    groups.set("__general__", { instructor: null, reviews: [] });

    for (const rev of reviews) {
      const matched = matchInstructor(rev.body, instructors.filter(i => i.role === "instructor" || i.role === "studio_lead"));
      if (matched) {
        if (!groups.has(matched.id)) groups.set(matched.id, { instructor: matched, reviews: [] });
        groups.get(matched.id)!.reviews.push(rev);
      } else {
        groups.get("__general__")!.reviews.push(rev);
      }
    }

    return Array.from(groups.entries())
      .filter(([, g]) => g.reviews.length > 0)
      .sort(([a], [b]) => a === "__general__" ? 1 : b === "__general__" ? -1 : 0);
  }, [reviews, instructors]);

  const reviewGroupIds = [
    { key: "all", label: "All Reviews" },
    ...reviewGroups.map(([key, g]) => ({
      key,
      label: g.instructor ? g.instructor.name : "General",
    })),
  ];

  const visibleReviews = useMemo(() => {
    if (reviewFilter === "all") return reviews.slice().sort((a, b) => b.reviewDate.localeCompare(a.reviewDate));
    const group = reviewGroups.find(([k]) => k === reviewFilter);
    return group ? group[1].reviews : [];
  }, [reviewFilter, reviews, reviewGroups]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : null;

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

      {/* ── REVIEWS BY INSTRUCTOR ────────────────────────────── */}
      {reviews.length > 0 && (
        <section id="reviews" className="scroll-mt-24">
          <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EEF3FB" }}>
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Reviews</p>
                {avgRating !== null && (
                  <div className="flex items-center gap-1.5">
                    <Stars rating={Math.round(avgRating)} />
                    <span className="text-xs font-semibold" style={{ color: "#1F2937" }}>{avgRating.toFixed(1)}</span>
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>({reviews.length})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Instructor filter tabs */}
            {reviewGroups.length > 1 && (
              <div className="px-5 py-3 flex gap-2 overflow-x-auto" style={{ borderBottom: "1px solid #EEF3FB", background: "#F8FAFD" }}>
                {reviewGroupIds.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setReviewFilter(key)}
                    className="text-xs px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 transition-all"
                    style={
                      reviewFilter === key
                        ? { background: "#4A638D", color: "#fff", fontWeight: 600 }
                        : { background: "#EEF3FB", color: "#6B7280" }
                    }
                  >
                    {label}
                    {key !== "all" && (
                      <span className="ml-1.5 opacity-60">
                        ({key === "__general__"
                          ? reviewGroups.find(([k]) => k === "__general__")?.[1].reviews.length ?? 0
                          : reviewGroups.find(([k]) => k === key)?.[1].reviews.length ?? 0})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Instructor context bar */}
            {reviewFilter !== "all" && reviewFilter !== "__general__" && (() => {
              const group = reviewGroups.find(([k]) => k === reviewFilter);
              const inst = group?.[1].instructor;
              if (!inst) return null;
              const certColor = inst.certificationStatus === "certified" ? "#16A34A" : inst.certificationStatus === "pending" ? "#D97706" : "#DC2626";
              return (
                <div className="px-5 py-3 flex items-center gap-4" style={{ background: "#EEF3FB", borderBottom: "1px solid #C8D8EE" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#4A638D" }}>
                    {inst.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{inst.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#6B7280" }}>{inst.role.replace(/_/g, " ")}</span>
                      <span className="text-xs font-medium" style={{ color: certColor }}>● {inst.certificationStatus}</span>
                      {inst.performanceScore != null && (
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>Score: {inst.performanceScore.toFixed(0)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Review list */}
            <div className="divide-y" style={{ borderColor: "#F0F5FB" }}>
              {visibleReviews.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm" style={{ color: "#9CA3AF" }}>No reviews in this filter.</p>
                </div>
              ) : (
                visibleReviews.map((rev) => {
                  const matched = matchInstructor(rev.body, instructors);
                  return (
                    <div key={rev.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Stars rating={rev.rating} />
                          <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{rev.author}</span>
                          {sourceBadge(rev.source)}
                          {matched && reviewFilter === "all" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#EEF3FB", color: "#4A638D" }}>
                              re: {matched.name.split(" ")[0]}
                            </span>
                          )}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: "#9CA3AF" }}>{reviewDate(rev.reviewDate)}</span>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{rev.body}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
