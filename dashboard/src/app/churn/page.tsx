"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { RiskBadge } from "@/components/RiskBadge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { ChurnPredictions, ChurnMember, StudioRiskProfile, RiskLevel } from "@/types/churn";

const NAVY         = "#4A638D";
const GOLD         = "#C9A84C";
const RED          = "#DC2626";
const AMBER        = "#D97706";
const GREEN        = "#10B981";
const BORDER       = "#C8D8EE";
const BORDER_INNER = "#EEF3FB";
const BG           = "#F0F5FB";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildStudioProfiles(members: ChurnMember[]): StudioRiskProfile[] {
  const map = new Map<string, StudioRiskProfile>();
  for (const m of members) {
    const key = `${m.studioName}__${m.studioCity}`;
    if (!map.has(key)) {
      map.set(key, {
        studioName: m.studioName, studioCity: m.studioCity,
        studioStatus: m.studioStatus,
        totalMembers: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0,
        revenueAtRisk: 0, topMember: null,
      });
    }
    const p = map.get(key)!;
    p.totalMembers++;
    if (m.riskLevel === "high") {
      p.highRisk++;
      p.revenueAtRisk += m.monthlyValue * 12 * m.churnProbability;
      if (!p.topMember || m.churnProbability > p.topMember.churnProbability) p.topMember = m;
    } else if (m.riskLevel === "medium") {
      p.mediumRisk++;
      p.revenueAtRisk += m.monthlyValue * 12 * m.churnProbability * 0.5;
    } else {
      p.lowRisk++;
    }
  }
  return [...map.values()].sort((a, b) => b.highRisk - a.highRisk || b.mediumRisk - a.mediumRisk);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accentColor }: {
  label: string; value: string; sub?: string; accentColor?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = accentColor ?? NAVY;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-xl border overflow-hidden"
      style={{
        background: "#fff",
        borderColor: hovered ? "rgba(123,151,190,0.6)" : BORDER,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 14px rgba(74,99,141,0.13)" : "none",
        transition: "border-color 0.18s, box-shadow 0.18s, transform 0.18s",
      }}
    >
      <div style={{ height: 3, background: accent }} />
      <div className="px-5 py-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>{label}</p>
        <p className="text-3xl font-bold" style={{ color: accent === GOLD ? GOLD : "#1F2937" }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{sub}</p>}
      </div>
    </div>
  );
}

function LocationCard({ profile, selected, onClick }: {
  profile: StudioRiskProfile; selected: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const riskPct = Math.round(((profile.highRisk + profile.mediumRisk) / profile.totalMembers) * 100);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full text-left rounded-xl border px-3 py-3 transition-all"
      style={{
        background: selected ? BORDER_INNER : "#fff",
        borderColor: selected ? NAVY : hovered ? "rgba(123,151,190,0.6)" : BORDER,
        transform: !selected && hovered ? "translateY(-1px)" : "translateY(0)",
        boxShadow: !selected && hovered ? "0 3px 10px rgba(74,99,141,0.12)" : selected ? "0 0 0 1px rgba(74,99,141,0.15)" : "none",
        transition: "all 0.18s",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: profile.highRisk > 2 ? RED : profile.highRisk > 0 ? AMBER : GREEN }} />
          <p className="text-xs font-semibold truncate" style={{ color: "#1F2937" }}>{profile.studioName}</p>
        </div>
        {profile.highRisk > 0 && (
          <span className="text-[10px] font-bold flex-shrink-0 ml-1" style={{ color: RED }}>{profile.highRisk} high</span>
        )}
      </div>
      <p className="text-[10px] mb-2 ml-3.5" style={{ color: "#9CA3AF" }}>{profile.studioCity}</p>
      <div className="w-full rounded-full ml-3.5" style={{ height: 4, background: BORDER_INNER, width: "calc(100% - 14px)" }}>
        <div className="h-full rounded-full" style={{
          width: `${riskPct}%`,
          background: profile.highRisk > 2 ? RED : profile.highRisk > 0 ? AMBER : GOLD,
        }} />
      </div>
      <p className="text-[10px] mt-1 ml-3.5" style={{ color: "#9CA3AF" }}>{riskPct}% at risk · {profile.totalMembers} members</p>
    </button>
  );
}

