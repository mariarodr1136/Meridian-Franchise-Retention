"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const NAVY = "#4A638D";
const GOLD = "#C9A84C";
const BORDER = "#C8D8EE";

interface StudioOption {
  id: string;
  name: string;
  city: string;
  state: string | null;
  status: string;
  openedAt: string | null;
  region: string;
  metrics: {
    weekOf: string;
    weeklyRevenue: number;
    activeMemberships: number;
    classFillRate: number;
    weeklyChurn: number;
    memberBookings: number;
    classPackBookings: number;
    classPassBookings: number;
  }[];
}

type ChartField = "weeklyRevenue" | "activeMemberships" | "classFillRate" | "weeklyChurn";

const FIELD_CONFIG: Record<ChartField, { label: string; format: (v: number) => string; reverse?: boolean }> = {
  weeklyRevenue:     { label: "Weekly Revenue",      format: (v) => `$${Math.round(v).toLocaleString()}` },
  activeMemberships: { label: "Active Members",       format: (v) => Math.round(v).toLocaleString() },
  classFillRate:     { label: "Class Fill Rate",      format: (v) => `${(v * 100).toFixed(1)}%` },
  weeklyChurn:       { label: "Weekly Churn",         format: (v) => `${(v * 100).toFixed(2)}%`, reverse: true },
};

const COLORS: [string, string] = [NAVY, GOLD];

function weekLabel(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmt(field: ChartField, v: number) { return FIELD_CONFIG[field].format(v); }

interface KpiRowProps {
  label: string;
  a: string | null;
  b: string | null;
  aWin?: boolean;
  bWin?: boolean;
}

function KpiRow({ label, a, b, aWin, bWin }: KpiRowProps) {
  return (
    <div className="flex items-center py-3 border-b last:border-b-0" style={{ borderColor: "#EEF3FB" }}>
      <div className="flex-1 text-right pr-6">
        <span
          className="text-sm font-bold"
          style={{ color: aWin ? "#16a34a" : "#1F2937" }}
        >
          {a ?? "—"}
        </span>
        {aWin && <span className="ml-1 text-xs font-semibold text-green-600">↑</span>}
      </div>
      <div className="w-48 text-center flex-shrink-0">
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: "#9CA3AF" }}>{label}</span>
      </div>
      <div className="flex-1 pl-6">
        <span
          className="text-sm font-bold"
          style={{ color: bWin ? "#16a34a" : "#1F2937" }}
        >
          {b ?? "—"}
        </span>
        {bWin && <span className="ml-1 text-xs font-semibold text-green-600">↑</span>}
      </div>
    </div>
  );
}

