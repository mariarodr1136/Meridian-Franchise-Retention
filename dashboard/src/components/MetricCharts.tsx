"use client";

import { useState, useMemo } from "react";
import { TrendChart } from "./TrendChart";
import type { StudioMetric } from "@/types";

const RANGES = [
  { label: "4W",  weeks: 4,        desc: "4 weeks"  },
  { label: "8W",  weeks: 8,        desc: "8 weeks"  },
  { label: "3M",  weeks: 13,       desc: "3 months" },
  { label: "6M",  weeks: 26,       desc: "6 months" },
  { label: "All", weeks: Infinity, desc: "All time" },
];

interface Props {
  metrics: StudioMetric[];
  studioId: string;
}

export function MetricCharts({ metrics, studioId }: Props) {
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
        <div>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Trends</p>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            {showing === total
              ? `All ${total} week${total !== 1 ? "s" : ""}`
              : `${showing} of ${total} week${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F0F5FB", border: "1px solid #E2EBF5" }}>
          {RANGES.map(({ label, weeks: w, desc }) => (
            <button
              key={label}
              onClick={() => setWeeks(w)}
              title={desc}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer"
              style={weeks === w
                ? { background: "#4A638D", color: "#fff", boxShadow: "0 1px 4px rgba(74,99,141,0.25)" }
                : { color: "#9CA3AF" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts stacked for more vertical space */}
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
          <TrendChart metrics={sliced} field="weeklyRevenue"     color="#C9A84C" label="Weekly Revenue" href={`/studios/${studioId}/sales`} />
        </div>
        <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
          <TrendChart metrics={sliced} field="activeMemberships" color="#4A638D" label="Active Memberships" href={`/studios/${studioId}/members`} />
        </div>
      </div>
    </div>
  );
}
