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
  revenue: "Revenue", instructor: "Instructor", presales: "Presales",
};

interface Props {
  anomalies: Anomaly[];
  resolvedAnomalies: Anomaly[];
}

export function AlertsGrid({ anomalies, resolvedAnomalies }: Props) {
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [active, setActive] = useState<Anomaly[]>(anomalies);
  const [resolved, setResolved] = useState<Anomaly[]>(resolvedAnomalies);
  const [selected, setSelected] = useState<Anomaly | null>(null);
  const [resolving, setResolving] = useState(false);

  async function handleResolve(anomaly: Anomaly) {
    setResolving(true);
    try {
      await fetch(`/api/anomalies/${anomaly.id}`, { method: "PATCH" });
      setActive((prev) => prev.filter((a) => a.id !== anomaly.id));
      setResolved((prev) => [{ ...anomaly, resolved: true }, ...prev]);
      setSelected(null);
    } finally {
      setResolving(false);
    }
  }

  function switchTab(t: "active" | "resolved") {
    setTab(t);
    setSelected(null);
  }

  const list = tab === "active" ? active : resolved;

  return (
    <>
      {/* Tab bar */}
      <div className="flex items-center gap-2 mb-6">
        {(["active", "resolved"] as const).map((t) => {
          const count = t === "active" ? active.length : resolved.length;
          const isCurrent = tab === t;
          return (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer"
              style={isCurrent
                ? { background: "#4A638D", color: "#fff" }
                : { background: "#fff", border: "1px solid #C8D8EE", color: "#4A638D" }
              }
            >
              {t === "active" ? "Active" : "Resolved"}
              {count > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={isCurrent
                    ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                    : { background: "#4A638D", color: "#fff" }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <div className="rounded-xl border p-16 text-center" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
          {tab === "active" ? (
            <>
              <p className="text-2xl mb-2">✓</p>
              <p className="font-medium" style={{ color: "#1F2937" }}>No active alerts</p>
              <p className="text-sm mt-1" style={{ color: "#6B7280" }}>All studios are operating normally.</p>
            </>
          ) : (
            <>
              <p className="text-2xl mb-2">—</p>
              <p className="font-medium" style={{ color: "#1F2937" }}>No resolved alerts yet</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((a) => {
            const sc = severityConfig[a.severity as keyof typeof severityConfig];
            const date = new Date(a.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            const isExpanded = selected?.id === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setSelected(isExpanded ? null : a)}
                className={cn("rounded-xl border text-left cursor-pointer", tab === "resolved" && "opacity-70")}
                style={{
                  background: "#fff",
                  borderColor: isExpanded ? sc.dot : "#E5E7EB",
                  boxShadow: isExpanded ? `0 4px 20px rgba(0,0,0,0.09)` : "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                {/* Always-visible card body */}
                <div className="p-4">
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
                      {tab === "resolved" && (
                        <span className="text-[10px] font-bold" style={{ color: "#16A34A" }}>✓</span>
                      )}
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
                    className={cn("text-[11px] leading-relaxed", !isExpanded && "line-clamp-2")}
                    style={{ color: "#6B7280" }}
                  >
                    {a.summary}
                  </p>
                </div>

                {/* Expandable action section */}
                <div style={{
                  maxHeight: isExpanded ? "96px" : "0",
                  overflow: "hidden",
                  transition: "max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                  <div className="px-4 pb-4">
                    <div style={{ height: 1, background: "#F3F4F6", marginBottom: 12 }} />
                    {tab !== "resolved" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResolve(a); }}
                        disabled={resolving}
                        className="w-full text-xs font-semibold py-2 rounded-lg disabled:opacity-50 cursor-pointer"
                        style={{ background: "#4A638D", color: "#fff", transition: "background 0.15s" }}
                        onMouseEnter={(e) => { if (!resolving) (e.currentTarget as HTMLButtonElement).style.background = "#3d527a"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#4A638D"; }}
                      >
                        {resolving ? "Resolving…" : "Mark Resolved"}
                      </button>
                    ) : (
                      <p className="text-[11px] font-medium text-center" style={{ color: "#16A34A" }}>
                        This alert has been resolved
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
