"use client";

import { useState } from "react";
import type { Anomaly } from "@/types";

const severityConfig = {
  high:   { dot: "#DC2626", label: "Critical", labelBg: "#FEE2E2", labelColor: "#B91C1C" },
  medium: { dot: "#D97706", label: "Warning",  labelBg: "#FEF3C7", labelColor: "#B45309" },
  low:    { dot: "#4A638D", label: "Advisory", labelBg: "#EEF3FB", labelColor: "#4A638D" },
};

const categoryLabel: Record<string, string> = {
  churn: "Churn", occupancy: "Occupancy", membership: "Membership",
  instructor: "Instructor", presales: "Presales",
};

interface Props { anomalies: Anomaly[] }

export function AnomalyFeed({ anomalies }: Props) {
  const [items, setItems] = useState<Anomaly[]>(anomalies);
  const [selected, setSelected] = useState<Anomaly | null>(null);
  const [resolving, setResolving] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => {
    const o = { high: 0, medium: 1, low: 2 };
    return o[a.severity as keyof typeof o] - o[b.severity as keyof typeof o];
  });

  async function handleResolve(anomaly: Anomaly) {
    setResolving(true);
    try {
      await fetch(`/api/anomalies/${anomaly.id}`, { method: "PATCH" });
      setItems((prev) => prev.filter((a) => a.id !== anomaly.id));
      setSelected(null);
    } finally {
      setResolving(false);
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border px-4 py-10 text-center"
        style={{ borderColor: "#C8D8EE", background: "#F0F5FB" }}>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>No active alerts</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((a) => {
        const sc = severityConfig[a.severity as keyof typeof severityConfig];
        const date = new Date(a.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const isExpanded = selected?.id === a.id;
        return (
          <div
            key={a.id}
            onClick={() => setSelected(isExpanded ? null : a)}
            onMouseEnter={() => setHoveredId(a.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="rounded-xl border text-left cursor-pointer w-full"
            style={{
              background: "#F8FAFD",
              borderColor: isExpanded ? sc.dot : hoveredId === a.id ? "#4A638D" : "#C8D8EE",
              boxShadow: isExpanded
                ? "0 4px 16px rgba(0,0,0,0.08)"
                : hoveredId === a.id
                ? "0 6px 20px rgba(74,99,141,0.15)"
                : "none",
              transform: !isExpanded && hoveredId === a.id ? "translateY(-2px)" : "translateY(0)",
              transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
            }}
          >
            {/* Always-visible header */}
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded"
                    style={{ background: sc.labelBg, color: sc.labelColor }}>
                    {sc.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                    {categoryLabel[a.category] ?? a.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{date}</span>
                  <svg
                    width="10" height="10" viewBox="0 0 10 6" fill="none" aria-hidden="true"
                    style={{
                      color: "#9CA3AF",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              {a.studioName && (
                <p className="text-xs font-semibold mb-1" style={{ color: "#1F2937" }}>{a.studioName}</p>
              )}
              <p
                className="text-[11px] leading-relaxed"
                style={{
                  color: "#6B7280",
                  display: "-webkit-box",
                  WebkitLineClamp: isExpanded ? "unset" : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: isExpanded ? "visible" : "hidden",
                }}
              >
                {a.summary}
              </p>
            </div>

            {/* Expandable resolve section — grid-row trick for smooth height animation */}
            <div style={{
              display: "grid",
              gridTemplateRows: isExpanded ? "1fr" : "0fr",
              transition: "grid-template-rows 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              <div style={{ overflow: "hidden", minHeight: 0 }}>
                <div className="px-3.5 pb-3.5">
                  <div style={{ height: 1, background: "#F3F4F6", marginBottom: 10 }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleResolve(a); }}
                    disabled={resolving}
                    className="w-full text-xs font-semibold py-2 rounded-lg disabled:opacity-50 cursor-pointer transition-all duration-300 ease-in-out hover:brightness-90 active:scale-[0.98]"
                    style={{ background: "#4A638D", color: "#fff" }}
                  >
                    {resolving ? "Resolving…" : "Mark Resolved"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
