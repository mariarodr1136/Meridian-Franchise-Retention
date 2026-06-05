"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { StudioMetric } from "@/types";
import { weekLabel } from "@/lib/utils";

type ChartField = "weeklyRevenue" | "activeMemberships" | "classFillRate" | "presalesPipelineCount";

function formatValue(field: ChartField, v: number): string {
  switch (field) {
    case "weeklyRevenue":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
    case "classFillRate":
      return `${(v * 100).toFixed(1)}%`;
    case "activeMemberships":
    case "presalesPipelineCount":
      return new Intl.NumberFormat("en-US").format(Math.round(v));
  }
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  field: ChartField;
}

function CustomTooltip({ active, payload, label, field }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ background: "#1c1c1c", borderColor: "#333", color: "#fafafa" }}>
      <p style={{ color: "#737373" }}>{label}</p>
      <p className="font-semibold mt-0.5">{formatValue(field, payload[0].value)}</p>
    </div>
  );
}

interface Props {
  metrics: StudioMetric[];
  field: ChartField;
  color?: string;
  label: string;
}

export function TrendChart({ metrics, field, color = "#C9A84C", label }: Props) {
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime()
  );

  const data = sorted.map((m) => ({
    week: weekLabel(m.weekOf),
    value: m[field],
  }));

  return (
    <div className="w-full">
      <p className="text-xs mb-3" style={{ color: "#737373" }}>{label}</p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: "#737373" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip field={field} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