function CompareChart({
  studioA,
  studioB,
  field,
}: {
  studioA: StudioOption;
  studioB: StudioOption;
  field: ChartField;
}) {
  const allWeeks = useMemo(() => {
    const weeks = new Set([
      ...studioA.metrics.map((m) => m.weekOf),
      ...studioB.metrics.map((m) => m.weekOf),
    ]);
    return [...weeks].sort();
  }, [studioA, studioB]);

  const data = useMemo(() => {
    const mapA = new Map(studioA.metrics.map((m) => [m.weekOf, m[field]]));
    const mapB = new Map(studioB.metrics.map((m) => [m.weekOf, m[field]]));
    return allWeeks.map((w) => ({
      week: weekLabel(w),
      [studioA.name]: mapA.get(w) ?? null,
      [studioB.name]: mapB.get(w) ?? null,
    }));
  }, [allWeeks, studioA, studioB, field]);

  const cfg = FIELD_CONFIG[field];

  return (
    <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: BORDER }}>
      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: NAVY }}>
        {cfg.label}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF8" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 8, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            interval={data.length > 8 ? Math.floor(data.length / 6) : 0}
          />
          <YAxis
            tick={{ fontSize: 8, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => cfg.format(v)}
            tickCount={4}
          />
          <Tooltip
            formatter={(v, name) => [cfg.format(Number(v)), String(name)]}
            contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: BORDER }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10 }}
            formatter={(v) => <span style={{ color: "#6B7280" }}>{v}</span>}
          />
          {[studioA, studioB].map((s, i) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.name}
              stroke={COLORS[i]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Props {
  studios: StudioOption[];
}

export function CompareContent({ studios }: Props) {
  const [idA, setIdA] = useState(studios[0]?.id ?? "");
  const [idB, setIdB] = useState(studios[1]?.id ?? "");

  const studioA = studios.find((s) => s.id === idA);
  const studioB = studios.find((s) => s.id === idB);

  const latestA = studioA?.metrics[0];
  const latestB = studioB?.metrics[0];

  const winA = (fieldA: number | undefined, fieldB: number | undefined, reverse = false) => {
    if (fieldA == null || fieldB == null) return false;
    return reverse ? fieldA < fieldB : fieldA > fieldB;
  };

  const selectStyle = {
    background: "#fff",
    border: `1.5px solid ${BORDER}`,
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "#1F2937",
    width: "100%",
    cursor: "pointer",
    outline: "none",
  };

  return (
    <div>
      {/* Studio selectors */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {([["A", idA, setIdA, NAVY], ["B", idB, setIdB, GOLD]] as const).map(
          ([label, value, setter, color]) => (
            <div key={label}>
              <p
                className="text-xs font-bold tracking-widest uppercase mb-2"
                style={{ color: color as string }}
              >
                Studio {label}
              </p>
              <select
                value={value}
                onChange={(e) => setter(e.target.value)}
                style={{ ...selectStyle, borderColor: color as string }}
              >
                {studios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.city}{s.state ? `, ${s.state}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )
        )}
      </div>

      {studioA && studioB && (
        <>
          {/* KPI comparison table */}
          <div className="rounded-xl border mb-6" style={{ background: "#fff", borderColor: BORDER }}>
            {/* Header row */}
            <div className="flex items-center py-4 px-6 border-b" style={{ borderColor: BORDER }}>
              <div className="flex-1 text-right pr-6">
                <Link
                  href={`/studios/${studioA.id}`}
                  className="text-sm font-bold transition-opacity hover:opacity-70"
                  style={{ color: NAVY }}
                >
                  {studioA.name}
                </Link>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                  {studioA.city}{studioA.state ? `, ${studioA.state}` : ""}
                </p>
              </div>
              <div className="w-48 flex-shrink-0" />
              <div className="flex-1 pl-6">
                <Link
                  href={`/studios/${studioB.id}`}
                  className="text-sm font-bold transition-opacity hover:opacity-70"
                  style={{ color: GOLD }}
                >
                  {studioB.name}
                </Link>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                  {studioB.city}{studioB.state ? `, ${studioB.state}` : ""}
                </p>
              </div>
            </div>

            <div className="px-6">
              {latestA || latestB ? (
                <>
                  <KpiRow
                    label="Weekly Revenue"
                    a={latestA ? `$${Math.round(latestA.weeklyRevenue).toLocaleString()}` : null}
                    b={latestB ? `$${Math.round(latestB.weeklyRevenue).toLocaleString()}` : null}
                    aWin={winA(latestA?.weeklyRevenue, latestB?.weeklyRevenue)}
                    bWin={winA(latestB?.weeklyRevenue, latestA?.weeklyRevenue)}
                  />
                  <KpiRow
                    label="Active Members"
                    a={latestA ? latestA.activeMemberships.toLocaleString() : null}
                    b={latestB ? latestB.activeMemberships.toLocaleString() : null}
                    aWin={winA(latestA?.activeMemberships, latestB?.activeMemberships)}
                    bWin={winA(latestB?.activeMemberships, latestA?.activeMemberships)}
                  />
                  <KpiRow
                    label="Class Fill Rate"
                    a={latestA ? `${(latestA.classFillRate * 100).toFixed(1)}%` : null}
                    b={latestB ? `${(latestB.classFillRate * 100).toFixed(1)}%` : null}
                    aWin={winA(latestA?.classFillRate, latestB?.classFillRate)}
                    bWin={winA(latestB?.classFillRate, latestA?.classFillRate)}
                  />
                  <KpiRow
                    label="Weekly Churn"
                    a={latestA ? `${(latestA.weeklyChurn * 100).toFixed(2)}%` : null}
                    b={latestB ? `${(latestB.weeklyChurn * 100).toFixed(2)}%` : null}
                    aWin={winA(latestA?.weeklyChurn, latestB?.weeklyChurn, true)}
                    bWin={winA(latestB?.weeklyChurn, latestA?.weeklyChurn, true)}
                  />
                  <KpiRow
                    label="Rev / Member"
                    a={latestA ? `$${Math.round(latestA.weeklyRevenue / (latestA.activeMemberships || 1))}` : null}
                    b={latestB ? `$${Math.round(latestB.weeklyRevenue / (latestB.activeMemberships || 1))}` : null}
                    aWin={
                      latestA && latestB
                        ? latestA.weeklyRevenue / latestA.activeMemberships >
                          latestB.weeklyRevenue / latestB.activeMemberships
                        : false
                    }
                    bWin={
                      latestA && latestB
                        ? latestB.weeklyRevenue / latestB.activeMemberships >
                          latestA.weeklyRevenue / latestA.activeMemberships
                        : false
                    }
                  />
                  <KpiRow
                    label="Member Booking Mix"
                    a={latestA
                      ? `${Math.round((latestA.memberBookings / Math.max(1, latestA.memberBookings + latestA.classPackBookings + latestA.classPassBookings)) * 100)}%`
                      : null}
                    b={latestB
                      ? `${Math.round((latestB.memberBookings / Math.max(1, latestB.memberBookings + latestB.classPackBookings + latestB.classPassBookings)) * 100)}%`
                      : null}
                    aWin={
                      latestA && latestB
                        ? latestA.memberBookings / Math.max(1, latestA.memberBookings + latestA.classPackBookings + latestA.classPassBookings) >
                          latestB.memberBookings / Math.max(1, latestB.memberBookings + latestB.classPackBookings + latestB.classPassBookings)
                        : false
                    }
                    bWin={
                      latestA && latestB
                        ? latestB.memberBookings / Math.max(1, latestB.memberBookings + latestB.classPackBookings + latestB.classPassBookings) >
                          latestA.memberBookings / Math.max(1, latestA.memberBookings + latestA.classPackBookings + latestA.classPassBookings)
                        : false
                    }
                  />
                </>
              ) : (
                <p className="text-sm py-6 text-center" style={{ color: "#9CA3AF" }}>
                  No metrics available for one or both studios.
                </p>
              )}
            </div>
          </div>

          {/* Trend charts */}
          {studioA.metrics.length > 1 && studioB.metrics.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["weeklyRevenue", "activeMemberships", "classFillRate", "weeklyChurn"] as ChartField[]).map(
                (field) => (
                  <CompareChart key={field} studioA={studioA} studioB={studioB} field={field} />
                )
              )}
            </div>
          )}
        </>
      )}

      {(!studioA || !studioB) && (
        <div className="rounded-xl border p-16 text-center" style={{ background: "#fff", borderColor: BORDER }}>
          <p className="font-medium" style={{ color: "#1F2937" }}>Select two studios to compare</p>
          <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
            Side-by-side KPIs and trend charts will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
