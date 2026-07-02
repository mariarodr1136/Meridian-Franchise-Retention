"use client";

import { useState, useMemo } from "react";
import { TrendChart } from "./TrendChart";
import type { StudioMetric } from "@/types";

function fmtRev(n: number) { return "$" + Math.round(n).toLocaleString(); }
function fmtNum(n: number) { return Math.round(n).toLocaleString(); }

function computeSummary(
  data: StudioMetric[],
  field: "weeklyRevenue" | "activeMemberships",
): { text: string; sentiment: "positive" | "neutral" | "negative" } | null {
  if (data.length < 4) return null;

  const isRev = field === "weeklyRevenue";
  const fmt   = isRev ? fmtRev : fmtNum;

  const values = data.map((d) => d[field] as number);
  const dates  = data.map((d) => new Date(d.weekOf));

  const first = values[0];
  const last  = values[values.length - 1];
  const pct   = ((last - first) / first) * 100;
  const net   = last - first;

  const peakVal  = Math.max(...values);
  const peakIdx  = values.indexOf(peakVal);
  const peakDate = dates[peakIdx].toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const half     = Math.floor(values.length / 2);
  const firstHalf  = values.slice(0, half);
  const secondHalf = values.slice(-half);
  const firstAvg   = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const secondAvg  = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
  const momentumPct = ((secondAvg - firstAvg) / firstAvg) * 100;

  const recent4    = values.slice(-4);
  const recent4Avg = recent4.reduce((s, v) => s + v, 0) / recent4.length;
  const prev4      = values.slice(-8, -4);
  const prev4Avg   = prev4.length ? prev4.reduce((s, v) => s + v, 0) / prev4.length : firstAvg;
  const recentShift = recent4Avg - prev4Avg;

  const sentiment: "positive" | "neutral" | "negative" =
    pct > 4 ? "positive" : pct < -4 ? "negative" : "neutral";

  let text = "";

  if (sentiment === "positive") {
    const growthLine = isRev
      ? `Revenue has climbed from ${fmt(first)}/week to ${fmt(last)}/week — up ${pct.toFixed(1)}% over this period.`
      : `Membership has grown from ${fmtNum(first)} to ${fmtNum(last)} members — a net gain of ${fmtNum(net)} over this period.`;

    const momentumLine = recentShift > 0
      ? isRev
        ? ` The last 4 weeks averaged ${fmt(recent4Avg)}/week, up ${fmtRev(recentShift)} from the prior 4 — growth is still building.`
        : ` The last 4 weeks added an average of ${(recentShift / 4).toFixed(1)} members/week, up from the prior stretch — momentum is holding.`
      : isRev
        ? ` The last 4 weeks averaged ${fmt(recent4Avg)}/week, slightly off the recent peak of ${fmt(peakVal)} on ${peakDate}.`
        : ` Growth has slowed slightly — the last 4 weeks averaged ${(recentShift / 4).toFixed(1)} net members/week vs a stronger earlier run.`;

    text = growthLine + momentumLine;

  } else if (sentiment === "negative") {
    const declineLine = isRev
      ? `Revenue has dropped from ${fmt(first)}/week to ${fmt(last)}/week — down ${Math.abs(pct).toFixed(1)}% and a loss of ${fmt(Math.abs(net))}/week over this period.`
      : `Membership has contracted from ${fmtNum(first)} to ${fmtNum(last)} — a net loss of ${fmtNum(Math.abs(net))} members over this period.`;

    const recoveryLine = recentShift > 0
      ? isRev
        ? ` The last 4 weeks show a possible floor — averaging ${fmt(recent4Avg)}/week, up ${fmt(recentShift)} from the prior 4. Worth watching.`
        : ` The last 4 weeks show signs of stabilization, with a slight uptick of ${fmtNum(recentShift)} members vs the prior stretch.`
      : isRev
        ? ` The decline has continued — the last 4 weeks averaged ${fmt(recent4Avg)}/week with no clear floor yet.`
        : ` The decline shows no clear reversal — the last 4 weeks lost ${fmtNum(Math.abs(recentShift))} additional members vs the prior stretch.`;

    text = declineLine + recoveryLine;

  } else {
    const steadyLine = isRev
      ? `Revenue has been consistent at around ${fmt(recent4Avg)}/week over this period, with a high of ${fmt(peakVal)} on ${peakDate}.`
      : `Membership has held steady around ${fmtNum(Math.round(recent4Avg))} members over this period, with a peak of ${fmtNum(peakVal)} on ${peakDate}.`;

    const driftLine = Math.abs(momentumPct) < 2
      ? " No meaningful drift in either direction — the studio is in a stable operating rhythm."
      : momentumPct > 0
        ? isRev ? ` The second half of this window averaged ${fmt(secondAvg)}/week, a slight improvement over the first half (${fmt(firstAvg)}/week).`
                : ` The second half of this window averaged ${fmtNum(secondAvg)} members, a slight lift over the first half (${fmtNum(firstAvg)}).`
        : isRev ? ` The second half of this window averaged ${fmt(secondAvg)}/week, a mild softening from the first half (${fmt(firstAvg)}/week).`
                : ` The second half of this window averaged ${fmtNum(secondAvg)} members, slightly below the first half (${fmtNum(firstAvg)}).`;

    text = steadyLine + driftLine;
  }

  return { text, sentiment };
}

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
  const [weeks, setWeeks] = useState(Infinity);

  const sliced = useMemo(() => {
    const sorted = [...metrics].sort((a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime());
    return weeks === Infinity ? sorted : sorted.slice(-weeks);
  }, [metrics, weeks]);

  const showing = sliced.length;
  const total   = metrics.length;

  return (
    <div>
      {/* Range selector */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full" style={{ background: "#4A638D", color: "#fff" }}>Overview</span>
        </div>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F0F5FB", border: "1px solid #E2EBF5" }}>
          {RANGES.map(({ label, weeks: w, desc }) => (
            <button
              key={label}
              onClick={() => setWeeks(w)}
              title={desc}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer${weeks !== w ? " hover:text-[#4A638D] hover:ring-1 hover:ring-[#4A638D]" : ""}`}
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
        {(["weeklyRevenue", "activeMemberships"] as const).map((field) => {
          const summary = computeSummary(sliced, field);
          const sentimentColor = summary?.sentiment === "positive" ? "#4A638D"
            : summary?.sentiment === "negative" ? "#B45309"
            : "#6B7280";
          const sentimentBg = "#EEF3FB";
          return (
            <div key={field} className="rounded-xl border" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
              <div className="p-5">
                <TrendChart
                  metrics={sliced}
                  field={field}
                  color={field === "weeklyRevenue" ? "#C9A84C" : "#4A638D"}
                  label={field === "weeklyRevenue" ? "Weekly Revenue" : "Active Memberships"}
                  href={`/studios/${studioId}/${field === "weeklyRevenue" ? "sales" : "members"}`}
                />
              </div>
              {summary && (
                <div className="px-5 pb-4">
                  <div className="rounded-lg px-4 py-3" style={{ background: sentimentBg }}>
                    <p className="text-xs leading-relaxed" style={{ color: sentimentColor }}>{summary.text}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
