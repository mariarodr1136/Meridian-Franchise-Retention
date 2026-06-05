"use client";

import type { Anomaly } from "@/types";
import { cn } from "@/lib/utils";

const severityConfig = {
  high:   { bar: "#DC2626", label: "Critical", labelColor: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  medium: { bar: "#D97706", label: "Warning",  labelColor: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  low:    { bar: "#4A638D", label: "Advisory", labelColor: "#4A638D", bg: "#EEF3FB", border: "#C8D8EE" },
};

const categoryLabel: Record<string, string> = {
  churn:      "Churn",
  occupancy:  "Occupancy",
  membership: "Membership",
  instructor: "Instructor",
  presales:   "Presales",
};

interface Props { anomalies: Anomaly[] }

export function AnomalyFeed({ anomalies }: Props) {
  const sorted = [...anomalies].sort((a, b) => {
    const o = { high: 0, medium: 1, low: 2 };
    return o[a.severity as keyof typeof o] - o[b.severity as keyof typeof o];
  });

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border px-4 py-10 text-center"
        style={{ borderColor: "#C8D8EE", background: "#F0F5FB" }}>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>No active alerts</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((a) => {
        const sc = severityConfig[a.severity as keyof typeof severityConfig];
        const date = new Date(a.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return (
          <div key={a.id}
            className="rounded-xl border overflow-hidden"
            style={{ background: sc.bg, borderColor: sc.border }}>
            <div className="h-[3px] w-full" style={{ background: sc.bar }} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase"
                    style={{ color: sc.labelColor }}>{sc.label}</span>
                  <span className="text-[10px] tracking-wide uppercase" style={{ color: "#9CA3AF" }}>
                    {categoryLabel[a.category] ?? a.category}
                  </span>
                </div>
                <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{date}</span>
              </div>
              {a.studioName && (
                <p className="text-xs font-semibold mb-1.5" style={{ color: "#4A638D" }}>
                  {a.studioName}
                </p>
              )}
              <p className="text-[11px] leading-relaxed" style={{ color: "#6B7280" }}>
                {a.summary}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
