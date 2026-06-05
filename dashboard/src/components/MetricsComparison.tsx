"use client";

import { useState, useMemo } from "react";
import type { StudioMetric } from "@/types";
import { formatPercent, formatNumber, formatCurrency, weekLabel } from "@/lib/utils";

interface AggregatedPeriod {
  classFillRate: number;
  activeMemberships: number;
  totalRevenue: number;
  avgChurn: number;
  weekCount: number;
}

function aggregatePeriod(metrics: StudioMetric[]): AggregatedPeriod | null {
  if (!metrics.length) return null;
  const sorted = [...metrics].sort((a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime());
  return {
    classFillRate: metrics.reduce((s, m) => s + m.classFillRate, 0) / metrics.length,
    activeMemberships: sorted[sorted.length - 1].activeMemberships,
    totalRevenue: metrics.reduce((s, m) => s + m.weeklyRevenue, 0),
    avgChurn: metrics.reduce((s, m) => s + m.weeklyChurn, 0) / metrics.length,
    weekCount: metrics.length,
  };
}

function Delta({ a, b, reverse = false }: { a: number; b: number; reverse?: boolean }) {
  if (!b) return <span style={{ color: "#9CA3AF" }}>—</span>;
  const pct = ((a - b) / b) * 100;
  const isFlat = Math.abs(pct) < 0.5;
  if (isFlat) return <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>—</span>;
  const isGood = reverse ? pct < 0 : pct > 0;
  return (
    <span className="text-xs font-bold" style={{ color: isGood ? "#16a34a" : "#ea580c" }}>
      {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

interface Props {
  metrics: StudioMetric[];
}

export function MetricsComparison({ metrics }: Props) {
  const sorted = useMemo(
    () => [...metrics].sort((a, b) => new Date(a.weekOf).getTime() - new Date(b.weekOf).getTime()),
    [metrics]
  );

  const n = sorted.length;

  const aStartIdx = Math.max(0, n - 4);
  const bEndIdx = aStartIdx > 0 ? aStartIdx - 1 : 0;
  const bStartIdx = Math.max(0, bEndIdx - 3);

  const [aFrom, setAFrom] = useState(sorted[aStartIdx]?.weekOf ?? "");
  const [aTo, setATo] = useState(sorted[n - 1]?.weekOf ?? "");
  const [bFrom, setBFrom] = useState(sorted[bStartIdx]?.weekOf ?? "");
  const [bTo, setBTo] = useState(sorted[bEndIdx]?.weekOf ?? "");

  const periodA = useMemo(() => {
    const from = new Date(aFrom).getTime();
    const to = new Date(aTo).getTime();
    return aggregatePeriod(sorted.filter((m) => {
      const t = new Date(m.weekOf).getTime();
      return t >= from && t <= to;
    }));
  }, [sorted, aFrom, aTo]);

  const periodB = useMemo(() => {
    const from = new Date(bFrom).getTime();
    const to = new Date(bTo).getTime();
    return aggregatePeriod(sorted.filter((m) => {
      const t = new Date(m.weekOf).getTime();
      return t >= from && t <= to;
    }));
  }, [sorted, bFrom, bTo]);

  if (n < 2) return null;

  const weekOptions = sorted.map((m) => ({ value: m.weekOf, label: weekLabel(m.weekOf) }));

  const kpis: {
    label: string;
    note?: string;
    a: number | undefined;
    b: number | undefined;
    format: (v: number) => string;
    reverse?: boolean;
  }[] = [
    {
      label: "Class Occupancy",
      a: periodA?.classFillRate,
      b: periodB?.classFillRate,
      format: (v) => formatPercent(v),
    },
    {
      label: "Active Members",
      note: "end of period",
      a: periodA?.activeMemberships,
      b: periodB?.activeMemberships,
      format: (v) => formatNumber(v),
    },
    {
      label: "Total Revenue",
      a: periodA?.totalRevenue,
      b: periodB?.totalRevenue,
      format: (v) => formatCurrency(v),
    },
    {
      label: "Avg Weekly Churn",
      a: periodA?.avgChurn,
      b: periodB?.avgChurn,
      format: (v) => formatPercent(v),
      reverse: true,
    },
  ];

  return (
    <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <h3 className="text-xs font-bold tracking-widest uppercase mb-5" style={{ color: "#4A638D" }}>
        Period Comparison
      </h3>

      {/* Period pickers */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {([
          { label: "Period A", from: aFrom, to: aTo, setFrom: setAFrom, setTo: setATo, period: periodA, accent: "#4A638D" },
          { label: "Period B", from: bFrom, to: bTo, setFrom: setBFrom, setTo: setBTo, period: periodB, accent: "#9CA3AF" },
        ] as const).map(({ label, from, to, setFrom, setTo, period, accent }) => (
          <div key={label} className="rounded-lg p-4" style={{ background: "#F8FAFD", border: "1px solid #EEF3FB" }}>
            <p className="text-xs font-bold mb-3" style={{ color: accent }}>{label}</p>
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>From</label>
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="text-xs rounded-md border px-2 py-1.5 cursor-pointer"
                  style={{ borderColor: "#E5E7EB", color: "#1F2937", background: "#fff" }}
                >
                  {weekOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <span className="text-xs pb-1.5" style={{ color: "#9CA3AF" }}>→</span>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>To</label>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="text-xs rounded-md border px-2 py-1.5 cursor-pointer"
                  style={{ borderColor: "#E5E7EB", color: "#1F2937", background: "#fff" }}
                >
                  {weekOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            {period && (
              <p className="text-[10px] mt-2" style={{ color: "#9CA3AF" }}>
                {period.weekCount} week{period.weekCount !== 1 ? "s" : ""}
              </p>
            )}
            {!period && (
              <p className="text-[10px] mt-2 text-orange-400">No data in range</p>
            )}
          </div>
        ))}
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-[1fr_120px_64px_120px] gap-3 mb-1 px-1">
        <div />
        <p className="text-[10px] font-bold text-right uppercase tracking-widest" style={{ color: "#4A638D" }}>Period A</p>
        <p className="text-[10px] text-center uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Δ</p>
        <p className="text-[10px] font-bold text-right uppercase tracking-widest" style={{ color: "#9CA3AF" }}>Period B</p>
      </div>

      {/* Comparison rows */}
      <div style={{ borderTop: "1px solid #EEF3FB" }}>
        {kpis.map(({ label, note, a, b, format, reverse }) => (
          <div
            key={label}
            className="grid grid-cols-[1fr_120px_64px_120px] items-center gap-3 py-3 px-1"
            style={{ borderBottom: "1px solid #EEF3FB" }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: "#374151" }}>{label}</p>
              {note && <p className="text-[10px]" style={{ color: "#9CA3AF" }}>{note}</p>}
            </div>
            <p className="text-sm font-bold text-right" style={{ color: "#1F2937" }}>
              {a !== undefined ? format(a) : "—"}
            </p>
            <div className="flex justify-center">
              {a !== undefined && b !== undefined
                ? <Delta a={a} b={b} reverse={reverse} />
                : <span className="text-xs" style={{ color: "#9CA3AF" }}>—</span>
              }
            </div>
            <p className="text-sm font-bold text-right" style={{ color: "#9CA3AF" }}>
              {b !== undefined ? format(b) : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
