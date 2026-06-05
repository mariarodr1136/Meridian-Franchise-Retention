"use client";

import { useState, useMemo, useEffect } from "react";
import type { StudioMetric } from "@/types";
import { formatPercent, formatNumber, formatCurrency } from "@/lib/utils";

type Mode = "monthly" | "quarterly" | "yearly";

interface Group {
  key: string;
  label: string;
  metrics: StudioMetric[];
}

interface Aggregated {
  classFillRate: number;
  activeMemberships: number;
  totalRevenue: number;
  avgChurn: number;
  weekCount: number;
}

function buildGroups(metrics: StudioMetric[], mode: Mode): Group[] {
  const map = new Map<string, { label: string; metrics: StudioMetric[] }>();
  for (const m of metrics) {
    const d = new Date(m.weekOf);
    let key: string;
    let label: string;
    if (mode === "monthly") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (mode === "quarterly") {
      const q = Math.ceil((d.getMonth() + 1) / 3);
      key = `${d.getFullYear()}-Q${q}`;
      label = `Q${q} ${d.getFullYear()}`;
    } else {
      key = String(d.getFullYear());
      label = String(d.getFullYear());
    }
    if (!map.has(key)) map.set(key, { label, metrics: [] });
    map.get(key)!.metrics.push(m);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, { label, metrics }]) => ({ key, label, metrics }));
}

function aggregate(metrics: StudioMetric[]): Aggregated | null {
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
  if (Math.abs(pct) < 0.5) return <span className="text-xs" style={{ color: "#9CA3AF" }}>—</span>;
  const isGood = reverse ? pct < 0 : pct > 0;
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
      background: isGood ? "#DCFCE7" : "#FEF3C7",
      color: isGood ? "#16a34a" : "#d97706",
    }}>
      {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

interface Props { metrics: StudioMetric[] }

export function MetricsComparison({ metrics }: Props) {
  const [mode, setMode] = useState<Mode>("monthly");

  const groups = useMemo(() => buildGroups(metrics, mode), [metrics, mode]);

  const [keyA, setKeyA] = useState(groups[0]?.key ?? "");
  const [keyB, setKeyB] = useState(groups[1]?.key ?? "");

  useEffect(() => {
    setKeyA(groups[0]?.key ?? "");
    setKeyB(groups[1]?.key ?? "");
  }, [groups]);

  const dataA = useMemo(() => aggregate(groups.find((g) => g.key === keyA)?.metrics ?? []), [groups, keyA]);
  const dataB = useMemo(() => aggregate(groups.find((g) => g.key === keyB)?.metrics ?? []), [groups, keyB]);

  const labelA = groups.find((g) => g.key === keyA)?.label ?? "—";
  const labelB = groups.find((g) => g.key === keyB)?.label ?? "—";

  const modes: { key: Mode; label: string }[] = [
    { key: "monthly",   label: "Monthly"   },
    { key: "quarterly", label: "Quarterly" },
    { key: "yearly",    label: "Yearly"    },
  ];

  const notEnoughData = groups.length < 2;

  const kpis: { label: string; note?: string; a: number | undefined; b: number | undefined; format: (v: number) => string; reverse?: boolean }[] = [
    { label: "Class Occupancy",  a: dataA?.classFillRate,     b: dataB?.classFillRate,     format: formatPercent },
    { label: "Active Members",   note: "end of period", a: dataA?.activeMemberships, b: dataB?.activeMemberships, format: formatNumber },
    { label: "Revenue",          a: dataA?.totalRevenue,      b: dataB?.totalRevenue,      format: formatCurrency },
    { label: "Avg Weekly Churn", a: dataA?.avgChurn,          b: dataB?.avgChurn,          format: formatPercent, reverse: true },
  ];

  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Header + mode tabs */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
          Compare Periods
        </h3>
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F0F5FB" }}>
          {modes.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all cursor-pointer"
              style={mode === key
                ? { background: "#fff", color: "#4A638D", boxShadow: "0 1px 3px rgba(74,99,141,0.15)" }
                : { color: "#9CA3AF" }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Not enough data message */}
      {notEnoughData && (
        <div className="rounded-xl py-8 text-center" style={{ background: "#F8FAFD", border: "1px solid #EEF3FB" }}>
          <p className="text-sm font-medium mb-1" style={{ color: "#6B7280" }}>Not enough data to compare {mode === "quarterly" ? "quarters" : "years"}</p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Try switching to Monthly for more options</p>
        </div>
      )}

      {/* Period selectors */}
      {!notEnoughData && <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "#9CA3AF" }}>
            Compare
          </label>
          <select
            value={keyA}
            onChange={(e) => setKeyA(e.target.value)}
            className="w-full text-sm font-semibold rounded-xl border px-3 py-2.5 cursor-pointer"
            style={{ borderColor: "#4A638D", color: "#1F2937", background: "#fff", outline: "none" }}
          >
            {groups.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
          {dataA && <p className="text-[10px] mt-1.5" style={{ color: "#9CA3AF" }}>{dataA.weekCount} week{dataA.weekCount !== 1 ? "s" : ""} of data</p>}
        </div>

        <div className="flex flex-col items-center gap-1 pt-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#EEF3FB", color: "#4A638D" }}>
            vs
          </div>
        </div>

        <div className="flex-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest block mb-1.5" style={{ color: "#9CA3AF" }}>
            To
          </label>
          <select
            value={keyB}
            onChange={(e) => setKeyB(e.target.value)}
            className="w-full text-sm font-semibold rounded-xl border px-3 py-2.5 cursor-pointer"
            style={{ borderColor: "#C8D8EE", color: "#6B7280", background: "#fff", outline: "none" }}
          >
            {groups.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
          </select>
          {dataB && <p className="text-[10px] mt-1.5" style={{ color: "#9CA3AF" }}>{dataB.weekCount} week{dataB.weekCount !== 1 ? "s" : ""} of data</p>}
        </div>
      </div>}

      {/* Comparison table */}
      {!notEnoughData && <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #EEF3FB" }}>
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_130px_90px_130px] px-4 py-2.5" style={{ background: "#F8FAFD", borderBottom: "1px solid #EEF3FB" }}>
          <div />
          <p className="text-xs font-bold text-right truncate" style={{ color: "#4A638D" }}>{labelA}</p>
          <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>vs</p>
          <p className="text-xs font-bold text-right truncate" style={{ color: "#9CA3AF" }}>{labelB}</p>
        </div>

        {kpis.map(({ label, note, a, b, format, reverse }, i) => (
          <div
            key={label}
            className="grid grid-cols-[1fr_130px_90px_130px] items-center px-4 py-3.5"
            style={{ borderBottom: i < kpis.length - 1 ? "1px solid #EEF3FB" : "none", background: "#fff" }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: "#374151" }}>{label}</p>
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
      </div>}
    </div>
  );
}
