"use client";

import { useState } from "react";
import Link from "next/link";
import type { Review } from "@/types";

const SOURCE_LABEL: Record<string, string> = { google: "Google", classpass: "ClassPass" };

interface Props {
  reviews: Review[];
  studioId: string;
  studioName: string;
}

export function ReviewsScroll({ reviews, studioId, studioName }: Props) {
  const [selected, setSelected] = useState<Review | null>(null);

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

      {/* Horizontal scroll */}
      <div
        className="flex gap-3 overflow-x-auto pt-3 pb-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {reviews.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className="flex-shrink-0 w-72 rounded-xl text-left p-4 transition-all duration-200 cursor-pointer"
            style={{ background: "#F8FAFD", border: "1px solid #EEF3FB" }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = "translateY(-3px)";
              el.style.boxShadow = "0 8px 24px rgba(74,99,141,0.14)";
              el.style.borderColor = "#4A638D";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "none";
              el.style.borderColor = "#EEF3FB";
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{r.author}</p>
                <p className="text-xs mt-0.5" style={{ color: "#C9A84C" }}>
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold text-white" style={{ background: "#4A638D" }}>
                  {SOURCE_LABEL[r.source]}
                </span>
                <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
                  {new Date(r.reviewDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed mb-3 overflow-hidden" style={{
              color: "#4B5563",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
            } as React.CSSProperties}>
              {r.body}
            </p>
            <p className="text-[10px] font-semibold" style={{ color: "#4A638D" }}>Read full review →</p>
          </button>
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

      {/* Full-review modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-5 flex items-start justify-between" style={{ background: "#F8FAFD", borderBottom: "1px solid #EEF3FB" }}>
              <div>
                <p className="text-base font-bold" style={{ color: "#1F2937" }}>{selected.author}</p>
                <p className="text-sm mt-0.5" style={{ color: "#C9A84C" }}>
                  {"★".repeat(selected.rating)}{"☆".repeat(5 - selected.rating)}
                  <span className="text-xs ml-2 font-normal" style={{ color: "#9CA3AF" }}>
                    {selected.rating}.0 out of 5
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: "#4A638D" }}>
                    {SOURCE_LABEL[selected.source]}
                  </span>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>
                    {new Date(selected.reviewDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-opacity hover:opacity-70 cursor-pointer"
                  style={{ background: "#EEF3FB", color: "#4A638D" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{selected.body}</p>
              <div className="mt-5 pt-4 flex justify-between items-center" style={{ borderTop: "1px solid #EEF3FB" }}>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>{studioName}</p>
                <Link
                  href={`/studios/${studioId}/reviews`}
                  className="text-xs font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "#4A638D" }}
                  onClick={() => setSelected(null)}
                >
                  See all reviews →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
