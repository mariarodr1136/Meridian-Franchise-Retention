"use client";

import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return Math.abs(h >>> 0);
}

function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = ((s * 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface CohortPoint {
  month: number;
  [cohortLabel: string]: number;
}

interface Cohort {
  label: string;
  color: string;
  startMonth: string;
}

const COHORT_COLORS = ["#4A638D", "#C9A84C", "#16a34a", "#7B5EA7", "#EA580C"];

function generateCohorts(
  studioId: string,
  weeklyChurnRate: number,
  openedAt: string | null,
): { cohorts: Cohort[]; data: CohortPoint[] } {
  const seed = hashStr(studioId);
  const rand = prng(seed);

  const now = new Date("2026-07-01");
  const openDate = openedAt ? new Date(openedAt) : new Date("2025-01-01");

  // Build up to 5 quarterly cohorts working backwards from now
  const cohorts: Cohort[] = [];
  const quarterStarts: Date[] = [];

  let cursor = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  while (quarterStarts.length < 5 && cursor >= openDate) {
    if (cursor >= openDate) quarterStarts.unshift(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 3, 1);
  }

  for (let i = 0; i < quarterStarts.length; i++) {
    const d = quarterStarts[i];
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    cohorts.push({ label, color: COHORT_COLORS[i % COHORT_COLORS.length], startMonth: label });
  }

  // For each cohort, compute retention curve up to 12 months (or months since open)
  const maxMonths = 12;
  const data: CohortPoint[] = [];

  for (let month = 0; month <= maxMonths; month++) {
    const point: CohortPoint = { month };
    for (let ci = 0; ci < cohorts.length; ci++) {
      const c = cohorts[ci];
      const cohortStart = quarterStarts[ci];
      const monthsSinceOpen = (now.getFullYear() - cohortStart.getFullYear()) * 12
        + now.getMonth() - cohortStart.getMonth();

      if (month > monthsSinceOpen) {
        // Cohort hasn't had enough time yet
        continue;
      }

      // Base monthly churn from weekly churn rate
      const monthlyChurn = 1 - Math.pow(1 - weeklyChurnRate, 4.33);
      // Add per-cohort noise using PRNG
      const noise = (rand() - 0.5) * 0.015;
      const effectiveMonthly = Math.max(0.01, Math.min(0.18, monthlyChurn + noise));

      // Retention decays each month but flattens (long-term loyal members)
      let retention: number;
      if (month === 0) {
        retention = 100;
      } else {
        const decay = Math.pow(1 - effectiveMonthly, month);
        // Flatten: assume ~20% are long-term retained regardless
        const floor = 0.18 + rand() * 0.06;
        retention = Math.max(floor * 100, decay * 100);
      }

      point[c.label] = Math.round(retention * 10) / 10;
    }
    data.push(point);
  }

  return { cohorts, data };
}

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length || label === undefined) return null;
  return (
    <div className="rounded-xl border px-3.5 py-2.5 shadow-lg"
      style={{ background: "#fff", borderColor: "#C8D8EE", pointerEvents: "none", minWidth: 160 }}>
      <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
        Month {label}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            <span className="text-xs" style={{ color: "#6B7280" }}>{p.name}</span>
          </div>
          <span className="text-xs font-bold" style={{ color: "#1F2937" }}>{p.value?.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  studioId: string;
  weeklyChurnRate: number;
  openedAt: string | null;
}

export function CohortRetentionChart({ studioId, weeklyChurnRate, openedAt }: Props) {
  const { cohorts, data } = useMemo(
    () => generateCohorts(studioId, weeklyChurnRate, openedAt),
    [studioId, weeklyChurnRate, openedAt],
  );

  if (cohorts.length === 0) return null;

  const monthlyChurn = 1 - Math.pow(1 - weeklyChurnRate, 4.33);
  const sixMonthRetention = Math.round(Math.pow(1 - monthlyChurn, 6) * 100);
  const twelveMonthRetention = Math.round(Math.pow(1 - monthlyChurn, 12) * 100);

  return (
    <div className="rounded-xl border" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
              Cohort Retention
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              % of members still active N months after joining
            </p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-lg font-bold" style={{ color: "#1F2937" }}>{sixMonthRetention}%</p>
              <p className="text-[10px]" style={{ color: "#9CA3AF" }}>6-month</p>
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "#4A638D" }}>{twelveMonthRetention}%</p>
              <p className="text-[10px]" style={{ color: "#9CA3AF" }}>12-month</p>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF8" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `M${v}`}
              interval={1}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={36}
              tickCount={6}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#C8D8EE", strokeWidth: 1, strokeDasharray: "4 3" }} />
            <Legend
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
              formatter={(value) => <span style={{ color: "#6B7280" }}>{value}</span>}
            />
            {cohorts.map((c) => (
              <Line
                key={c.label}
                type="monotone"
                dataKey={c.label}
                stroke={c.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        <p className="text-[10px] mt-3" style={{ color: "#9CA3AF" }}>
          Cohort curves projected from live churn rate · each line = a quarterly member cohort
        </p>
      </div>
    </div>
  );
}
