"use client";

import { useState } from "react";
import { RiskBadge } from "@/components/RiskBadge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ChurnPredictions, ChurnMember, RiskLevel } from "@/types/churn";

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: color ?? "#1F2937" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

function RiskBar({ high, medium, low, total }: { high: number; medium: number; low: number; total: number }) {
  return (
    <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>Member Risk Distribution</p>
      <div className="flex h-4 rounded-full overflow-hidden mb-4 gap-px">
        <div style={{ width: `${(high   / total) * 100}%`, background: "#DC2626" }} title="High Risk" />
        <div style={{ width: `${(medium / total) * 100}%`, background: "#D97706" }} title="Medium Risk" />
        <div style={{ width: `${(low    / total) * 100}%`, background: "#4A638D33" }} title="Low Risk" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "High Risk",   count: high,   pct: Math.round((high   / total) * 100), color: "#DC2626", bg: "#FEF2F2" },
          { label: "Medium Risk", count: medium, pct: Math.round((medium / total) * 100), color: "#D97706", bg: "#FEF3C7" },
          { label: "Low Risk",    count: low,    pct: Math.round((low    / total) * 100), color: "#4A638D", bg: "#EEF3FB" },
        ].map(({ label, count, pct, color, bg }) => (
          <div key={label} className="rounded-lg p-3" style={{ background: bg }}>
            <p className="text-2xl font-bold" style={{ color }}>{count}</p>
            <p className="text-xs font-medium" style={{ color }}>{label}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{pct}% of members</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemberRow({ member, rank }: { member: ChurnMember; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="border-b cursor-pointer transition-colors hover:bg-gray-50"
        style={{ borderColor: "#EEF3FB" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="py-3 px-4 text-xs text-center" style={{ color: "#9CA3AF" }}>{rank}</td>
        <td className="py-3 pr-4">
          <p className="text-sm font-medium" style={{ color: "#1F2937" }}>{member.name}</p>
          <p className="text-xs mt-0.5 capitalize" style={{ color: "#9CA3AF" }}>{member.membershipTier}</p>
        </td>
        <td className="py-3 pr-4">
          <RiskBadge level={member.riskLevel as RiskLevel} score={member.riskScore} size="sm" />
        </td>
        <td className="py-3 pr-4 text-sm" style={{ color: "#374151" }}>{member.daysSinceLastVisit}d ago</td>
        <td className="py-3 pr-4 text-sm">
          <span style={{ color: "#374151" }}>{member.visitsLast30d}</span>
          <span className="text-xs ml-1.5" style={{
            color: member.visitsLast30d < member.visitsPrev30d ? "#ea580c" : "#16a34a"
          }}>
            {member.visitsLast30d < member.visitsPrev30d
              ? `↓ ${member.visitsPrev30d - member.visitsLast30d}`
              : member.visitsLast30d > member.visitsPrev30d
              ? `↑ ${member.visitsLast30d - member.visitsPrev30d}`
              : "—"}
          </span>
        </td>
        <td className="py-3 text-sm" style={{ color: "#374151" }}>{formatCurrency(member.monthlyValue * 12)}/yr</td>
        <td className="py-3 px-4 text-xs" style={{ color: "#9CA3AF" }}>{expanded ? "▲" : "▼"}</td>
      </tr>
      {expanded && (
        <tr style={{ background: "#F8FAFD" }}>
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#4A638D" }}>Risk Factors</p>
                <ul className="space-y-1.5">
                  {member.topFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#6B7280" }}>
                      <span className="text-red-500 mt-0.5 flex-shrink-0">▸</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] mt-3" style={{ color: "#9CA3AF" }}>
                  Member for {member.membershipAgeDays} days · No-show rate {formatPercent(member.noShowRate)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: "#4A638D" }}>Suggested Action</p>
                <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>{member.suggestedAction}</p>
                <div className="mt-3 pt-3 flex gap-4" style={{ borderTop: "1px solid #EEF3FB" }}>
                  <div>
                    <p className="text-[10px] mb-0.5" style={{ color: "#9CA3AF" }}>Churn probability</p>
                    <p className="text-sm font-bold" style={{ color: "#DC2626" }}>
                      {Math.round(member.churnProbability * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] mb-0.5" style={{ color: "#9CA3AF" }}>Annual value</p>
                    <p className="text-sm font-bold" style={{ color: "#1F2937" }}>
                      {formatCurrency(member.monthlyValue * 12)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function RoiCalculator({ highRisk, revenueAtRisk }: { highRisk: number; revenueAtRisk: number }) {
  const [pct, setPct] = useState(30);
  const saved = Math.round(revenueAtRisk * (pct / 100));
  return (
    <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>
        Retention ROI Calculator
      </p>
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-2" style={{ color: "#6B7280" }}>
          <span>If you retain this % of high-risk members</span>
          <span className="font-bold" style={{ color: "#C9A84C" }}>{pct}%</span>
        </div>
        <input
          type="range" min={5} max={80} value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "#C9A84C" }}
        />
        <div className="flex justify-between text-[10px] mt-1" style={{ color: "#9CA3AF" }}>
          <span>5%</span><span>80%</span>
        </div>
      </div>
      <div className="rounded-xl p-5 text-center" style={{ background: "#F8FAFD", border: "1px solid #EEF3FB" }}>
        <p className="text-3xl font-bold" style={{ color: "#C9A84C" }}>{formatCurrency(saved)}</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>annual revenue protected</p>
        <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
          ~{Math.round(highRisk * pct / 100)} members retained
          {" · "}{formatCurrency(revenueAtRisk)} total at risk
        </p>
      </div>
    </div>
  );
}

// ── Tier breakdown ─────────────────────────────────────────────────────────────

function TierBreakdown({ members }: { members: ChurnMember[] }) {
  const atRisk = members.filter(m => m.riskLevel !== "low");
  const tiers = ["unlimited", "12-class monthly", "8-class monthly", "4-class monthly"] as const;
  return (
    <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>At-Risk by Membership Tier</p>
      <div className="flex flex-col gap-3">
        {tiers.map(tier => {
          const total = members.filter(m => m.membershipTier === tier).length;
          const risk  = atRisk.filter(m => m.membershipTier === tier).length;
          const pct   = total > 0 ? Math.round((risk / total) * 100) : 0;
          const annualValue = members.filter(m => m.membershipTier === tier && m.riskLevel !== "low")
            .reduce((s, m) => s + m.monthlyValue * 12, 0);
          return (
            <div key={tier}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold capitalize" style={{ color: "#374151" }}>{tier}</span>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{risk}/{total} at risk · {formatCurrency(annualValue)} at stake</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#EEF3FB" }}>
                <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: tier === "unlimited" ? "#4A638D" : tier === "12-class monthly" ? "#6B8FC4" : tier === "8-class monthly" ? "#C9A84C" : "#9CA3AF" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

interface Props { data: ChurnPredictions }

export function RetentionPageContent({ data }: Props) {
  const [filter, setFilter] = useState<RiskLevel | "all">("all");

  const { summary, members, modelAUC } = data;

  const filtered = members
    .filter(m => filter === "all" || m.riskLevel === filter)
    .sort((a, b) => b.churnProbability - a.churnProbability);

  const filters: { key: RiskLevel | "all"; label: string }[] = [
    { key: "all",    label: "All"    },
    { key: "high",   label: "High"   },
    { key: "medium", label: "Medium" },
    { key: "low",    label: "Low"    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Members Analyzed"   value={String(summary.totalAnalyzed)} />
        <StatCard label="High Risk"          value={String(summary.highRisk)}    sub="immediate action needed" color="#DC2626" />
        <StatCard label="Medium Risk"        value={String(summary.mediumRisk)}  sub="monitor closely"         color="#D97706" />
        <StatCard label="Revenue at Risk"    value={formatCurrency(summary.revenueAtRisk)} sub="annual exposure" color="#C9A84C" />
      </div>

      {/* Risk bar + Tier breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <RiskBar high={summary.highRisk} medium={summary.mediumRisk} low={summary.lowRisk} total={summary.totalAnalyzed} />
        <TierBreakdown members={members} />
      </div>

      {/* Member table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
            Member Risk Table
          </p>
          <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F0F5FB" }}>
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize cursor-pointer"
                style={filter === key
                  ? { background: "#fff", color: "#4A638D", boxShadow: "0 1px 3px rgba(74,99,141,0.15)" }
                  : { color: "#9CA3AF" }
                }
              >
                {label}
                {key !== "all" && (
                  <span className="ml-1.5 text-[10px]">
                    ({key === "high" ? summary.highRisk : key === "medium" ? summary.mediumRisk : summary.lowRisk})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid #EEF3FB", background: "#F8FAFD" }}>
              {["#","Member","Risk","Last Visit","Visits 30d","Annual Value",""].map((h) => (
                <th key={h} className={cn("px-4 py-3 text-xs font-medium", h === "#" ? "text-center" : "text-left")} style={{ color: "#9CA3AF" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-xs" style={{ color: "#9CA3AF" }}>No members at this risk level.</td></tr>
            ) : (
              filtered.map((m, i) => <MemberRow key={m.id} member={m} rank={i + 1} />)
            )}
          </tbody>
        </table>
      </div>

      {/* ROI calculator */}
      <RoiCalculator highRisk={summary.highRisk} revenueAtRisk={summary.revenueAtRisk} />

      {/* Model confidence */}
      <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
        Powered by JetSet Retention AI · Model AUC {modelAUC} · Predictions regenerate weekly
      </p>
    </div>
  );
}
