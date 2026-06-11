"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { ChurnSummary, ChurnMember } from "@/types/churn";

// ── Risk bar row ───────────────────────────────────────────────────────────────

function RiskRow({
  label, count, total, color, bg, desc,
}: {
  label: string; count: number; total: number; color: string; bg: string; desc: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="relative group flex items-center gap-3">
      <p className="text-xs w-16 flex-shrink-0" style={{ color }}>{label}</p>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F0F5FB" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="text-xs font-semibold w-6 text-right flex-shrink-0" style={{ color: "#1F2937" }}>{count}</p>
      <p className="text-xs w-8 flex-shrink-0" style={{ color: "#9CA3AF" }}>{Math.round(pct)}%</p>
      <div
        className="absolute bottom-full left-16 mb-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"
        style={{ background: "#F0F5FB", color: "#4A638D", border: "1px solid #C8D8EE", boxShadow: "0 2px 8px rgba(74,99,141,0.15)" }}
      >
        <span className="font-semibold" style={{ color }}>{count}</span> Members · {desc}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  studioId: string;
  summary: ChurnSummary;
  members: ChurnMember[];
}

export function RetentionPreview({ studioId, summary }: Props) {
  const { totalAnalyzed, highRisk, mediumRisk, lowRisk, revenueAtRisk } = summary;
  const atRisk      = highRisk + mediumRisk;
  const atRiskPct   = totalAnalyzed > 0 ? Math.round((atRisk / totalAnalyzed) * 100) : 0;
  const urgentColor = highRisk > 3 ? "#DC2626" : highRisk > 0 ? "#D97706" : "#4A638D";

  return (
      <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <Link
              href={`/studios/${studioId}/retention`}
              className="text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-70"
              style={{ color: "#4A638D" }}
            >
              Retention AI →
            </Link>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              {totalAnalyzed} members analyzed
            </p>
          </div>
          {highRisk > 0 && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white flex-shrink-0"
              style={{ background: urgentColor }}
            >
              {highRisk} high risk
            </span>
          )}
        </div>

        {/* Risk distribution bars */}
        <div className="flex flex-col gap-2.5 mb-5">
          <RiskRow label="High"   count={highRisk}   total={totalAnalyzed} color="#DC2626" bg="#FEF2F2" desc="Immediate Action Needed" />
          <RiskRow label="Medium" count={mediumRisk}  total={totalAnalyzed} color="#D97706" bg="#FEF3C7" desc="Monitor Closely" />
          <RiskRow label="Low"    count={lowRisk}     total={totalAnalyzed} color="#4A638D" bg="#EEF3FB" desc="Stable Retention" />
        </div>

        {/* Revenue + at-risk stat */}
        <div
          className="rounded-xl p-4"
          style={{ background: highRisk > 3 ? "#FEF2F2" : "#FEF3C7", border: `1px solid ${urgentColor}20` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs mb-0.5" style={{ color: urgentColor, opacity: 0.7 }}>Annual revenue at risk</p>
              <p className="text-2xl font-bold" style={{ color: urgentColor }}>{formatCurrency(revenueAtRisk)}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold" style={{ color: urgentColor }}>{atRiskPct}%</p>
              <p className="text-xs" style={{ color: urgentColor, opacity: 0.7 }}>of members at risk</p>
            </div>
          </div>
        </div>

      </div>
  );
}