function MemberRow({ member, rank }: { member: ChurnMember; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const borderColor = member.riskLevel === "high" ? RED : member.riskLevel === "medium" ? AMBER : "transparent";

  return (
    <>
      <tr
        className="border-b cursor-pointer"
        style={{
          borderColor: BORDER_INNER,
          background: expanded ? BG : hovered ? "#FAFCFF" : "#fff",
          transition: "background 0.15s",
        }}
        onClick={() => setExpanded(e => !e)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <td className="py-3 pl-4 pr-2 text-xs text-center" style={{ color: "#9CA3AF" }}>{rank}</td>
        <td className="py-3 pr-4">
          <div style={{ borderLeft: `3px solid ${borderColor}`, paddingLeft: 8 }}>
            <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{member.name}</p>
            <p className="text-[11px] mt-0.5 capitalize" style={{ color: "#9CA3AF" }}>{member.membershipTier}</p>
          </div>
        </td>
        <td className="py-3 pr-4">
          <RiskBadge level={member.riskLevel as RiskLevel} score={member.riskScore} size="sm" />
        </td>
        <td className="py-3 pr-4 text-sm" style={{ color: "#374151" }}>{member.daysSinceLastVisit}d ago</td>
        <td className="py-3 pr-4 text-sm" style={{ color: "#374151" }}>
          {member.visitsLast30d}
          <span className="text-xs ml-1" style={{ color: member.visitsLast30d < member.visitsPrev30d ? AMBER : GREEN }}>
            {member.visitsLast30d < member.visitsPrev30d
              ? `↓${member.visitsPrev30d - member.visitsLast30d}`
              : member.visitsLast30d > member.visitsPrev30d
              ? `↑${member.visitsLast30d - member.visitsPrev30d}`
              : "—"}
          </span>
        </td>
        <td className="py-3 text-sm" style={{ color: "#374151" }}>{formatCurrency(member.monthlyValue * 12)}/yr</td>
        <td className="py-3 px-3">
          <svg width="10" height="10" viewBox="0 0 10 6" fill="none" aria-hidden
            style={{ color: "#9CA3AF", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </td>
      </tr>
      <tr>
        <td colSpan={7} style={{ padding: 0, borderBottom: expanded ? `1px solid ${BORDER_INNER}` : "none" }}>
          <div style={{ overflow: "hidden", maxHeight: expanded ? 400 : 0, transition: "max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1)", background: BG }}>
            <div className="px-5 py-4 grid grid-cols-4 gap-3 border-b mb-4" style={{ borderColor: BORDER_INNER }}>
              <div className="rounded-lg p-3" style={{ background: "#fff", border: `1px solid ${BORDER_INNER}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Churn Risk</p>
                <p className="text-lg font-bold" style={{ color: member.riskLevel === "high" ? RED : AMBER }}>{Math.round(member.churnProbability * 100)}%</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "#fff", border: `1px solid ${BORDER_INNER}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Annual Value</p>
                <p className="text-lg font-bold" style={{ color: NAVY }}>{formatCurrency(member.monthlyValue * 12)}</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "#fff", border: `1px solid ${BORDER_INNER}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>Member Since</p>
                <p className="text-lg font-bold" style={{ color: NAVY }}>{member.membershipAgeDays}d</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "#fff", border: `1px solid ${BORDER_INNER}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#9CA3AF" }}>No-Show Rate</p>
                <p className="text-lg font-bold" style={{ color: NAVY }}>{formatPercent(member.noShowRate)}</p>
              </div>
            </div>
            <div className="px-5 pb-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: NAVY }}>Risk Factors</p>
                <ul className="space-y-1.5">
                  {member.topFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#6B7280" }}>
                      <span style={{ color: RED, marginTop: 1, flexShrink: 0 }}>!</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: NAVY }}>Suggested Action</p>
                <div className="rounded-lg p-3" style={{ background: "#EEF6FF", border: "1px solid #BFDBFE" }}>
                  <p className="text-xs leading-relaxed" style={{ color: "#1E40AF" }}>{member.suggestedAction}</p>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

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
        <div className="p-6" style={{ background: "#fff" }}>
          <div className="flex justify-between text-xs mb-3" style={{ color: "#6B7280" }}>
            <span>% of high-risk members retained</span>
            <span className="font-bold text-sm" style={{ color: GOLD }}>{pct}%</span>
          </div>

          {/* Custom slider */}
          <div className="relative w-full mb-2" style={{ height: 24 }}>
            <style>{`
              .churn-roi-slider{-webkit-appearance:none;appearance:none;width:100%;height:24px;background:transparent;cursor:pointer;position:absolute;inset:0;margin:0;}
              .churn-roi-slider:focus{outline:none;}
              .churn-roi-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${GOLD};margin-top:-6px;box-shadow:0 1px 5px rgba(0,0,0,0.18);border:2px solid #fff;}
              .churn-roi-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:${GOLD};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.18);}
            `}</style>
            <div className="absolute left-0 right-0 rounded-full pointer-events-none" style={{ top: "50%", transform: "translateY(-50%)", height: 6, background: BORDER }}>
              <div className="h-full rounded-full" style={{ width: `${((pct - 5) / 75) * 100}%`, background: GOLD }} />
            </div>
            <input
              type="range" min={5} max={80} value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="churn-roi-slider"
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

        <div className="p-6 flex flex-col items-center justify-center text-center" style={{ background: NAVY }}>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChurnPage() {
  const [data, setData]               = useState<ChurnPredictions | null>(null);
  const [selectedStudio, setSelected] = useState<string | null>(null);
  const [filterLevel, setFilter]      = useState<RiskLevel | "all">("all");

  useEffect(() => {
    fetch("/api/churn")
      .then((r) => r.json())
      .then((d: ChurnPredictions) => {
        setData(d);
        const profiles = buildStudioProfiles(d.members);
        if (profiles[0]) setSelected(`${profiles[0].studioName}__${profiles[0].studioCity}`);
      });
  }, []);

  const studioProfiles = useMemo(() => (data ? buildStudioProfiles(data.members) : []), [data]);

  const selectedMembers = useMemo(() => {
    if (!data || !selectedStudio) return [];
    const [name, city] = selectedStudio.split("__");
    return data.members
      .filter((m) => m.studioName === name && m.studioCity === city)
      .filter((m) => filterLevel === "all" || m.riskLevel === filterLevel)
      .sort((a, b) => b.churnProbability - a.churnProbability);
  }, [data, selectedStudio, filterLevel]);

  const selectedProfile = studioProfiles.find(
    (p) => `${p.studioName}__${p.studioCity}` === selectedStudio
  );

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: GOLD, borderTopColor: "transparent" }} />
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Loading predictions…</p>
        </div>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full" style={{ background: NAVY }}>
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={130} height={68} priority className="object-contain transition-opacity hover:opacity-80" />
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-white">Retention AI · All Locations</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
            <Link href="/" className="text-sm font-medium text-white transition-opacity hover:opacity-70">← Network</Link>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              AUC <span className="font-semibold text-white">{data.modelAUC}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Banner */}
        <div className="mb-8 rounded-xl overflow-hidden relative" style={{ height: 160 }}>
          <Image src="/jetset-banner.webp" alt="" width={1400} height={160} priority
            className="w-full h-full object-cover" style={{ objectPosition: "center 78%" }} />
          <div className="absolute inset-0" style={{ background: "rgba(15,28,52,0.38)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <h1 style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", lineHeight: 1.1, marginBottom: 4, textTransform: "uppercase" }}>Retention AI</h1>
            <p style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 14, color: "#fff", fontWeight: 500 }}>Network-wide · {studioProfiles.length} locations</p>
          </div>
        </div>

        {/* Stat bubbles */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Members Analyzed"  value={formatNumber(summary.totalAnalyzed)} />
          <StatCard label="High Risk"         value={String(summary.highRisk)}    sub="immediate action needed" accentColor={RED}   />
          <StatCard label="Medium Risk"        value={String(summary.mediumRisk)}  sub="monitor closely"         accentColor={AMBER} />
          <StatCard label="Revenue at Risk"    value={formatCurrency(summary.revenueAtRisk)} sub="annual exposure" accentColor={GOLD} />
        </div>

        {/* Main layout: location sidebar + content */}
        <div className="flex gap-6">

          {/* Location sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-24 rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}`, background: "#fff", boxShadow: "0 1px 4px rgba(74,99,141,0.07)" }}>
              <div className="px-4 py-3.5 border-b" style={{ borderColor: BORDER_INNER }}>
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>Locations</p>
                <p className="text-[11px] mt-0.5" style={{ color: NAVY }}>{studioProfiles.length} studios · sorted by risk</p>
              </div>
              <div className="px-3 py-3 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
                {studioProfiles.map((p) => {
                  const key = `${p.studioName}__${p.studioCity}`;
                  return (
                    <LocationCard
                      key={key}
                      profile={p}
                      selected={selectedStudio === key}
                      onClick={() => { setSelected(key); setFilter("all"); }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {selectedProfile && (
              <>
                {/* Studio header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "#1F2937" }}>
                      {selectedProfile.studioName}
                      <span className="text-sm font-normal ml-2" style={{ color: "#9CA3AF" }}>· {selectedProfile.studioCity}</span>
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                      {selectedProfile.totalMembers} members ·{" "}
                      <span style={{ color: RED }}>{selectedProfile.highRisk} high risk</span>
                      {" · "}
                      <span style={{ color: AMBER }}>{selectedProfile.mediumRisk} medium risk</span>
                      {" · "}
                      {formatCurrency(selectedProfile.revenueAtRisk)} at risk
                    </p>
                  </div>

                  {/* Filter pills */}
                  <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: BORDER_INNER }}>
                    {(["all", "high", "medium", "low"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setFilter(level)}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize cursor-pointer"
                        style={filterLevel === level
                          ? { background: "#fff", color: NAVY, boxShadow: "0 1px 3px rgba(74,99,141,0.15)" }
                          : { color: "#9CA3AF" }
                        }
                        onMouseEnter={(e) => { if (filterLevel !== level) { (e.currentTarget as HTMLButtonElement).style.background = NAVY; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; } }}
                        onMouseLeave={(e) => { if (filterLevel !== level) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; } }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Member table */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: BORDER }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: BG, borderBottom: `1px solid ${BORDER_INNER}` }}>
                        {["#", "Member", "Risk", "Last Visit", "Visits (30d)", "Annual Value", ""].map((h) => (
                          <th key={h} className={`px-4 py-3 text-[10px] font-semibold tracking-wide uppercase ${h === "#" ? "text-center" : "text-left"}`}
                            style={{ color: NAVY }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMembers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-xs" style={{ color: "#9CA3AF" }}>
                            No members at this risk level.
                          </td>
                        </tr>
                      ) : (
                        selectedMembers.map((m, i) => <MemberRow key={m.id} member={m} rank={i + 1} />)
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ROI Calculator */}
                <RoiCalculator highRisk={selectedProfile.highRisk} revenueAtRisk={selectedProfile.revenueAtRisk} />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-8 pb-2">
          <span className="w-1 h-1 rounded-full" style={{ background: GOLD }} />
          <p className="text-[11px]" style={{ color: "#9CA3AF" }}>
            JetSet Retention AI · Model AUC {data.modelAUC} · Predictions regenerate weekly
          </p>
          <span className="w-1 h-1 rounded-full" style={{ background: GOLD }} />
        </div>
      </div>
    </div>
  );
}
