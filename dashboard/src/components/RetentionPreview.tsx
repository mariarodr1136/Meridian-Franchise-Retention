import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { ChurnSummary } from "@/types/churn";

interface Props {
  studioId: string;
  summary: ChurnSummary;
}

export function RetentionPreview({ studioId, summary }: Props) {
  const { totalAnalyzed, highRisk, mediumRisk, lowRisk, revenueAtRisk } = summary;
  const atRisk = highRisk + mediumRisk;
  const atRiskPct = totalAnalyzed > 0 ? Math.round((atRisk / totalAnalyzed) * 100) : 0;

  const riskColor = highRisk > 3 ? "#DC2626" : highRisk > 0 ? "#D97706" : "#4A638D";

  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/studios/${studioId}/retention`}
          className="text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-70 cursor-pointer"
          style={{ color: "#4A638D" }}
        >
          Retention AI →
        </Link>
        {highRisk > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: riskColor }}>
            {highRisk} high risk
          </span>
        )}
      </div>

      {/* Risk distribution bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden mb-3 gap-px">
        <div style={{ width: `${(highRisk / totalAnalyzed) * 100}%`, background: "#DC2626" }} />
        <div style={{ width: `${(mediumRisk / totalAnalyzed) * 100}%`, background: "#D97706" }} />
        <div style={{ width: `${(lowRisk / totalAnalyzed) * 100}%`, background: "#4A638D22" }} />
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "High Risk",   count: highRisk,   color: "#DC2626", bg: "#FEF2F2" },
          { label: "Medium Risk", count: mediumRisk, color: "#D97706", bg: "#FEF3C7" },
          { label: "Low Risk",    count: lowRisk,    color: "#4A638D", bg: "#EEF3FB" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="rounded-lg p-3 text-center" style={{ background: bg }}>
            <p className="text-xl font-bold" style={{ color }}>{count}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue at risk */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #EEF3FB" }}>
        <div>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Annual revenue at risk</p>
          <p className="text-base font-bold mt-0.5" style={{ color: "#1F2937" }}>{formatCurrency(revenueAtRisk)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "#9CA3AF" }}>{atRiskPct}% of members</p>
          <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>flagged at risk</p>
        </div>
      </div>
    </div>
  );
}
