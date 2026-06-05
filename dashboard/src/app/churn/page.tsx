"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { RiskBadge } from "@/components/RiskBadge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ChurnPredictions, ChurnMember, StudioRiskProfile, RiskLevel } from "@/types/churn";

// ── Derived data helpers ─────────────────────────────────────────────────────

function buildStudioProfiles(members: ChurnMember[]): StudioRiskProfile[] {
  const map = new Map<string, StudioRiskProfile>();

  for (const m of members) {
    const key = `${m.studioName}__${m.studioCity}`;
    if (!map.has(key)) {
      map.set(key, {
        studioName: m.studioName,
        studioCity: m.studioCity,
        studioStatus: m.studioStatus,
        totalMembers: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        revenueAtRisk: 0,
        topMember: null,
      });
    }
    const p = map.get(key)!;
    p.totalMembers++;
    if (m.riskLevel === "high") {
      p.highRisk++;
      const rev = m.monthlyValue * 12 * m.churnProbability;
      p.revenueAtRisk += rev;
      if (!p.topMember || m.churnProbability > p.topMember.churnProbability) {
        p.topMember = m;
      }
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

function StatCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className={cn("text-2xl font-bold", highlight ? "text-red-400" : "")}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>{sub}</p>}
    </div>
  );
}

function StudioRiskCard({ profile, selected, onClick }: {
  profile: StudioRiskProfile;
  selected: boolean;
  onClick: () => void;
}) {
  const riskPct = Math.round(((profile.highRisk + profile.mediumRisk) / profile.totalMembers) * 100);
  const statusColor: Record<string, string> = {
    healthy: "var(--green)", "at-risk": "var(--orange)", new: "var(--blue)",
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border p-4 transition-all"
      style={{
        background: selected ? "var(--surface-2)" : "var(--surface)",
        borderColor: selected ? "var(--gold)" : "var(--border)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: statusColor[profile.studioStatus] ?? "var(--text-dim)" }} />
            <p className="text-sm font-semibold">{profile.studioName}</p>
          </div>
          <p className="text-xs mt-0.5 ml-3.5" style={{ color: "var(--text-muted)" }}>{profile.studioCity}</p>
        </div>
        <span className="text-xs font-bold" style={{ color: profile.highRisk > 0 ? "var(--red)" : "var(--text-dim)" }}>
          {profile.highRisk > 0 ? `${profile.highRisk} high` : "—"}
        </span>
      </div>

      {/* Risk bar */}
      <div className="w-full h-1 rounded-full mb-2" style={{ background: "var(--border-2)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${riskPct}%`,
            background: profile.highRisk > 2 ? "var(--red)" : profile.highRisk > 0 ? "var(--orange)" : "var(--amber)",
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{riskPct}% at risk</span>
        <span>{profile.totalMembers} members</span>
      </div>
    </button>
  );
}

function MemberRow({ member, rank }: { member: ChurnMember; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="border-b cursor-pointer transition-colors"
        style={{ borderColor: "var(--border)" }}
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="py-3 px-4 text-xs text-center" style={{ color: "var(--text-dim)" }}>{rank}</td>
        <td className="py-3 pr-4">
          <p className="text-sm font-medium">{member.name}</p>
          <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>{member.membershipTier}</p>
        </td>
        <td className="py-3 pr-4">
          <RiskBadge level={member.riskLevel as RiskLevel} score={member.riskScore} size="sm" />
        </td>
        <td className="py-3 pr-4 text-sm">{member.daysSinceLastVisit}d ago</td>
        <td className="py-3 pr-4 text-sm">{member.visitsLast30d}
          <span className="text-xs ml-1" style={{
            color: member.visitsLast30d < member.visitsPrev30d ? "var(--orange)" : "var(--green)"
          }}>
            {member.visitsLast30d < member.visitsPrev30d
              ? `↓ ${member.visitsPrev30d - member.visitsLast30d}`
              : member.visitsLast30d > member.visitsPrev30d
              ? `↑ ${member.visitsLast30d - member.visitsPrev30d}`
              : "—"}
          </span>
        </td>
        <td className="py-3 text-sm">{formatCurrency(member.monthlyValue * 12)}/yr</td>
      </tr>
      {expanded && (
        <tr style={{ background: "var(--bg)" }}>
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Risk Factors</p>
                <ul className="space-y-1">
                  {member.topFactors.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span className="text-red-400 mt-0.5 flex-shrink-0">▸</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Suggested Action</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {member.suggestedAction}
                </p>
                <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
                  Member since {member.membershipAgeDays} days ago
                  {" · "}No-show rate {formatPercent(member.noShowRate)}
                </p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function RoiCalculator({ highRiskCount, revenueAtRisk }: {
  highRiskCount: number;
  revenueAtRisk: number;
}) {
  const [retentionPct, setRetentionPct] = useState(30);
  const saved = Math.round(revenueAtRisk * (retentionPct / 100));

  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "var(--text-dim)" }}>
        Retention ROI Calculator
      </p>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          <span>If you retain this % of high-risk members</span>
          <span className="font-bold" style={{ color: "var(--gold)" }}>{retentionPct}%</span>
        </div>
        <input
          type="range"
          min={5}
          max={80}
          value={retentionPct}
          onChange={(e) => setRetentionPct(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "var(--gold)", background: "var(--border)" }}
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-dim)" }}>
          <span>5%</span><span>80%</span>
        </div>
      </div>

      <div className="rounded-lg p-4 text-center" style={{ background: "var(--bg)" }}>
        <p className="text-3xl font-bold" style={{ color: "var(--gold)" }}>{formatCurrency(saved)}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>annual revenue protected</p>
        <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>
          ~{Math.round(highRiskCount * retentionPct / 100)} members retained
          {" · "}{formatCurrency(revenueAtRisk)} total at risk
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChurnPage() {
  const [data, setData] = useState<ChurnPredictions | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<RiskLevel | "all">("all");

  useEffect(() => {
    fetch("/api/churn")
      .then((r) => r.json())
      .then((d: ChurnPredictions) => {
        setData(d);
        // auto-select the highest-risk studio
        const profiles = buildStudioProfiles(d.members);
        if (profiles[0]) setSelectedStudio(`${profiles[0].studioName}__${profiles[0].studioCity}`);
      });
  }, []);

  const studioProfiles = useMemo(
    () => (data ? buildStudioProfiles(data.members) : []),
    [data]
  );

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Loading predictions…</p>
        </div>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Image
            src="/jetset-logo-transparent.png"
            alt="JetSet Modern Pilates"
            width={150}
            height={80}
            priority
            className="object-contain"
          />
          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-white">Member Retention Intelligence</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
            <Link href="/" className="text-sm font-medium transition-opacity hover:opacity-70 text-white">
              ← Network
            </Link>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              AUC <span className="font-semibold text-white">{data.modelAUC}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Summary stats */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Members Analyzed"  value={formatNumber(summary.totalAnalyzed)} />
          <StatCard label="High Risk"         value={String(summary.highRisk)}    sub="immediate action needed" highlight />
          <StatCard label="Medium Risk"        value={String(summary.mediumRisk)}  sub="monitor closely" />
          <StatCard label="Annual Rev at Risk" value={formatCurrency(summary.revenueAtRisk)} sub="across all studios" />
        </div>

        {/* Main layout */}
        <div className="flex gap-6">
          {/* Studio list */}
          <div className="w-64 flex-shrink-0">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "var(--text-dim)" }}>
              Studios by Risk
            </p>
            <div className="flex flex-col gap-2">
              {studioProfiles.map((p) => (
                <StudioRiskCard
                  key={`${p.studioName}__${p.studioCity}`}
                  profile={p}
                  selected={selectedStudio === `${p.studioName}__${p.studioCity}`}
                  onClick={() => setSelectedStudio(`${p.studioName}__${p.studioCity}`)}
                />
              ))}
            </div>
          </div>

          {/* Member table + ROI */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {selectedProfile && (
              <>
                {/* Studio header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">
                      {selectedProfile.studioName}
                      <span className="text-sm font-normal ml-2" style={{ color: "var(--text-muted)" }}>
                        · {selectedProfile.studioCity}
                      </span>
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
                      {selectedProfile.totalMembers} members analyzed
                      {" · "}
                      <span className="text-red-400">{selectedProfile.highRisk} high risk</span>
                      {" · "}
                      <span className="text-yellow-400">{selectedProfile.mediumRisk} medium risk</span>
                      {" · "}
                      {formatCurrency(selectedProfile.revenueAtRisk)} at risk
                    </p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "var(--surface-2)" }}>
                    {(["all", "high", "medium", "low"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setFilterLevel(level)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize",
                          filterLevel === level
                            ? "text-white bg-[#262626]"
                            : "hover:bg-[#262626]"
                        )}
                        style={{ color: filterLevel === level ? "#fafafa" : "#737373" }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Member table */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                        {["#", "Member", "Risk", "Last Visit", "Visits (30d)", "Annual Value"].map((h) => (
                          <th key={h} className={`px-4 py-3 text-xs font-medium ${h === "#" ? "text-center" : "text-left"}`} style={{ color: "var(--text-dim)" }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMembers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-xs" style={{ color: "var(--text-dim)" }}>
                            No members at this risk level.
                          </td>
                        </tr>
                      ) : (
                        selectedMembers.map((m, i) => (
                          <MemberRow key={m.id} member={m} rank={i + 1} />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ROI Calculator */}
                <RoiCalculator
                  highRiskCount={selectedProfile.highRisk}
                  revenueAtRisk={selectedProfile.revenueAtRisk}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
