"use client";

import { useMemo } from "react";
import Link from "next/link";
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

function formatYTick(field: ChartField, v: number): string {
  if (field === "weeklyRevenue") {
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${Math.round(v)}`;
  }
  if (field === "classFillRate") return `${(v * 100).toFixed(0)}%`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

interface TooltipContentProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  field: ChartField;
  data: { week: string; value: number }[];
}

function CustomTooltip({ active, payload, label, field, data }: TooltipContentProps) {
  if (!active || !payload?.length || !label) return null;

  const currentValue = payload[0].value;
  const currentIndex = data.findIndex(d => d.week === label);
  const prevEntry    = currentIndex > 0 ? data[currentIndex - 1] : null;
  const wowDelta     = prevEntry != null ? currentValue - prevEntry.value : null;
  const wowPct       = prevEntry && prevEntry.value !== 0 ? (wowDelta! / prevEntry.value) * 100 : null;
  const up           = (delta: number) => delta >= 0;

  return (
    <div className="rounded-xl border px-3.5 py-2.5 text-xs shadow-lg"
      style={{ background: "#fff", borderColor: "#C8D8EE", minWidth: 170, pointerEvents: "none" }}>
      <p className="mb-1" style={{ color: "#9CA3AF", fontSize: 10 }}>{label}</p>
      <p className="font-bold mb-1.5" style={{ fontSize: 15, color: "#1F2937" }}>{formatValue(field, currentValue)}</p>
      {wowDelta !== null && wowPct !== null && (
        <div className="flex items-center gap-1.5">
          <span style={{ color: "#9CA3AF", fontSize: 9 }}>vs prev week</span>
          <span className="font-semibold" style={{ color: up(wowDelta) ? "#16a34a" : "#ea580c", fontSize: 11 }}>
            {up(wowDelta) ? "▲" : "▼"} {formatValue(field, Math.abs(wowDelta))}
            <span style={{ fontWeight: 400, marginLeft: 3, fontSize: 10 }}>
              ({up(wowPct) ? "+" : ""}{wowPct.toFixed(1)}%)
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

interface Props {
  metrics: StudioMetric[];
  field: ChartField;
  color?: string;
  label: string;
  href?: string;
}

export function TrendChart({ metrics, field, color = "#C9A84C", label, href }: Props) {
  const data = useMemo(() => {
    const sorted = [...metrics].sort(
      (a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime()
    );
    return sorted.map(m => ({ week: weekLabel(m.weekOf), value: m[field] as number }));
  }, [metrics, field]);

  // Tight Y domain so small changes are visible
  const yDomain = useMemo((): [number, number] => {
    const vals = data.map(d => d.value).filter(isFinite);
    if (!vals.length) return [0, 1];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min;
    const pad = range === 0 ? Math.max(Math.abs(min) * 0.1, 1) : range * 0.25;
    const lo  = Math.max(0, min - pad);
    const hi  = field === "classFillRate" ? Math.min(1, max + pad) : max + pad;
    return [lo, hi];
  }, [data, field]);

  const xInterval = data.length <= 8 ? 0 : data.length <= 16 ? 1 : Math.floor(data.length / 8);

  return (
    <div className="w-full">
      {href ? (
        <Link
          href={href}
          className="text-xs font-bold tracking-widest uppercase mb-3 block transition-opacity hover:opacity-70"
          style={{ color: "#4A638D" }}
        >
          {label} →
        </Link>
      ) : (
        <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#4A638D" }}>{label}</p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF8" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 9, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            interval={xInterval}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => formatYTick(field, v)}
            domain={yDomain}
            width={52}
            tickCount={5}
          />
          <Tooltip
            content={<CustomTooltip field={field} data={data} />}
            cursor={{ stroke: "#C8D8EE", strokeWidth: 1, strokeDasharray: "4 3" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0, fillOpacity: 0.8 }}
            activeDot={{ r: 5, fill: color, stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
