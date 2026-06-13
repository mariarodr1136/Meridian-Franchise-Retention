"use client";

import { useState } from "react";
import { RiskBadge } from "@/components/RiskBadge";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ChurnPredictions, ChurnMember, RiskLevel } from "@/types/churn";

// ── Design tokens ───────────────────────────────────────────────────────────────
const NAVY  = "#4A638D";
const GOLD  = "#C9A84C";
const RED   = "#DC2626";
const AMBER = "#D97706";
const BORDER = "#C8D8EE";
const BORDER_INNER = "#EEF3FB";
const BG    = "#F0F5FB";

// ── Stat cards ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accentColor }: {
  label: string; value: string; sub?: string; accentColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = accentColor ?? NAVY;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-xl border relative overflow-hidden"
      style={{
        background: "#fff",
        borderColor: hovered ? "#7B97BE" : BORDER,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 6px 18px rgba(74,99,141,0.13)" : "none",
        transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
        padding: "20px 20px 18px",
      }}
    >
      {/* Colored accent line at top */}
      <div className="absolute top-0 left-0 right-0" style={{ height: 3, background: accent, borderRadius: "12px 12px 0 0" }} />
      <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>{label}</p>
      <p className="text-3xl font-bold leading-none" style={{ color: accent === NAVY ? "#1F2937" : accent }}>{value}</p>
      {sub && <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

// ── Risk distribution ────────────────────────────────────────────────────────────

function RiskBar({ high, medium, low, total }: { high: number; medium: number; low: number; total: number }) {
  const tiers = [
    { label: "High Risk",   count: high,   pct: Math.round((high   / total) * 100), color: RED,   bg: "#FEF2F2", border: "#FECACA" },
    { label: "Medium Risk", count: medium, pct: Math.round((medium / total) * 100), color: AMBER, bg: "#FFFBEB", border: "#FDE68A" },
    { label: "Low Risk",    count: low,    pct: Math.round((low    / total) * 100), color: NAVY,  bg: "#EEF3FB", border: BORDER },
  ];
  return (
    <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: BORDER }}>
      <p className="text-[10px] font-semibold tracking-widest uppercase mb-4" style={{ color: NAVY }}>
        Member Risk Distribution
      </p>

      {/* Stacked bar */}
      <div className="flex h-5 rounded-full overflow-hidden mb-5" style={{ gap: 2 }}>
        <div style={{ width: `${(high   / total) * 100}%`, background: RED,   borderRadius: 99 }} title="High Risk" />
        <div style={{ width: `${(medium / total) * 100}%`, background: AMBER, borderRadius: 99 }} title="Medium Risk" />
        <div style={{ width: `${(low    / total) * 100}%`, background: "#C8D8EE", borderRadius: 99 }} title="Low Risk" />
      </div>

      {/* Breakdown tiles */}
      <div className="grid grid-cols-3 gap-3">
        {tiers.map(({ label, count, pct, color, bg, border }) => (
          <div key={label} className="rounded-xl p-3.5" style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="text-2xl font-bold leading-none mb-1" style={{ color }}>{count}</p>
            <p className="text-[11px] font-semibold" style={{ color }}>{label}</p>
            <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{pct}% of members</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tier breakdown ───────────────────────────────────────────────────────────────

const TIER_META: Record<string, { label: string; color: string }> = {
  "unlimited":        { label: "Unlimited",        color: NAVY  },
  "12-class monthly": { label: "12-Class Monthly",  color: "#6B8FC4" },
  "8-class monthly":  { label: "8-Class Monthly",   color: GOLD  },
  "4-class monthly":  { label: "4-Class Monthly",   color: "#9CA3AF" },
};

function TierBreakdown({ members }: { members: ChurnMember[] }) {
  const atRisk = members.filter(m => m.riskLevel !== "low");
  const tiers = ["unlimited", "12-class monthly", "8-class monthly", "4-class monthly"] as const;

  return (
    <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: BORDER }}>
      <p className="text-[10px] font-semibold tracking-widest uppercase mb-4" style={{ color: NAVY }}>
        At-Risk by Membership Tier
      </p>
      <div className="flex flex-col gap-4">
        {tiers.map(tier => {
          const total = members.filter(m => m.membershipTier === tier).length;
          const risk  = atRisk.filter(m => m.membershipTier === tier).length;
          const pct   = total > 0 ? Math.round((risk / total) * 100) : 0;
          const annualValue = members
            .filter(m => m.membershipTier === tier && m.riskLevel !== "low")
            .reduce((s, m) => s + m.monthlyValue * 12, 0);
          const meta = TIER_META[tier];
          return (
            <div key={tier}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold" style={{ color: "#374151" }}>{meta.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold" style={{ color: meta.color }}>{pct}%</span>
                  <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
                    {risk}/{total} · {formatCurrency(annualValue)}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: BORDER_INNER }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: meta.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Member row ───────────────────────────────────────────────────────────────────

function MemberRow({ member, rank }: { member: ChurnMember; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isHigh   = member.riskLevel === "high";
  const isMedium = member.riskLevel === "medium";
  const churnPct = Math.round(member.churnProbability * 100);

  return (
    <>
      <tr
        className="border-b cursor-pointer"
        style={{
          borderColor: BORDER_INNER,
          borderLeft: isHigh
            ? `3px solid ${RED}`
            : isMedium
            ? `3px solid ${AMBER}`
            : `3px solid transparent`,
          background: expanded ? "#F4F8FE" : hovered ? "#F8FAFD" : "transparent",
          transition: "background 0.15s ease",
        }}
        onClick={() => setExpanded(e => !e)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <td className="py-3 px-4 text-xs text-center" style={{ color: "#9CA3AF" }}>{rank}</td>
        <td className="py-3 pr-4">
          <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{member.name}</p>
          <p className="text-xs mt-0.5 capitalize" style={{ color: "#9CA3AF" }}>{member.membershipTier}</p>
        </td>
        <td className="py-3 pr-4">
          <RiskBadge level={member.riskLevel as RiskLevel} score={member.riskScore} size="sm" />
        </td>
        <td className="py-3 pr-4 text-sm" style={{ color: "#374151" }}>{member.daysSinceLastVisit}d ago</td>
        <td className="py-3 pr-4 text-sm">
          <span style={{ color: "#374151" }}>{member.visitsLast30d}</span>
          <span className="text-xs ml-1.5" style={{
            color: member.visitsLast30d < member.visitsPrev30d ? "#ea580c" : "#16a34a",
          }}>
            {member.visitsLast30d < member.visitsPrev30d
              ? `↓ ${member.visitsPrev30d - member.visitsLast30d}`
              : member.visitsLast30d > member.visitsPrev30d
              ? `↑ ${member.visitsLast30d - member.visitsPrev30d}`
              : "—"}
          </span>
        </td>
        <td className="py-3 text-sm font-medium" style={{ color: "#374151" }}>
          {formatCurrency(member.monthlyValue * 12)}
          <span className="text-xs font-normal ml-0.5" style={{ color: "#9CA3AF" }}>/yr</span>
        </td>
        <td className="py-3 px-4">
          <svg width="10" height="10" viewBox="0 0 10 6" fill="none" aria-hidden
            style={{
              color: "#9CA3AF",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </td>
      </tr>

      {/* Smooth expand */}
      <tr>
        <td colSpan={7} style={{ padding: 0, borderBottom: expanded ? `1px solid ${BORDER_INNER}` : "none" }}>
          <div style={{
            overflow: "hidden",
            maxHeight: expanded ? 440 : 0,
            transition: "max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            {/* Stats banner */}
            <div className="flex items-stretch border-b" style={{ background: "#F4F8FE", borderColor: BORDER_INNER }}>
              <div className="px-6 py-3 border-r flex flex-col justify-center" style={{ borderColor: BORDER_INNER }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Churn Risk</p>
                <p className="text-2xl font-bold leading-none" style={{ color: churnPct >= 70 ? RED : churnPct >= 40 ? AMBER : NAVY }}>
                  {churnPct}%
                </p>
              </div>
              <div className="px-6 py-3 border-r flex flex-col justify-center" style={{ borderColor: BORDER_INNER }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Annual Value</p>
                <p className="text-lg font-bold leading-none" style={{ color: "#1F2937" }}>
                  {formatCurrency(member.monthlyValue * 12)}
                </p>
              </div>
              <div className="px-6 py-3 border-r flex flex-col justify-center" style={{ borderColor: BORDER_INNER }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Member Since</p>
                <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{member.membershipAgeDays}d</p>
              </div>
              <div className="px-6 py-3 flex flex-col justify-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>No-Show Rate</p>
                <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{formatPercent(member.noShowRate)}</p>
              </div>
            </div>

            {/* Detail columns */}
            <div className="px-6 py-4 grid grid-cols-3 gap-6" style={{ background: "#F8FAFD" }}>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: NAVY }}>
                  Risk Factors
                </p>
                <ul className="space-y-2">
                  {member.topFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                      <span className="flex-shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: RED }}>!</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature importances from weighted scoring model */}
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: NAVY }}>
                  Model Feature Weights
                </p>
                <div className="flex flex-col gap-2">
                  {member.featureImportances.map((fi) => (
                    <div key={fi.label}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px]" style={{ color: "#6B7280" }}>{fi.label}</span>
                        <span className="text-[10px] font-semibold tabular-nums" style={{ color: churnPct >= 70 ? RED : churnPct >= 40 ? AMBER : NAVY }}>
                          {Math.round(fi.contribution * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E4EDF8" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round(fi.contribution * 100)}%`,
                            background: churnPct >= 70 ? RED : churnPct >= 40 ? AMBER : NAVY,
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: NAVY }}>
                  Suggested Action
                </p>
                <div className="rounded-xl p-3.5 text-xs leading-relaxed" style={{ background: "#EEF3FB", border: `1px solid ${BORDER}` }}>
                  <p style={{ color: "#374151" }}>{member.suggestedAction}</p>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

// ── ROI Calculator ───────────────────────────────────────────────────────────────

function RoiCalculator({ highRisk, revenueAtRisk }: { highRisk: number; revenueAtRisk: number }) {
  const [pct, setPct] = useState(30);
  const saved    = Math.round(revenueAtRisk * (pct / 100));
  const retained = Math.round(highRisk * pct / 100);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
      <div className="px-6 py-4 border-b" style={{ background: "#fff", borderColor: BORDER_INNER }}>
        <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: NAVY }}>
          Retention ROI Calculator
        </p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          Estimate how much annual revenue you can protect by retaining at-risk members.
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x" style={{ borderColor: BORDER_INNER }}>
        {/* Slider side */}
        <div className="p-6" style={{ background: "#fff" }}>
          <div className="flex justify-between text-xs mb-3" style={{ color: "#6B7280" }}>
            <span>% of high-risk members retained</span>
            <span className="font-bold text-sm" style={{ color: GOLD }}>{pct}%</span>
          </div>
          {/* Custom slider track */}
          <div className="relative w-full mb-2" style={{ height: 24 }}>
            <style>{`
              .roi-slider{-webkit-appearance:none;appearance:none;width:100%;height:24px;background:transparent;cursor:pointer;position:absolute;inset:0;margin:0;}
              .roi-slider:focus{outline:none;}
              .roi-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${GOLD};margin-top:-6px;box-shadow:0 1px 5px rgba(0,0,0,0.18);border:2px solid #fff;}
              .roi-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:${GOLD};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.18);}
            `}</style>
            {/* Track */}
            <div className="absolute left-0 right-0 rounded-full pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)", height: 6, background: BORDER }}>
              <div className="h-full rounded-full" style={{ width: `${((pct - 5) / 75) * 100}%`, background: GOLD, transition: "width 0.05s" }} />
            </div>
            <input
              type="range" min={5} max={80} value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="roi-slider"
            />
          </div>
          <div className="flex justify-between text-[10px]" style={{ color: "#9CA3AF" }}>
            <span>5%</span><span>80%</span>
          </div>

          <div className="mt-5 pt-4 border-t flex gap-6" style={{ borderColor: BORDER_INNER }}>
            <div>
              <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Members Saved</p>
              <p className="text-xl font-bold" style={{ color: NAVY }}>{retained}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Total at Risk</p>
              <p className="text-xl font-bold" style={{ color: "#1F2937" }}>{formatCurrency(revenueAtRisk)}</p>
            </div>
          </div>
        </div>

        {/* Result side — dark navy */}
        <div className="p-6 flex flex-col items-center justify-center text-center"
          style={{ background: NAVY }}>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            Annual Revenue Protected
          </p>
          <p className="text-4xl font-bold leading-none mb-2" style={{ color: GOLD }}>
            {formatCurrency(saved)}
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            by retaining {retained} members at {pct}%
          </p>
        </div>
      </div>
    </div>
  );
}

// ── PDF export ───────────────────────────────────────────────────────────────────

function exportPDF(members: ChurnMember[], studioLabel: string) {
  const rows = members.map((m, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${m.name}</strong><br/><small style="color:#9CA3AF;text-transform:capitalize">${m.membershipTier}</small></td>
      <td class="${m.riskLevel}">${m.riskLevel.charAt(0).toUpperCase() + m.riskLevel.slice(1)}</td>
      <td class="${m.riskLevel}" style="font-weight:700">${Math.round(m.churnProbability * 100)}%</td>
      <td>${m.daysSinceLastVisit}d ago</td>
      <td>${m.visitsLast30d}</td>
      <td>$${(m.monthlyValue * 12).toLocaleString()}/yr</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html><head><title>Member Risk Report · ${studioLabel}</title>
  <style>
    body{font-family:-apple-system,sans-serif;margin:32px;color:#1F2937;font-size:13px}
    h1{font-size:20px;color:#4A638D;margin:0 0 2px}
    .sub{font-size:11px;color:#9CA3AF;margin:0 0 20px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:8px 12px;background:#F8FAFD;color:#9CA3AF;font-size:10px;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #EEF3FB}
    td{padding:9px 12px;border-bottom:1px solid #EEF3FB;vertical-align:top}
    .high{color:#DC2626}.medium{color:#D97706}.low{color:#4A638D}
    @media print{body{margin:16px}}
  </style></head><body>
  <h1>Member Risk Report</h1>
  <p class="sub">${studioLabel} · ${members.length} members · Generated ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>
  <table><thead><tr>
    <th>#</th><th>Member</th><th>Risk</th><th>Churn Prob.</th><th>Last Visit</th><th>Visits 30d</th><th>Annual Value</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <script>window.onload=()=>{window.print()}<\/script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

function PaginationBtn({ children, disabled, onClick, variant }: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  variant: "outline" | "solid";
}) {
  const [hovered, setHovered] = useState(false);

  const disabledStyle = { background: "#E5ECF7", color: "#C0CEDF", cursor: "not-allowed" };
  const outlineStyle  = hovered
    ? { background: NAVY, color: "#fff", border: `1px solid ${NAVY}`, boxShadow: "0 3px 10px rgba(74,99,141,0.25)", transform: "translateY(-1px)" }
    : { background: "#fff", color: NAVY, border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(74,99,141,0.1)" };
  const solidStyle    = hovered
    ? { background: "#3A5070", color: "#fff", boxShadow: "0 3px 10px rgba(74,99,141,0.3)", transform: "translateY(-1px)" }
    : { background: NAVY, color: "#fff", boxShadow: "0 1px 2px rgba(74,99,141,0.2)" };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
      style={{
        transition: "all 0.18s ease",
        cursor: disabled ? "not-allowed" : "pointer",
        ...(disabled ? disabledStyle : variant === "outline" ? outlineStyle : solidStyle),
      }}
    >
      {children}
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────────

const PER_PAGE = 15;

interface Props { data: ChurnPredictions; studioLabel?: string }

export function RetentionPageContent({ data, studioLabel = "Studio" }: Props) {
  const [filter, setFilter] = useState<RiskLevel | "all">("all");
  const [page, setPage] = useState(0);
  const { summary, members, modelAUC } = data;

  const filtered = members
    .filter(m => filter === "all" || m.riskLevel === filter)
    .sort((a, b) => b.churnProbability - a.churnProbability);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const start      = page * PER_PAGE + 1;
  const end        = Math.min((page + 1) * PER_PAGE, filtered.length);

  function changeFilter(key: RiskLevel | "all") {
    setFilter(key);
    setPage(0);
  }

  const filterOpts: { key: RiskLevel | "all"; label: string; dot?: string }[] = [
    { key: "all",    label: "All" },
    { key: "high",   label: "High",   dot: RED   },
    { key: "medium", label: "Medium", dot: AMBER },
    { key: "low",    label: "Low",    dot: NAVY  },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Members Analyzed"   value={String(summary.totalAnalyzed)} />
        <StatCard label="High Risk"          value={String(summary.highRisk)}   sub="immediate action needed" accentColor={RED}   />
        <StatCard label="Medium Risk"        value={String(summary.mediumRisk)} sub="monitor closely"         accentColor={AMBER} />
        <StatCard label="Revenue at Risk"    value={formatCurrency(summary.revenueAtRisk)} sub="annual exposure" accentColor={GOLD} />
      </div>

      {/* Risk distribution + tier breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <RiskBar high={summary.highRisk} medium={summary.mediumRisk} low={summary.lowRisk} total={summary.totalAnalyzed} />
        <TierBreakdown members={members} />
      </div>

      {/* Member risk table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: BORDER }}>
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: BORDER_INNER }}>
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: NAVY }}>Member Risk Table</p>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              {filtered.length} member{filtered.length !== 1 ? "s" : ""} · sorted by churn probability
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Export PDF */}
            <button
              onClick={() => exportPDF(filtered, studioLabel)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
              style={{ background: NAVY, color: "#fff" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export PDF
            </button>

            {/* Filter pills */}
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: BG }}>
              {filterOpts.map(({ key, label, dot }) => (
                <button
                  key={key}
                  onClick={() => changeFilter(key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer hover:bg-[#4A638D] hover:text-white"
                  style={filter === key
                    ? { background: "#fff", color: NAVY, boxShadow: "0 1px 3px rgba(74,99,141,0.15)" }
                    : { color: "#9CA3AF" }
                  }
                >
                  {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot, opacity: filter === key ? 1 : 0.4 }} />}
                  {label}
                  {key !== "all" && (
                    <span className="text-[10px] opacity-70">
                      ({key === "high" ? summary.highRisk : key === "medium" ? summary.mediumRisk : summary.lowRisk})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER_INNER}`, background: "#F8FAFD" }}>
              {["#", "Member", "Risk", "Last Visit", "Visits 30d", "Annual Value", ""].map((h) => (
                <th key={h}
                  className={cn("px-4 py-3 text-[10px] font-semibold tracking-wide uppercase", h === "#" ? "text-center" : "text-left")}
                  style={{ color: "#9CA3AF" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-xs" style={{ color: "#9CA3AF" }}>
                  No members at this risk level.
                </td>
              </tr>
            ) : (
              paginated.map((m, i) => <MemberRow key={m.id} member={m} rank={start + i} />)
            )}
          </tbody>
        </table>

        {/* Pagination footer */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: BORDER_INNER, background: BG }}>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>
              Showing {start}–{end} of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <PaginationBtn
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                variant="outline"
              >← Prev</PaginationBtn>
              <span className="text-xs font-semibold" style={{ color: NAVY }}>
                {page + 1} / {totalPages}
              </span>
              <PaginationBtn
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                variant="solid"
              >Next →</PaginationBtn>
            </div>
          </div>
        )}
      </div>

      {/* ROI Calculator */}
      <RoiCalculator highRisk={summary.highRisk} revenueAtRisk={summary.revenueAtRisk} />

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 pb-2">
        <span className="w-1 h-1 rounded-full" style={{ background: GOLD }} />
        <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
          JetSet Retention AI · Model AUC {modelAUC} · Predictions regenerate weekly
        </p>
        <span className="w-1 h-1 rounded-full" style={{ background: GOLD }} />
      </div>
    </div>
  );
}
