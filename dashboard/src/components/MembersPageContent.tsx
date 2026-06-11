"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import type { StudioMember, MembershipTier } from "@/types/members";

const PAGE_SIZE = 25;

// ── StatBubble ─────────────────────────────────────────────────────────────────

interface StatDetail { label: string; value: string }

function StatBubble({
  label, value, sub, description, details, accent = "#4A638D", accentBg = "#fff", borderColor = "#C8D8EE",
}: {
  label: string; value: string; sub: string; description: string;
  details: StatDetail[]; accent?: string; accentBg?: string; borderColor?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-xl border p-5 relative cursor-default select-none"
      style={{
        background:  accentBg,
        borderColor: hovered ? accent : borderColor,
        boxShadow:   hovered ? `0 8px 24px rgba(74,99,141,0.15)` : "0 1px 3px rgba(0,0,0,0.04)",
        transform:   hovered ? "translateY(-2px)" : "translateY(0)",
        transition:  "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-xs mb-1" style={{ color: accent, opacity: 0.7 }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: accent, opacity: 0.6 }}>{sub}</p>

      {/* Popup — appears above */}
      <div
        className="absolute left-0 right-0 bottom-full mb-2 rounded-xl border p-4 z-50"
        style={{
          background:   "#fff",
          borderColor:  accent,
          boxShadow:    "0 8px 28px rgba(74,99,141,0.18)",
          opacity:      hovered ? 1 : 0,
          transform:    hovered ? "translateY(0)" : "translateY(4px)",
          pointerEvents: hovered ? "auto" : "none",
          transition:   "opacity 150ms ease, transform 150ms ease",
        }}
      >
        <p className="text-xs mb-3" style={{ color: accent }}>{description}</p>
        {details.map(({ label: dl, value: dv }) => (
          <div key={dl} className="flex justify-between items-center py-1.5"
            style={{ borderBottom: "1px solid #F0F5FB" }}>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>{dl}</span>
            <span className="text-xs font-semibold" style={{ color: "#1F2937" }}>{dv}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline expanded detail ─────────────────────────────────────────────────────

function ExpandedDetail({ member }: { member: StudioMember }) {
  const isCancelled = member.status === "cancelled";

  const section = (title: string, rows: [string, string][]) => (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.11em", textTransform: "uppercase", color: "#C0CAD6", marginBottom: 10 }}>{title}</p>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>{label}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>{value}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      background: "#fff",
      borderTop: "1px solid #F0F5FB",
      padding: "18px 24px 22px",
      display: "flex",
      gap: 40,
    }}>
      {section("Contact", [
        ["Email", member.email],
        ["Phone", member.phone],
      ])}
      {section("Membership", [
        ["Joined",        member.joinedDate],
        ["Tier",          TIER_LABEL[member.membershipTier]],
        ["Tenure",        tenure(member)],
        ["Monthly value", formatCurrency(member.monthlyValue)],
        ...(isCancelled && member.cancelledDaysAgo !== undefined
          ? [["Cancelled", `${member.cancelledDaysAgo}d ago`] as [string, string]]
          : []),
      ])}
      {section("Activity", [
        ["Last visit", `${member.daysSinceLastVisit}d ago`],
        ...(!isCancelled
          ? [["Visits this month", String(member.visitsLast30d)] as [string, string]]
          : []),
      ])}
    </div>
  );
}

const TIER_COLORS: Record<MembershipTier, { bg: string; color: string }> = {
  "unlimited":        { bg: "#4A638D", color: "#fff" },
  "12-class monthly": { bg: "#4A638D", color: "#fff" },
  "8-class monthly":  { bg: "#4A638D", color: "#fff" },
  "4-class monthly":  { bg: "#4A638D", color: "#fff" },
};

const TIER_LABEL: Record<MembershipTier, string> = {
  "unlimited":        "Unlimited",
  "12-class monthly": "12-Class",
  "8-class monthly":  "8-Class",
  "4-class monthly":  "4-Class",
};

type SortKey = "name" | "tier" | "tenure" | "lastVisit" | "visits" | "value" | "cancelled";
type SortDir = "asc" | "desc";

function tenure(m: StudioMember) {
  const y = Math.floor(m.membershipAgeDays / 365);
  const mo = Math.floor((m.membershipAgeDays % 365) / 30);
  return y > 0 ? `${y}y ${mo}m` : `${mo}m`;
}

function sortMembers(members: StudioMember[], key: SortKey, dir: SortDir) {
  return [...members].sort((a, b) => {
    let diff = 0;
    if (key === "name")      diff = a.name.localeCompare(b.name);
    if (key === "tier")      diff = a.membershipTier.localeCompare(b.membershipTier);
    if (key === "tenure")    diff = a.membershipAgeDays - b.membershipAgeDays;
    if (key === "lastVisit") diff = a.daysSinceLastVisit - b.daysSinceLastVisit;
    if (key === "visits")    diff = a.visitsLast30d - b.visitsLast30d;
    if (key === "value")     diff = a.monthlyValue - b.monthlyValue;
    if (key === "cancelled") diff = (a.cancelledDaysAgo ?? 0) - (b.cancelledDaysAgo ?? 0);
    return dir === "asc" ? diff : -diff;
  });
}

// ── Column header with sort ────────────────────────────────────────────────────

function Th({
  label, sortKey, current, dir, onSort, align = "left",
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void; align?: "left" | "right";
}) {
  const active = current === sortKey;
  return (
    <th
      className="px-4 py-3 cursor-pointer select-none whitespace-nowrap"
      style={{ textAlign: align }}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1"
        style={{ justifyContent: align === "right" ? "flex-end" : "flex-start", width: "100%" }}>
        <span className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: active ? "#4A638D" : "#9CA3AF" }}>
          {label}
        </span>
        <span style={{ color: active ? "#4A638D" : "#D1D5DB", fontSize: 9 }}>
          {active ? (dir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </span>
    </th>
  );
}

// ── Table rows ─────────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
      flexShrink: 0,
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.28s cubic-bezier(0.22,1,0.36,1)",
      color: open ? "#4A638D" : "#C8D8EE",
    }}>
      <path d="M2.5 4.5l3.5 3 3.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ActiveRow({ member, i, isExpanded, onToggle }: { member: StudioMember; i: number; isExpanded: boolean; onToggle: () => void }) {
  const tier   = TIER_COLORS[member.membershipTier];
  const rowBg  = isExpanded ? "#EEF3FB" : i % 2 === 0 ? "#fff" : "#FAFBFD";
  return (
    <>
      <tr className="transition-colors cursor-pointer" style={{ background: rowBg }}
        onClick={onToggle}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "#F0F5FB"; }}
        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFD"; }}>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4A638D" }} />
            <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{member.name}</span>
            <span className="ml-auto"><Chevron open={isExpanded} /></span>
          </div>
        </td>
        <td className="px-4 py-2.5">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: tier.bg, color: tier.color }}>
            {TIER_LABEL[member.membershipTier]}
          </span>
        </td>
        <td className="px-4 py-2.5 text-sm" style={{ color: "#6B7280" }}>{tenure(member)}</td>
        <td className="px-4 py-2.5 text-sm" style={{ color: "#6B7280" }}>{member.daysSinceLastVisit}d ago</td>
        <td className="px-4 py-2.5 text-sm text-right" style={{ color: "#1F2937" }}>{member.visitsLast30d}</td>
        <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: "#1F2937" }}>
          {formatCurrency(member.monthlyValue)}
        </td>
      </tr>
      <tr>
        <td colSpan={6} style={{ padding: 0 }}>
          <div style={{
            display: "grid",
            gridTemplateRows: isExpanded ? "1fr" : "0fr",
            transition: "grid-template-rows 0.38s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <div style={{ overflow: "hidden", opacity: isExpanded ? 1 : 0, transition: "opacity 0.28s ease 0.06s" }}>
              <ExpandedDetail member={member} />
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

function CancelledRow({ member, i, isExpanded, onToggle }: { member: StudioMember; i: number; isExpanded: boolean; onToggle: () => void }) {
  const tier   = TIER_COLORS[member.membershipTier];
  const rowBg  = isExpanded ? "#FFF5F5" : i % 2 === 0 ? "#fff" : "#FAFBFD";
  return (
    <>
      <tr className="transition-colors cursor-pointer" style={{ background: rowBg }}
        onClick={onToggle}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = "#FFF5F5"; }}
        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFD"; }}>
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#DC2626" }} />
            <span className="text-sm font-medium" style={{ color: "#DC2626" }}>{member.name}</span>
            <span className="ml-auto"><Chevron open={isExpanded} /></span>
          </div>
        </td>
        <td className="px-4 py-2.5">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: tier.bg, color: tier.color }}>
            {TIER_LABEL[member.membershipTier]}
          </span>
        </td>
        <td className="px-4 py-2.5 text-sm" style={{ color: "#6B7280" }}>{tenure(member)}</td>
        <td className="px-4 py-2.5 text-sm" style={{ color: "#6B7280" }}>{member.daysSinceLastVisit}d ago</td>
        <td className="px-4 py-2.5 text-sm text-right font-semibold" style={{ color: "#DC2626" }}>
          {member.cancelledDaysAgo}d ago
        </td>
        <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: "#9CA3AF" }}>
          {formatCurrency(member.monthlyValue)}
        </td>
      </tr>
      <tr>
        <td colSpan={6} style={{ padding: 0 }}>
          <div style={{
            display: "grid",
            gridTemplateRows: isExpanded ? "1fr" : "0fr",
            transition: "grid-template-rows 0.38s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <div style={{ overflow: "hidden", opacity: isExpanded ? 1 : 0, transition: "opacity 0.28s ease 0.06s" }}>
              <ExpandedDetail member={member} />
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

// ── Member charts ─────────────────────────────────────────────────────────────

const ALL_TIERS: MembershipTier[] = ["unlimited", "12-class monthly", "8-class monthly", "4-class monthly"];

const CHART_COLORS = ["#4A638D", "#4A638D", "#4A638D", "#4A638D"];

function HBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, background: "#F0F5FB", borderRadius: 99, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${Math.max(pct * 100, 2)}%`,
        background: color, borderRadius: 99,
        transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

const CLASS_PACKS = [
  { key: "20-class", label: "20-Class Pack", price: 499 },
  { key: "10-class", label: "10-Class Pack", price: 279 },
  { key: "3-class",  label: "3-Class Pack",  price: 99  },
] as const;

function MemberCharts({ members }: { members: StudioMember[] }) {
  const [view,       setView]       = useState<"memberships" | "classpacks">("memberships");
  const [tierFilter, setTierFilter] = useState<MembershipTier | "all">("all");
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const active = useMemo(() => members.filter(m => m.status === "active"), [members]);

  // Membership stats — derived from real member data
  const memberStats = useMemo(() => ALL_TIERS.map((tier, i) => {
    const group     = active.filter(m => m.membershipTier === tier);
    const mrr       = group.reduce((s, m) => s + m.monthlyValue, 0);
    const avgVisits = group.length ? group.reduce((s, m) => s + m.visitsLast30d, 0) / group.length : 0;
    return { key: tier, label: TIER_LABEL[tier], count: group.length, revenue: mrr, avg: avgVisits, color: CHART_COLORS[i] };
  }), [active]);

  // Class pack stats — seeded from active member count
  const packStats = useMemo(() => {
    const base = active.length;
    const pcts  = [0.18, 0.28, 0.12];
    const avgs  = [14.2, 7.8, 2.1];
    return CLASS_PACKS.map(({ key, label, price }, i) => {
      const count = Math.round(base * pcts[i]);
      return { key, label, count, revenue: count * price, avg: avgs[i], color: "#4A638D" };
    });
  }, [active]);

  const filteredMemberStats = tierFilter === "all"
    ? memberStats
    : memberStats.filter(s => s.key === tierFilter);

  const displayStats  = view === "memberships" ? filteredMemberStats : packStats;
  const maxCount      = Math.max(...displayStats.map(s => s.count),   1);
  const maxRevenue    = Math.max(...displayStats.map(s => s.revenue),  1);
  const maxAvg        = Math.max(...displayStats.map(s => s.avg),      1);

  const col1Label = view === "memberships" ? "Members" : "Active Packages";
  const col2Label = view === "memberships" ? "Monthly Revenue" : "Pack Revenue";
  const col3Label = view === "memberships" ? "Avg Visits / Mo" : "Avg Sessions Used";

  const colLabel = (t: string) => (
    <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C0CAD6", marginBottom: 14 }}>{t}</p>
  );

  return (
    <div className="rounded-2xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      {/* Header row: view toggle + tier filter */}
      <div className="flex items-center justify-between mb-5">
        {/* Memberships / Class Packs toggle */}
        <div style={{ display: "flex", gap: 3, background: "#F0F5FB", borderRadius: 10, padding: 3, border: "1px solid #E2EBF5" }}>
          {(["memberships", "classpacks"] as const).map(v => {
            const isActive  = view === v;
            const isHovered = hoveredBtn === `view-${v}`;
            return (
              <button key={v}
                onClick={() => { setView(v); setTierFilter("all"); }}
                onMouseEnter={() => setHoveredBtn(`view-${v}`)}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: isActive ? "#4A638D" : isHovered ? "#E2EBF5" : "transparent",
                  color:      isActive ? "#fff"    : isHovered ? "#4A638D" : "#9CA3AF",
                  boxShadow:  isActive && isHovered ? "0 2px 8px rgba(74,99,141,0.22)" : "none",
                  transition: "all 0.15s ease",
                }}>
                {v === "memberships" ? "Memberships" : "Class Packs"}
              </button>
            );
          })}
        </div>

        {/* Tier filter pills — memberships view only */}
        {view === "memberships" && (
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", ...ALL_TIERS] as const).map(t => {
              const isActive  = tierFilter === t;
              const isHovered = hoveredBtn === `tier-${t}`;
              return (
                <button key={t}
                  onClick={() => setTierFilter(t as MembershipTier | "all")}
                  onMouseEnter={() => setHoveredBtn(`tier-${t}`)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    padding: "4px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background:  isActive ? "#4A638D" : isHovered ? "#E2EBF5"  : "#F0F5FB",
                    color:       isActive ? "#fff"    : isHovered ? "#4A638D"  : "#9CA3AF",
                    border:      `1px solid ${isActive ? "#4A638D" : isHovered ? "#C8D8EE" : "#E2EBF5"}`,
                    boxShadow:   isHovered && !isActive ? "0 1px 4px rgba(74,99,141,0.10)" : "none",
                    transform:   isHovered && !isActive ? "translateY(-1px)" : "translateY(0)",
                    transition:  "all 0.15s ease",
                  }}>
                  {t === "all" ? "All" : TIER_LABEL[t as MembershipTier]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Three bar-chart columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 36 }}>
        <div>
          {colLabel(col1Label)}
          {displayStats.map(s => (
            <div key={s.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2937" }}>{s.count}</span>
              </div>
              <HBar pct={s.count / maxCount} color={s.color} />
            </div>
          ))}
        </div>

        <div>
          {colLabel(col2Label)}
          {displayStats.map(s => (
            <div key={s.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2937" }}>{formatCurrency(s.revenue)}</span>
              </div>
              <HBar pct={s.revenue / maxRevenue} color={s.color} />
            </div>
          ))}
        </div>

        <div>
          {colLabel(col3Label)}
          {displayStats.map(s => (
            <div key={s.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1F2937" }}>{s.avg.toFixed(1)}</span>
              </div>
              <HBar pct={s.avg / maxAvg} color={s.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── PDF export ─────────────────────────────────────────────────────────────────

async function exportPDF(studioName: string, cancelled: StudioMember[], active: StudioMember[]) {
  const { default: jsPDF }     = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc   = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const navy  = [74, 99, 141]  as [number, number, number];
  const red   = [220, 38, 38]  as [number, number, number];
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(...navy);
  doc.text("Member Report", 40, 50);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(107, 114, 128);
  doc.text(studioName, 40, 66);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 40, 80);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...navy);
  doc.text(`Active: ${active.length}`, 40, 102);
  doc.text(`Cancelled this month: ${cancelled.length}`, 140, 102);
  doc.text(`Total: ${active.length + cancelled.length}`, 310, 102);

  const cols = ["Name", "Tier", "Tenure", "Last Visit", "Visits/mo", "$/mo"];

  if (cancelled.length > 0) {
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...red);
    doc.text("CANCELLED THIS MONTH", 40, 126);
    autoTable(doc, {
      startY: 132,
      head: [cols],
      body: cancelled.map(m => [m.name, m.membershipTier, tenure(m), `${m.cancelledDaysAgo}d ago (cancelled)`, "—", `$${m.monthlyValue}/mo`]),
      headStyles: { fillColor: red, textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8, textColor: [55, 65, 81] },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      margin: { left: 40, right: 40 }, tableWidth: pageW - 80,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterCancelled = (doc as any).lastAutoTable?.finalY ?? 132;
  const activeY = cancelled.length > 0 ? afterCancelled + 24 : 126;

  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...navy);
  doc.text("ACTIVE MEMBERS", 40, activeY);
  autoTable(doc, {
    startY: activeY + 6,
    head: [cols],
    body: active.map(m => [m.name, m.membershipTier, tenure(m), `${m.daysSinceLastVisit}d ago`, `${m.visitsLast30d}`, `$${m.monthlyValue}/mo`]),
    headStyles: { fillColor: navy, textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [55, 65, 81] },
    alternateRowStyles: { fillColor: [240, 245, 251] },
    margin: { left: 40, right: 40 }, tableWidth: pageW - 80,
  });

  doc.save(`${studioName.replace(/\s+/g, "-")}-members.pdf`);
}

// ── Main component ─────────────────────────────────────────────────────────────

type Tab = "active" | "cancelled";

interface Props {
  members: StudioMember[];
  studioName: string;
}

export function MembersPageContent({ members, studioName }: Props) {
  const [tab,            setTab]           = useState<Tab>("active");
  const [query,          setQuery]         = useState("");
  const [sortKey,        setSortKey]       = useState<SortKey>("name");
  const [sortDir,        setSortDir]       = useState<SortDir>("asc");
  const [page,           setPage]          = useState(1);
  const [exporting,      setExporting]     = useState(false);
  const [hoveredTab,     setHoveredTab]    = useState<Tab | null>(null);
  const [selectedMember, setSelectedMember] = useState<StudioMember | null>(null);
  const [tierFilter,     setTierFilter]    = useState<MembershipTier | "all">("all");
  const [hoveredTierPill, setHoveredTierPill] = useState<string | null>(null);

  const allCancelled = useMemo(() => members.filter(m => m.status === "cancelled"), [members]);
  const allActive    = useMemo(() => members.filter(m => m.status === "active"),    [members]);

  const filtered = useMemo(() => {
    const q    = query.toLowerCase().trim();
    const pool = tab === "active" ? allActive : allCancelled;
    const base = q ? pool.filter(m => m.name.toLowerCase().includes(q) || m.membershipTier.includes(q)) : pool;
    const tiered = tierFilter === "all" ? base : base.filter(m => m.membershipTier === tierFilter);
    const sk   = tab === "cancelled" && sortKey === "visits" ? "cancelled" : sortKey;
    return sortMembers(tiered, sk, sortDir);
  }, [tab, query, allActive, allCancelled, sortKey, sortDir, tierFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
    setPage(1);
  };

  const onTabChange = (t: Tab) => { setTab(t); setPage(1); setSortKey("name"); setSortDir("asc"); setSelectedMember(null); setTierFilter("all"); };
  const onQuery     = (q: string) => { setQuery(q); setPage(1); };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPDF(
        studioName,
        sortMembers(allCancelled, "cancelled", "asc"),
        sortMembers(allActive, "name", "asc"),
      );
    } finally { setExporting(false); }
  };

  // ── Stat bubble data ────────────────────────────────────────────────────────
  const activeMRR    = allActive.reduce((s, m) => s + m.monthlyValue, 0);
  const cancelledMRR = allCancelled.reduce((s, m) => s + m.monthlyValue, 0);
  const avgVisits    = allActive.length
    ? (allActive.reduce((s, m) => s + m.visitsLast30d, 0) / allActive.length).toFixed(1)
    : "0";
  const avgTenureLost  = allCancelled.length
    ? Math.round(allCancelled.reduce((s, m) => s + m.membershipAgeDays, 0) / allCancelled.length)
    : 0;
  const avgTenureLabel = avgTenureLost >= 365
    ? `${Math.floor(avgTenureLost / 365)}y ${Math.floor((avgTenureLost % 365) / 30)}m`
    : `${Math.floor(avgTenureLost / 30)}m`;
  const churnPct = members.length
    ? Math.round((allCancelled.length / members.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">

      {/* Stat bubbles */}
      <div className="grid grid-cols-3 gap-4">
        <StatBubble
          label="Active Members"
          value={String(allActive.length)}
          sub={`${formatCurrency(activeMRR)}/mo revenue`}
          description="Currently active memberships."
          details={[
            { label: "Avg visits/mo",   value: avgVisits },
            { label: "Monthly revenue", value: formatCurrency(activeMRR) },
          ]}
        />
        <StatBubble
          label="Cancelled This Month"
          value={String(allCancelled.length)}
          sub={`${formatCurrency(cancelledMRR)}/mo lost`}
          description="Cancellations in the last 30 days."
          details={[
            { label: "Avg tenure lost",  value: avgTenureLabel },
            { label: "Revenue lost/mo",  value: formatCurrency(cancelledMRR) },
          ]}
          accent="#DC2626"
          accentBg="#FFF5F5"
          borderColor="#FECACA"
        />
        <StatBubble
          label="Total Roster"
          value={String(members.length)}
          sub={`${churnPct}% churn rate this month`}
          description="All members including cancellations."
          details={[
            { label: "Active",    value: `${allActive.length} (${100 - churnPct}%)` },
            { label: "Cancelled", value: `${allCancelled.length} (${churnPct}%)` },
          ]}
        />
      </div>

      {/* Charts */}
      <MemberCharts members={members} />

      {/* Search + export */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name or tier…"
          value={query}
          onChange={e => onQuery(e.target.value)}
          className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
          style={{ background: "#fff", borderColor: "#C8D8EE", color: "#1F2937" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#4A638D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(74,99,141,0.10)"; }}
          onMouseLeave={e => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.borderColor = "#C8D8EE"; e.currentTarget.style.boxShadow = "none"; } }}
          onFocus={e => { e.currentTarget.style.borderColor = "#4A638D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(74,99,141,0.12)"; }}
          onBlur={e  => { e.currentTarget.style.borderColor = "#C8D8EE"; e.currentTarget.style.boxShadow = "none"; }}
        />
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex-shrink-0"
          style={{ background: "#4A638D", color: "#fff", opacity: exporting ? 0.6 : 1 }}
          onMouseEnter={e => { if (!exporting) { e.currentTarget.style.background = "#425A80"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(74,99,141,0.18)"; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "#4A638D"; e.currentTarget.style.boxShadow = "none"; }}
        >
          {exporting
            ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Exporting…</>
            : <>↓ Export PDF</>}
        </button>
      </div>

      {/* Tabs + tier filter */}
      <div className="flex items-center justify-between" style={{ borderBottom: "2px solid #E2EBF5" }}>
        <div className="flex">
          {([
            { key: "active"    as Tab, label: "Active",               count: allActive.length,    activeColor: "#4A638D" },
            { key: "cancelled" as Tab, label: "Cancelled this month",  count: allCancelled.length, activeColor: "#DC2626" },
          ]).map(({ key, label, count, activeColor }) => {
            const isActive = tab === key;
            const isHovered = hoveredTab === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                onMouseEnter={() => setHoveredTab(key)}
                onMouseLeave={() => setHoveredTab(null)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all cursor-pointer relative"
                style={{
                  color:        isActive ? activeColor : isHovered ? "#6B7280" : "#9CA3AF",
                  borderBottom: isActive ? `2px solid ${activeColor}` : "2px solid transparent",
                  marginBottom: "-2px",
                  background:   "transparent",
                }}
              >
                {label}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={isActive
                    ? { background: activeColor + "15", color: activeColor }
                    : { background: "#EEF3FB", color: "#9CA3AF" }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tier filter pills — far right */}
        <div className="flex items-center gap-2 pb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#C0CAD6" }}>Tier</span>
          <div className="flex gap-1">
            {(["all", ...ALL_TIERS] as const).map(t => {
              const isActive  = tierFilter === t;
              const isHovered = hoveredTierPill === t;
              return (
                <button key={t}
                  onClick={() => { setTierFilter(t as MembershipTier | "all"); setPage(1); }}
                  onMouseEnter={() => setHoveredTierPill(t)}
                  onMouseLeave={() => setHoveredTierPill(null)}
                  style={{
                    padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: isActive ? "#4A638D" : isHovered ? "#E2EBF5" : "#F0F5FB",
                    color:      isActive ? "#fff"    : isHovered ? "#4A638D" : "#9CA3AF",
                    border:     `1px solid ${isActive ? "#4A638D" : isHovered ? "#C8D8EE" : "#E2EBF5"}`,
                    transition: "all 0.15s ease",
                  }}>
                  {t === "all" ? "All" : TIER_LABEL[t as MembershipTier]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium" style={{ color: "#6B7280" }}>No members match &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5EDF7", background: "#FAFBFD" }}>
                    <Th label="Name"       sortKey="name"      current={sortKey} dir={sortDir} onSort={onSort} />
                    <Th label="Tier"       sortKey="tier"      current={sortKey} dir={sortDir} onSort={onSort} />
                    <Th label="Tenure"     sortKey="tenure"    current={sortKey} dir={sortDir} onSort={onSort} />
                    <Th label="Last Visit" sortKey="lastVisit" current={sortKey} dir={sortDir} onSort={onSort} />
                    {tab === "active"
                      ? <Th label="Visits/mo" sortKey="visits"    current={sortKey} dir={sortDir} onSort={onSort} align="right" />
                      : <Th label="Cancelled" sortKey="cancelled" current={sortKey} dir={sortDir} onSort={onSort} align="right" />}
                    <Th label="$/mo" sortKey="value" current={sortKey} dir={sortDir} onSort={onSort} align="right" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((m, i) =>
                    tab === "active"
                      ? <ActiveRow    key={m.id} member={m} i={i} isExpanded={selectedMember?.id === m.id} onToggle={() => setSelectedMember(selectedMember?.id === m.id ? null : m)} />
                      : <CancelledRow key={m.id} member={m} i={i} isExpanded={selectedMember?.id === m.id} onToggle={() => setSelectedMember(selectedMember?.id === m.id ? null : m)} />
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: "1px solid #E5EDF7" }}
              >
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    style={{
                      background: "#F0F5FB", color: safePage === 1 ? "#C8D8EE" : "#4A638D",
                      border: "1px solid #E2EBF5", cursor: safePage === 1 ? "default" : "pointer",
                    }}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = totalPages <= 5 ? i + 1
                      : safePage <= 3 ? i + 1
                      : safePage >= totalPages - 2 ? totalPages - 4 + i
                      : safePage - 2 + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className="w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        style={{
                          background: pg === safePage ? "#4A638D" : "#F0F5FB",
                          color:      pg === safePage ? "#fff"     : "#6B7280",
                          border:     "1px solid #E2EBF5",
                        }}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: "#F0F5FB", color: safePage === totalPages ? "#C8D8EE" : "#4A638D",
                      border: "1px solid #E2EBF5", cursor: safePage === totalPages ? "default" : "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
