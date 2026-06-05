"use client";

import Link from "next/link";
import type { StudioWithLatestMetric, StudioStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { formatCurrency, formatPercent, formatNumber, trendDirection } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stat { label: string; value: string; trend?: "up" | "down" | "flat"; warn?: boolean }

function StatItem({ label, value, trend, warn }: Stat) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: "#9CA3AF" }}>{label}</p>
      <div className="flex items-center gap-1">
        <p className="text-sm font-semibold" style={{ color: warn ? "#EA580C" : "#1F2937" }}>{value}</p>
        {trend && trend !== "flat" && (
          <span className={cn("text-xs", trend === "up" ? "text-green-600" : "text-orange-500")}>
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </div>
  );
}

interface Props {
  studio: StudioWithLatestMetric;
}

export function StudioCard({ studio }: Props) {
  const m = studio.latestMetric;
  const isPreLaunch = studio.status === "pre-launch";
  const isAtRisk = studio.status === "at-risk";

  const borderColor: Record<StudioStatus, string> = {
    healthy:      "#4A638D",
    "at-risk":    "#EA580C",
    new:          "#4A638D",
    "pre-launch": "#C8D8EE",
  };

  return (
    <Link href={`/studios/${studio.id}`} className="block h-full">
      <div
        className="h-full flex flex-col rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer bg-white"
        style={{
          borderColor: borderColor[studio.status as StudioStatus],
          boxShadow: "0 1px 4px rgba(74,99,141,0.08)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(74,99,141,0.18), 0 0 0 3px rgba(74,99,141,0.18)";
          (e.currentTarget as HTMLDivElement).style.background = "#F0F5FB";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(74,99,141,0.08)";
          (e.currentTarget as HTMLDivElement).style.background = "#FFFFFF";
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#1F2937" }}>{studio.name}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>
              {studio.city}{studio.state ? `, ${studio.state}` : ""}{studio.country !== "US" ? ` · ${studio.country}` : ""}
            </p>
          </div>
          <StatusBadge status={studio.status as StudioStatus} size="sm" />
        </div>

        {isPreLaunch ? (
          <div className="mt-2">
            <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Presales Pipeline</p>
            <p className="text-xl font-bold" style={{ color: "#4A638D" }}>
              {m?.presalesPipelineCount ?? 0}
              <span className="text-xs font-normal ml-1" style={{ color: "#9CA3AF" }}>leads</span>
            </p>
          </div>
        ) : m ? (
          <div className="grid grid-cols-2 gap-3 mt-1">
            <StatItem
              label="Occupancy"
              value={formatPercent(m.classFillRate)}
              trend={m.classFillRate >= 0.70 ? "up" : m.classFillRate < 0.55 ? "down" : "flat"}
            />
            <StatItem label="Members" value={formatNumber(m.activeMemberships)} />
            <StatItem label="Weekly Rev" value={formatCurrency(m.weeklyRevenue)} />
            <StatItem
              label="Churn"
              value={formatPercent(m.weeklyChurn)}
              warn={m.weeklyChurn > 0.04}
              trend={m.weeklyChurn > 0.04 ? "down" : "up"}
            />
          </div>
        ) : (
          <p className="text-xs" style={{ color: "#9CA3AF" }}>No data yet</p>
        )}

        <p className="text-xs mt-auto pt-3 border-t truncate" style={{ borderColor: "#E4EDF8", color: "#9CA3AF" }}>
          {studio.franchiseeName}
        </p>
      </div>
    </Link>
  );
}
