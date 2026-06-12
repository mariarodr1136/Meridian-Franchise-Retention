"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

interface StudioMetricData {
  weeklyRevenue: number;
  classFillRate: number;
  activeMemberships: number;
  weeklyChurn: number;
}

interface DigestStudio {
  id: string;
  name: string;
  city: string;
  state: string | null;
  metrics: StudioMetricData[];
}

interface DigestAnomaly {
  id: string;
  severity: "high" | "medium" | "low";
  summary: string;
  generatedAt: string;
  category: string;
  studioId: string | null;
  studioName: string | null;
  studioCity: string | null;
}

interface Props {
  topStudios: DigestStudio[];
  anomalies: DigestAnomaly[];
  atRiskStudios: DigestStudio[];
  newStudios: DigestStudio[];
}

const severityConfig = {
  high:   { dot: "#DC2626", label: "Critical", labelBg: "#FEE2E2", labelColor: "#B91C1C" },
  medium: { dot: "#D97706", label: "Warning",  labelBg: "#FEF3C7", labelColor: "#B45309" },
  low:    { dot: "#4A638D", label: "Advisory", labelBg: "#EEF3FB", labelColor: "#4A638D" },
};

const categoryLabel: Record<string, string> = {
  churn: "Churn", occupancy: "Occupancy", membership: "Membership",
  instructor: "Instructor", presales: "Presales",
};

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 6" fill="none" aria-hidden="true"
      style={{
        color: "#9CA3AF",
        flexShrink: 0,
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeltaBadge({ current, prior, good = true }: { current: number; prior: number; good?: boolean }) {
  if (!prior) return null;
  const pct = ((current - prior) / prior) * 100;
  const isUp = pct >= 0;
  const isGood = good ? isUp : !isUp;
  return (
    <span className="text-[10px] font-medium" style={{ color: isGood ? "#16A34A" : "#EA580C" }}>
      {isUp ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function SmoothExpand({ expanded, children }: { expanded: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateRows: expanded ? "1fr" : "0fr",
      transition: "grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>
      <div style={{ overflow: "hidden", minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

export function DigestSections({ topStudios, anomalies, atRiskStudios, newStudios }: Props) {
  const [expandedTop, setExpandedTop] = useState<string | null>(null);
  const [expandedAtRisk, setExpandedAtRisk] = useState<string | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [hoveredTop, setHoveredTop] = useState<string | null>(null);
  const [hoveredAtRisk, setHoveredAtRisk] = useState<string | null>(null);
  const [hoveredNew, setHoveredNew] = useState<string | null>(null);
  const [hoveredAlert, setHoveredAlert] = useState<string | null>(null);

  const highAlerts = anomalies.filter((a) => a.severity === "high");
  const mediumAlerts = anomalies.filter((a) => a.severity === "medium");

  return (
    <>
      {/* Top Studios + Active Alerts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Top Studios */}
        <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#E4EDF8" }}>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
              Top Studios · Weekly Revenue
            </p>
          </div>
          <div>
            {topStudios.map((s, i) => {
              const isHovered = hoveredTop === s.id;
              const isExpanded = expandedTop === s.id;
              const m0 = s.metrics[0];
              const m1 = s.metrics[1];
              return (
                <div
                  key={s.id}
                  onClick={() => setExpandedTop(isExpanded ? null : s.id)}
                  onMouseEnter={() => setHoveredTop(s.id)}
                  onMouseLeave={() => setHoveredTop(null)}
                  className="border-b last:border-0 cursor-pointer select-none"
                  style={{
                    borderColor: "#E4EDF8",
                    background: isExpanded ? "#F4F8FE" : isHovered ? "#F8FAFD" : "#FFFFFF",
                    transform: !isExpanded && isHovered ? "translateY(-1px)" : "translateY(0)",
                    boxShadow: isExpanded
                      ? "0 2px 12px rgba(74,99,141,0.1)"
                      : isHovered
                      ? "0 4px 14px rgba(74,99,141,0.12)"
                      : "none",
                    transition: "background 0.15s ease, transform 0.18s ease, box-shadow 0.18s ease",
                  }}
                >
                  <div className="flex items-center px-4 py-2.5 gap-2">
                    <span className="text-xs w-5 text-center flex-shrink-0" style={{ color: "#9CA3AF" }}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1F2937" }}>{s.name}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>{s.city}{s.state ? `, ${s.state}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>
                          {formatCurrency(m0?.weeklyRevenue ?? 0)}
                        </p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          {formatPercent(m0?.classFillRate ?? 0)} fill
                        </p>
                      </div>
                      <Chevron expanded={isExpanded} />
                    </div>
                  </div>

                  <SmoothExpand expanded={isExpanded}>
                    <div className="px-4 pb-3">
                      <div style={{ height: 1, background: "#E4EDF8", marginBottom: 10 }} />
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Members</p>
                          <p className="text-xs font-semibold" style={{ color: "#1F2937" }}>
                            {formatNumber(m0?.activeMemberships ?? 0)}
                          </p>
                          {m1 && <DeltaBadge current={m0?.activeMemberships ?? 0} prior={m1.activeMemberships} />}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Rev WoW</p>
                          <p className="text-xs font-semibold" style={{ color: "#1F2937" }}>
                            {formatCurrency(m0?.weeklyRevenue ?? 0)}
                          </p>
                          {m1 && <DeltaBadge current={m0?.weeklyRevenue ?? 0} prior={m1.weeklyRevenue} />}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Churn</p>
                          <p className="text-xs font-semibold" style={{ color: "#EA580C" }}>
                            {formatPercent(m0?.weeklyChurn ?? 0)}
                          </p>
                          {m1 && <DeltaBadge current={m0?.weeklyChurn ?? 0} prior={m1.weeklyChurn} good={false} />}
                        </div>
                      </div>
                      <Link
                        href={`/studios/${s.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-semibold transition-opacity hover:opacity-70"
                        style={{ color: "#4A638D" }}
                      >
                        View Studio →
                      </Link>
                    </div>
                  </SmoothExpand>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Alerts — AnomalyFeed style */}
        <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "#E4EDF8" }}>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Active Alerts</p>
            <div className="flex items-center gap-2">
              {highAlerts.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "#DC2626" }}>
                  {highAlerts.length} critical
                </span>
              )}
              {mediumAlerts.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "#D97706" }}>
                  {mediumAlerts.length} warning
                </span>
              )}
            </div>
          </div>

          {anomalies.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm" style={{ color: "#9CA3AF" }}>No active alerts</p>
            </div>
          ) : (
            <div className="p-3 flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 360 }}>
              {anomalies.map((a) => {
                const sc = severityConfig[a.severity];
                const date = new Date(a.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const isExpanded = expandedAlert === a.id;
                const isHovered = hoveredAlert === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setExpandedAlert(isExpanded ? null : a.id)}
                    onMouseEnter={() => setHoveredAlert(a.id)}
                    onMouseLeave={() => setHoveredAlert(null)}
                    className="rounded-xl border cursor-pointer select-none"
                    style={{
                      background: "#F8FAFD",
                      borderColor: isExpanded ? sc.dot : isHovered ? "#4A638D" : "#C8D8EE",
                      boxShadow: isExpanded
                        ? "0 4px 16px rgba(0,0,0,0.08)"
                        : isHovered
                        ? "0 6px 20px rgba(74,99,141,0.15)"
                        : "none",
                      transform: !isExpanded && isHovered ? "translateY(-2px)" : "translateY(0)",
                      transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
                    }}
                  >
                    <div className="p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
                          <span
                            className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded"
                            style={{ background: sc.labelBg, color: sc.labelColor }}
                          >
                            {sc.label}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                            {categoryLabel[a.category] ?? a.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{date}</span>
                          <Chevron expanded={isExpanded} />
                        </div>
                      </div>
                      {a.studioName && (
                        <p className="text-xs font-semibold mb-1" style={{ color: "#1F2937" }}>
                          {a.studioName}{a.studioCity ? ` · ${a.studioCity}` : ""}
                        </p>
                      )}
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{
                          color: "#6B7280",
                          display: "-webkit-box",
                          WebkitLineClamp: isExpanded ? ("unset" as unknown as number) : 2,
                          WebkitBoxOrient: "vertical" as const,
                          overflow: isExpanded ? "visible" : "hidden",
                        }}
                      >
                        {a.summary}
                      </p>
                    </div>

                    <SmoothExpand expanded={isExpanded}>
                      <div className="px-3.5 pb-3.5">
                        <div style={{ height: 1, background: "#F3F4F6", marginBottom: 10 }} />
                        {a.studioId && (
                          <Link
                            href={`/studios/${a.studioId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] font-semibold transition-opacity hover:opacity-70"
                            style={{ color: "#4A638D" }}
                          >
                            View Studio →
                          </Link>
                        )}
                      </div>
                    </SmoothExpand>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* At-Risk Studios */}
      {atRiskStudios.length > 0 && (
        <div className="rounded-xl border overflow-hidden mb-6" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#E4EDF8", background: "#FFF5F5" }}>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#DC2626" }}>
              At-Risk Studios — Requires Attention
            </p>
          </div>
          <div>
            {atRiskStudios.map((s) => {
              const isHovered = hoveredAtRisk === s.id;
              const isExpanded = expandedAtRisk === s.id;
              const m0 = s.metrics[0];
              const m1 = s.metrics[1];
              return (
                <div
                  key={s.id}
                  onClick={() => setExpandedAtRisk(isExpanded ? null : s.id)}
                  onMouseEnter={() => setHoveredAtRisk(s.id)}
                  onMouseLeave={() => setHoveredAtRisk(null)}
                  className="border-b last:border-0 cursor-pointer select-none"
                  style={{
                    borderColor: "#E4EDF8",
                    background: isExpanded ? "#FFF5F5" : isHovered ? "#FFF8F5" : "#FFFFFF",
                    transform: !isExpanded && isHovered ? "translateY(-1px)" : "translateY(0)",
                    boxShadow: isExpanded
                      ? "0 2px 12px rgba(220,38,38,0.08)"
                      : isHovered
                      ? "0 4px 14px rgba(220,38,38,0.1)"
                      : "none",
                    transition: "background 0.15s ease, transform 0.18s ease, box-shadow 0.18s ease",
                  }}
                >
                  <div className="flex items-center px-4 py-3 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "#1F2937" }}>{s.name}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>{s.city}{s.state ? `, ${s.state}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-5 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Fill</p>
                        <p className="text-sm" style={{ color: "#EA580C" }}>{formatPercent(m0?.classFillRate ?? 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Members</p>
                        <p className="text-sm">{formatNumber(m0?.activeMemberships ?? 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Weekly Rev</p>
                        <p className="text-sm">{formatCurrency(m0?.weeklyRevenue ?? 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Churn</p>
                        <p className="text-sm" style={{ color: "#EA580C" }}>{formatPercent(m0?.weeklyChurn ?? 0)}</p>
                      </div>
                      <Chevron expanded={isExpanded} />
                    </div>
                  </div>

                  <SmoothExpand expanded={isExpanded}>
                    <div className="px-4 pb-3">
                      <div style={{ height: 1, background: "#FEE2E2", marginBottom: 10 }} />
                      <div className="grid grid-cols-4 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Rev WoW</p>
                          <p className="text-xs font-semibold" style={{ color: "#1F2937" }}>
                            {formatCurrency(m0?.weeklyRevenue ?? 0)}
                          </p>
                          {m1 && <DeltaBadge current={m0?.weeklyRevenue ?? 0} prior={m1.weeklyRevenue} />}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Fill WoW</p>
                          <p className="text-xs font-semibold" style={{ color: "#1F2937" }}>
                            {formatPercent(m0?.classFillRate ?? 0)}
                          </p>
                          {m1 && <DeltaBadge current={m0?.classFillRate ?? 0} prior={m1.classFillRate} />}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Members WoW</p>
                          <p className="text-xs font-semibold" style={{ color: "#1F2937" }}>
                            {formatNumber(m0?.activeMemberships ?? 0)}
                          </p>
                          {m1 && <DeltaBadge current={m0?.activeMemberships ?? 0} prior={m1.activeMemberships} />}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Churn WoW</p>
                          <p className="text-xs font-semibold" style={{ color: "#EA580C" }}>
                            {formatPercent(m0?.weeklyChurn ?? 0)}
                          </p>
                          {m1 && <DeltaBadge current={m0?.weeklyChurn ?? 0} prior={m1.weeklyChurn} good={false} />}
                        </div>
                      </div>
                      <Link
                        href={`/studios/${s.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-semibold transition-opacity hover:opacity-70"
                        style={{ color: "#DC2626" }}
                      >
                        View Studio →
                      </Link>
                    </div>
                  </SmoothExpand>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Studios Ramp */}
      {newStudios.length > 0 && (
        <div className="rounded-xl border overflow-hidden" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "#E4EDF8" }}>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
              New Studios — Ramp Progress
            </p>
          </div>
          <div className="grid gap-0 divide-x" style={{ borderColor: "#E4EDF8", gridTemplateColumns: `repeat(${Math.min(newStudios.length, 3)}, 1fr)` }}>
            {newStudios.map((s) => {
              const isHovered = hoveredNew === s.id;
              const fillRate = s.metrics[0]?.classFillRate ?? 0;
              return (
                <div
                  key={s.id}
                  onMouseEnter={() => setHoveredNew(s.id)}
                  onMouseLeave={() => setHoveredNew(null)}
                  className="px-4 py-3"
                  style={{
                    background: isHovered ? "#F4F8FE" : "#FFFFFF",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                    boxShadow: isHovered ? "0 4px 14px rgba(74,99,141,0.12)" : "none",
                    transition: "background 0.15s ease, transform 0.18s ease, box-shadow 0.18s ease",
                  }}
                >
                  <p className="text-sm font-medium" style={{ color: "#1F2937" }}>{s.name}</p>
                  <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>{s.city}{s.state ? `, ${s.state}` : ""}</p>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "#E4EDF8" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: formatPercent(fillRate),
                        background: isHovered ? "#3D5580" : "#4A638D",
                        transition: "background 0.18s ease",
                      }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                    {formatPercent(fillRate)} fill · {formatNumber(s.metrics[0]?.activeMemberships ?? 0)} members
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
