"use client";

import { useState } from "react";
import type { Review } from "@/types";

const SOURCE_LABEL: Record<string, string> = { google: "Google", classpass: "ClassPass" };

type SortKey = "recent" | "highest" | "lowest";

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-6 text-right font-medium" style={{ color: "#374151" }}>{star}★</span>
      <div className="flex-1 rounded-full overflow-hidden h-2" style={{ background: "#EEF3FB" }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 0 ? "#C9A84C" : "transparent" }} />
      </div>
      <span className="text-xs w-16" style={{ color: "#9CA3AF" }}>{count} ({Math.round(pct)}%)</span>
    </div>
  );
}

function SourceSummary({ reviews, source }: { reviews: Review[]; source: string }) {
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3" style={{ background: "#F8FAFD", borderColor: "#EEF3FB" }}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#4A638D" }}>
          {SOURCE_LABEL[source]}
        </span>
        <span className="text-xl font-bold" style={{ color: "#1F2937" }}>{avg.toFixed(1)}</span>
        <span style={{ color: "#C9A84C", fontSize: "15px" }}>
          {"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(5 - full - (half ? 1 : 0))}
        </span>
      </div>
      <div className="flex gap-4 text-xs" style={{ color: "#6B7280" }}>
        <span><strong style={{ color: "#1F2937" }}>{reviews.length}</strong> reviews</span>
        <span><strong style={{ color: "#16a34a" }}>{Math.round((positive / reviews.length) * 100)}%</strong> positive</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => (
          <RatingBar key={star} star={star} count={reviews.filter((r) => r.rating === star).length} total={reviews.length} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review, onSelect }: { review: Review; onSelect: (r: Review) => void }) {
  return (
    <button
      onClick={() => onSelect(review)}
      className="rounded-xl p-5 border text-left w-full transition-all duration-200 cursor-pointer"
      style={{ background: "#fff", borderColor: "#EEF3FB" }}
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
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold" style={{ color: "#1F2937" }}>{review.author}</p>
          <p className="text-sm mt-0.5" style={{ color: "#C9A84C" }}>
            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
            <span className="text-xs font-normal ml-1.5" style={{ color: "#9CA3AF" }}>{review.rating}.0 / 5</span>
          </p>
        </div>
        <span className="text-xs flex-shrink-0 ml-3" style={{ color: "#9CA3AF" }}>
          {new Date(review.reviewDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </span>
      </div>
      <p className="text-sm leading-relaxed mb-3" style={{
        color: "#374151",
        display: "-webkit-box",
        WebkitLineClamp: 4,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      } as React.CSSProperties}>
        {review.body}
      </p>
      <p className="text-[10px] font-semibold" style={{ color: "#4A638D" }}>Click to read full review →</p>
    </button>
  );
}

function SourceSection({ reviews, source, sort, onSelect }: { reviews: Review[]; source: string; sort: SortKey; onSelect: (r: Review) => void }) {
  const sorted = [...reviews].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating;
    if (sort === "lowest")  return a.rating - b.rating;
    return new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime();
  });
  if (!sorted.length) return null;
  return (
    <div>
      <SourceSummary reviews={reviews} source={source} />
      <div className="flex flex-col gap-3 mt-4">
        {sorted.map((r) => <ReviewCard key={r.id} review={r} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

interface Props { reviews: Review[] }

export function ReviewsPageContent({ reviews }: Props) {
  const [sort, setSort]       = useState<SortKey>("recent");
  const [selected, setSelected] = useState<Review | null>(null);

  const googleReviews    = reviews.filter((r) => r.source === "google");
  const classpassReviews = reviews.filter((r) => r.source === "classpass");
  const sorts: { key: SortKey; label: string }[] = [
    { key: "recent",  label: "Most Recent"  },
    { key: "highest", label: "Highest Rated" },
    { key: "lowest",  label: "Lowest Rated"  },
  ];

  return (
    <div>
      {/* Sort control */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
          {googleReviews.length > 0 && classpassReviews.length > 0 ? "Google · ClassPass" : googleReviews.length > 0 ? "Google Reviews" : "ClassPass Reviews"}
        </p>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F0F5FB" }}>
          {sorts.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer"
              style={sort === key
                ? { background: "#fff", color: "#4A638D", boxShadow: "0 1px 3px rgba(74,99,141,0.15)" }
                : { color: "#9CA3AF" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Review columns */}
      {googleReviews.length > 0 && classpassReviews.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          <SourceSection reviews={googleReviews}    source="google"    sort={sort} onSelect={setSelected} />
          <SourceSection reviews={classpassReviews} source="classpass" sort={sort} onSelect={setSelected} />
        </div>
      ) : (
        <SourceSection
          reviews={googleReviews.length > 0 ? googleReviews : classpassReviews}
          source={googleReviews.length > 0 ? "google" : "classpass"}
          sort={sort}
          onSelect={setSelected}
        />
      )}

      {/* Modal */}
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
            <div className="px-6 py-5 flex items-start justify-between" style={{ background: "#F8FAFD", borderBottom: "1px solid #EEF3FB" }}>
              <div>
                <p className="text-base font-bold" style={{ color: "#1F2937" }}>{selected.author}</p>
                <p className="text-sm mt-0.5" style={{ color: "#C9A84C" }}>
                  {"★".repeat(selected.rating)}{"☆".repeat(5 - selected.rating)}
                  <span className="text-xs font-normal ml-2" style={{ color: "#9CA3AF" }}>{selected.rating}.0 out of 5</span>
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
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{selected.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
