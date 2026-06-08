"use client";

import { useState } from "react";
import type { Review } from "@/types";

const SOURCE_LABEL: Record<string, string> = { google: "Google", classpass: "ClassPass" };

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="rounded-xl p-5 border text-left w-full cursor-pointer"
      style={{
        background: "#fff",
        borderColor: expanded ? "#4A638D" : "#EEF3FB",
        boxShadow: expanded ? "0 4px 20px rgba(74,99,141,0.1)" : "none",
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
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold" style={{ color: "#1F2937" }}>{review.author}</p>
          <p className="text-sm mt-0.5" style={{ color: "#C9A84C" }}>
            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            <span className="text-xs font-normal ml-1.5" style={{ color: "#9CA3AF" }}>{review.rating}.0 / 5</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span className="text-xs" style={{ color: "#9CA3AF" }}>
            {new Date(review.reviewDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <svg
            width="10" height="10" viewBox="0 0 10 6" fill="none" aria-hidden="true"
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
      <p
        className="text-sm leading-relaxed"
        style={{
          color: "#374151",
          display: "-webkit-box",
          WebkitLineClamp: expanded ? "unset" : 4,
          WebkitBoxOrient: "vertical",
          overflow: expanded ? "visible" : "hidden",
        } as React.CSSProperties}
      >
        {review.body}
      </p>
      <div style={{
        maxHeight: expanded ? "28px" : "0",
        overflow: "hidden",
        transition: "max-height 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        marginTop: expanded ? 10 : 0,
      }}>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: "#4A638D" }}>
          {SOURCE_LABEL[review.source]}
        </span>
      </div>
      {!expanded && (
        <p className="text-[10px] font-semibold mt-3" style={{ color: "#4A638D" }}>Click to read full review →</p>
      )}
    </div>
  );
}

interface Props {
  instructorName: string;
  studioName: string;
  reviews: Review[];
}

export function InstructorReviewsContent({ instructorName, studioName, reviews }: Props) {
  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;
  const full = Math.floor(avg);
  const initials = instructorName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      {/* Instructor profile card */}
      <div className="rounded-2xl border p-6 mb-8" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="flex items-center gap-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
            style={{ background: "#4A638D" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold" style={{ color: "#111827" }}>{instructorName}</h1>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{studioName}</p>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <span style={{ color: "#C9A84C", fontSize: "16px" }}>
                  {"★".repeat(full)}{"☆".repeat(5 - full)}
                </span>
                <span className="text-base font-bold" style={{ color: "#111827" }}>{avg.toFixed(1)}</span>
                <span className="text-sm" style={{ color: "#9CA3AF" }}>
                  from {reviews.length} review mention{reviews.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Rating breakdown */}
          {reviews.length > 0 && (
            <div className="flex flex-col gap-1.5 w-48 flex-shrink-0">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = (count / reviews.length) * 100;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs w-5 text-right font-medium" style={{ color: "#6B7280" }}>{star}★</span>
                    <div className="flex-1 rounded-full overflow-hidden h-2" style={{ background: "#EEF3FB" }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: pct > 0 ? "#C9A84C" : "transparent" }}
                      />
                    </div>
                    <span className="text-xs w-4 text-right" style={{ color: "#9CA3AF" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border p-16 text-center" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
          <p className="font-medium" style={{ color: "#1F2937" }}>No reviews mention {instructorName.split(" ")[0]} yet</p>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Reviews that name this instructor will appear here automatically.</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>
            Reviews mentioning {instructorName.split(" ")[0]}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
