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

const TIER_COLORS: Record<MembershipTier, { bg: string; color: string }> = {
  "unlimited":        { bg: "#EEF3FB", color: "#4A638D" },
  "12-class monthly": { bg: "#F0FDF4", color: "#16a34a" },
  "8-class monthly":  { bg: "#FEF3C7", color: "#D97706" },
  "4-class monthly":  { bg: "#F5F3FF", color: "#7C3AED" },
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

function ActiveRow({ member, i }: { member: StudioMember; i: number }) {
  const tier = TIER_COLORS[member.membershipTier];
  return (
    <tr className="transition-colors" style={{ background: i % 2 === 0 ? "#fff" : "#FAFBFD" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#F0F5FB")}
      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFD")}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#16a34a" }} />
          <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{member.name}</span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded capitalize"
          style={{ background: tier.bg, color: tier.color }}>
          {member.membershipTier}
        </span>
      </td>
      <td className="px-4 py-2.5 text-sm" style={{ color: "#6B7280" }}>{tenure(member)}</td>
      <td className="px-4 py-2.5 text-sm" style={{ color: "#6B7280" }}>{member.daysSinceLastVisit}d ago</td>
      <td className="px-4 py-2.5 text-sm text-right" style={{ color: "#1F2937" }}>{member.visitsLast30d}</td>
      <td className="px-4 py-2.5 text-sm text-right font-medium" style={{ color: "#1F2937" }}>
        {formatCurrency(member.monthlyValue)}
      </td>
    </tr>
  );
}

function CancelledRow({ member, i }: { member: StudioMember; i: number }) {
  const tier = TIER_COLORS[member.membershipTier];
  return (
    <tr className="transition-colors" style={{ background: i % 2 === 0 ? "#fff" : "#FAFBFD" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#FFF5F5")}
      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FAFBFD")}>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#DC2626" }} />
          <span className="text-sm font-medium" style={{ color: "#DC2626" }}>{member.name}</span>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded capitalize"
          style={{ background: tier.bg, color: tier.color }}>
          {member.membershipTier}
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
  const [tab,        setTab]       = useState<Tab>("active");
  const [query,      setQuery]     = useState("");
  const [sortKey,    setSortKey]   = useState<SortKey>("name");
  const [sortDir,    setSortDir]   = useState<SortDir>("asc");
  const [page,       setPage]      = useState(1);
  const [exporting,  setExporting] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);

  const allCancelled = useMemo(() => members.filter(m => m.status === "cancelled"), [members]);
  const allActive    = useMemo(() => members.filter(m => m.status === "active"),    [members]);

  const filtered = useMemo(() => {
    const q    = query.toLowerCase().trim();
    const pool = tab === "active" ? allActive : allCancelled;
    const base = q ? pool.filter(m => m.name.toLowerCase().includes(q) || m.membershipTier.includes(q)) : pool;
    const sk   = tab === "cancelled" && sortKey === "visits" ? "cancelled" : sortKey;
    return sortMembers(base, sk, sortDir);
  }, [tab, query, allActive, allCancelled, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
    setPage(1);
  };

  const onTabChange = (t: Tab) => { setTab(t); setPage(1); setSortKey("name"); setSortDir("asc"); };
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

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: "#F0F5FB", border: "1px solid #E2EBF5" }}>
        {([
          { key: "active"    as Tab, label: "Active",             count: allActive.length,    activeColor: "#4A638D" },
          { key: "cancelled" as Tab, label: "Cancelled this month", count: allCancelled.length, activeColor: "#DC2626" },
        ]).map(({ key, label, count, activeColor }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            onMouseEnter={() => setHoveredTab(key)}
            onMouseLeave={() => setHoveredTab(null)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
            style={tab === key
              ? { background: "#fff", color: activeColor, boxShadow: "0 1px 4px rgba(74,99,141,0.15)" }
              : hoveredTab === key
                ? { color: "#6B7280", boxShadow: "0 0 0 1.5px #4A638D28" }
                : { color: "#9CA3AF" }}
          >
            {label}
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={tab === key
                ? { background: activeColor + "15", color: activeColor }
                : { background: "#E5EDF7", color: "#9CA3AF" }}
            >
              {count}
            </span>
          </button>
        ))}
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
                      ? <ActiveRow    key={m.id} member={m} i={i} />
                      : <CancelledRow key={m.id} member={m} i={i} />
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
