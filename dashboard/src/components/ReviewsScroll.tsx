"use client";

import { useState } from "react";
import Link from "next/link";
import type { Review } from "@/types";

const SOURCE_LABEL: Record<string, string> = { google: "Google", classpass: "ClassPass" };

interface CardProps { review: Review }

function ReviewScrollCard({ review }: CardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="flex-shrink-0 w-72 rounded-xl text-left p-4 cursor-pointer"
      style={{
        background: "#F8FAFD",
        border: expanded ? "1px solid #4A638D" : "1px solid #EEF3FB",
        boxShadow: expanded ? "0 4px 16px rgba(74,99,141,0.12)" : "none",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.18s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-2px)";
        el.style.borderColor = "#4A638D";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.borderColor = expanded ? "#4A638D" : "#EEF3FB";
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{review.author}</p>
          <p className="text-xs mt-0.5" style={{ color: "#C9A84C" }}>
            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: "#4A638D" }}>
            {SOURCE_LABEL[review.source]}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
              {new Date(review.reviewDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <svg
              width="9" height="9" viewBox="0 0 10 6" fill="none" aria-hidden="true"
              style={{
                color: "#9CA3AF",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                flexShrink: 0,
              }}
            >
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{
          color: "#4B5563",
          display: "-webkit-box",
          WebkitLineClamp: expanded ? "unset" : 4,
          WebkitBoxOrient: "vertical",
          overflow: expanded ? "visible" : "hidden",
        } as React.CSSProperties}
      >
        {review.body}
      </p>
      {!expanded && (
        <p className="text-[10px] font-semibold mt-3" style={{ color: "#4A638D" }}>Read full review →</p>
      )}
    </div>
  );
}

interface Props {
  reviews: Review[];
  studioId: string;
  studioName: string;
}

export function ReviewsScroll({ reviews, studioId }: Props) {
  if (!reviews.length) return null;

  const sources = ["google", "classpass"].filter((s) => reviews.some((r) => r.source === s));
  const sourceStats = Object.fromEntries(
    sources.map((s) => {
      const bucket = reviews.filter((r) => r.source === s);
      const avg = bucket.reduce((sum, r) => sum + r.rating, 0) / bucket.length;
      return [s, { avg, count: bucket.length }];
    })
  );

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/studios/${studioId}/reviews`}
          className="text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-70 cursor-pointer"
          style={{ color: "#4A638D" }}
        >
          Recent Reviews →
        </Link>
        <div className="flex items-center gap-4">
          {sources.map((s) => {
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

      {/* Horizontal scroll row */}
      <div
        className="flex gap-3 overflow-x-auto pt-1 pb-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {reviews.map((r) => (
          <ReviewScrollCard key={r.id} review={r} />
        ))}

        {/* View all card */}
        <Link
          href={`/studios/${studioId}/reviews`}
          className="flex-shrink-0 w-44 rounded-xl flex flex-col items-center justify-center gap-2 transition-all hover:opacity-80"
          style={{ background: "#EEF3FB", border: "1px solid #C8D8EE", minHeight: "168px" }}
        >
          <span className="text-2xl" style={{ color: "#4A638D" }}>→</span>
          <span className="text-xs font-semibold text-center px-4" style={{ color: "#4A638D" }}>View all reviews</span>
        </Link>
      </div>
    </>
  );
}
