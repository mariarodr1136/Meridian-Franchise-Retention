"use client";

import { useState, useMemo } from "react";
import { TrendChart } from "./TrendChart";
import type { StudioMetric } from "@/types";

const RANGES = [
  { label: "4 wks",  weeks: 4  },
  { label: "8 wks",  weeks: 8  },
  { label: "3 mo",   weeks: 13 },
  { label: "6 mo",   weeks: 26 },
  { label: "All",    weeks: Infinity },
];

interface Props {
  metrics: StudioMetric[];
}

export function MetricCharts({ metrics }: Props) {
  const [weeks, setWeeks] = useState(8);

  const sliced = useMemo(() => {
    const sorted = [...metrics].sort((a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime());
    return weeks === Infinity ? sorted : sorted.slice(-weeks);
  }, [metrics, weeks]);

  const showing = sliced.length;
  const total   = metrics.length;

  return (
    <div>
      {/* Range selector */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "#9CA3AF" }}>
          Showing {showing} of {total} week{total !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F0F5FB" }}>
          {RANGES.map(({ label, weeks: w }) => (
            <button
              key={label}
              onClick={() => setWeeks(w)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer"
              style={weeks === w
                ? { background: "#fff", color: "#4A638D", boxShadow: "0 1px 3px rgba(74,99,141,0.15)" }
                : { color: "#9CA3AF" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <TrendChart metrics={sliced} field="weeklyRevenue"     color="#C9A84C" label="Weekly Revenue" />
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <TrendChart metrics={sliced} field="activeMemberships" color="#3b82f6" label="Active Memberships" />
        </div>
      </div>
    </div>
  );
}
