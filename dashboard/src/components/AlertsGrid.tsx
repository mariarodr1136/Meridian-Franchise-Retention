"use client";

import { useState } from "react";
import type { Anomaly } from "@/types";
import { cn } from "@/lib/utils";

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

export function AlertsGrid({ anomalies }: Props) {
  const [selected, setSelected] = useState<Anomaly | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {anomalies.map((a) => {
          const sc = severityConfig[a.severity as keyof typeof severityConfig];
          const date = new Date(a.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          return (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="rounded-xl border bg-white text-left transition-all hover:shadow-sm hover:border-gray-300 cursor-pointer"
              style={{ borderColor: "#E5E7EB" }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded"
                      style={{ background: sc.labelBg, color: sc.labelColor }}>
                      {sc.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{categoryLabel[a.category] ?? a.category}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{date}</span>
                </div>
                {a.studioName && (
                  <p className="text-xs font-semibold mb-1" style={{ color: "#1F2937" }}>{a.studioName}</p>
                )}
                <p className="text-[11px] leading-relaxed" style={{ color: "#6B7280" }}>{a.summary}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {selected && (() => {
        const sc = severityConfig[selected.severity as keyof typeof severityConfig];
        const date = new Date(selected.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.35)" }}
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Colored header */}
              <div className="px-6 py-5 flex items-center justify-between" style={{ background: sc.labelBg, borderBottom: `1px solid ${sc.dot}22` }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: sc.labelColor }}>
                    {sc.label}
                  </span>
                  <span className="text-xs" style={{ color: sc.labelColor, opacity: 0.4 }}>·</span>
                  <span className="text-xs tracking-wide uppercase font-medium" style={{ color: sc.labelColor, opacity: 0.65 }}>
                    {categoryLabel[selected.category] ?? selected.category}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-opacity hover:opacity-70 cursor-pointer"
                  style={{ background: `${sc.dot}22`, color: sc.labelColor }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                {selected.studioName && (
                  <p className="text-base font-bold mb-1" style={{ color: "#1F2937" }}>{selected.studioName}</p>
                )}
                <p className="text-xs font-medium mb-4" style={{ color: "#9CA3AF" }}>{date}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{selected.summary}</p>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
