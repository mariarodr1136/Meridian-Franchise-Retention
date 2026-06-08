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

function SourceSection({ reviews, source, sort }: {
  reviews: Review[]; source: string; sort: SortKey;
}) {
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
        {sorted.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
    </div>
  );
}

interface Props {
  reviews: Review[];
}

export function ReviewsPageContent({ reviews }: Props) {
  const [sort, setSort] = useState<SortKey>("recent");

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
          {googleReviews.length > 0 && classpassReviews.length > 0
            ? "Google · ClassPass"
            : googleReviews.length > 0 ? "Google Reviews" : "ClassPass Reviews"}
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

      {/* Google + ClassPass columns */}
      {googleReviews.length > 0 && classpassReviews.length > 0 ? (
        <div className="grid grid-cols-2 gap-6">
          <SourceSection reviews={googleReviews}    source="google"    sort={sort} />
          <SourceSection reviews={classpassReviews} source="classpass" sort={sort} />
        </div>
      ) : (
        <SourceSection
          reviews={googleReviews.length > 0 ? googleReviews : classpassReviews}
          source={googleReviews.length > 0 ? "google" : "classpass"}
          sort={sort}
        />
      )}


    </div>
  );
}
