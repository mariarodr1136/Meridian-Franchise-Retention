"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { SalesRecord } from "@/types";

interface Props {
  records: SalesRecord[];
  studioName: string;
}

// ── StatBubble (matches Members page) ─────────────────────────────────────────

interface StatDetail { label: string; value: string }

function StatBubble({
  label, value, sub, description, details,
}: {
  label: string; value: string; sub: string; description: string; details: StatDetail[];
}) {
  const [hovered, setHovered] = useState(false);
  const accent = "#4A638D";

  return (
    <div
      className="rounded-xl border p-5 relative cursor-default select-none"
      style={{
        background:  "#fff",
        borderColor: hovered ? accent : "#C8D8EE",
        boxShadow:   hovered ? "0 8px 24px rgba(74,99,141,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform:   hovered ? "translateY(-2px)" : "translateY(0)",
        transition:  "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-xs mb-1" style={{ color: accent, opacity: 0.7 }}>{label}</p>
      <p className="text-2xl font-bold truncate" style={{ color: accent }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: accent, opacity: 0.6 }}>{sub}</p>

      <div
        className="absolute left-0 right-0 bottom-full mb-2 rounded-xl border p-4 z-50"
        style={{
          background:    "#fff",
          borderColor:   accent,
          boxShadow:     "0 8px 28px rgba(74,99,141,0.18)",
          opacity:       hovered ? 1 : 0,
          transform:     hovered ? "translateY(0)" : "translateY(4px)",
          pointerEvents: hovered ? "auto" : "none",
          transition:    "opacity 150ms ease, transform 150ms ease",
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

// ── Trend tooltip — rich with MoM delta + units ───────────────────────────────

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as { revenue: number; units: number; delta: number | null };
  return (
    <div style={{
      background: "#fff", border: "1px solid #C8D8EE", borderRadius: 12,
      padding: "12px 16px", boxShadow: "0 8px 28px rgba(74,99,141,0.14)", minWidth: 180,
    }}>
      <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 6, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color: "#1B3352", marginBottom: 2 }}>{formatCurrency(d.revenue)}</p>
      {d.delta !== null && (
        <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: d.delta >= 0 ? "#16A34A" : "#DC2626" }}>
          {d.delta >= 0 ? "▲" : "▼"} {Math.abs(d.delta).toFixed(1)}% vs. prior month
        </p>
      )}
      <div style={{ borderTop: "1px solid #F0F5FB", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#9CA3AF" }}>Units sold</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{d.units.toLocaleString()}</span>
      </div>
    </div>
  );
}

// ── Category tooltip ──────────────────────────────────────────────────────────

function CategoryTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, e: any) => s + (Number(e.value) || 0), 0);
  return (
    <div style={{
      background: "#fff", border: "1px solid #C8D8EE", borderRadius: 12,
      padding: "12px 16px", boxShadow: "0 8px 24px rgba(74,99,141,0.14)", minWidth: 210,
    }}>
      <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
      {payload.filter((e: any) => Number(e.value) > 0).map((e: any) => (
        <div key={e.name} style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 4, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.fill, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#6B7280" }}>{e.name}</span>
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1F2937" }}>{formatCurrency(Number(e.value))}</span>
        </div>
      ))}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #F0F5FB", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Total</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#1B3352" }}>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  grip_socks:     "Grip Socks",
  water:          "Water",
  energy_drinks:  "Energy Drinks",
  merch:          "JETSET Merch",
  class_packages: "Class Packages",
  memberships:    "Memberships",
  gift_cards:     "Gift Cards",
  retail:         "Retail",
};

const ALL_CATEGORIES = ["memberships", "class_packages", "merch", "gift_cards", "grip_socks", "water", "energy_drinks"] as const;
const BAR_COLORS     = ["#1B3352", "#2E4A6B", "#4A638D", "#C9A84C", "#7BA3CC", "#9BB8D4", "#C8D8EE"];

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthLabel(iso: string) {
  const d = new Date(iso);
  return `${MONTH_LABELS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

const PAGE_SIZE = 10;

// ── PDF export ────────────────────────────────────────────────────────────────

async function exportProductPDF(
  studioName: string,
  monthStr: string,
  rows: { product: string; category: string; units: number; revenue: number; avgPrice: number }[],
  totalUnits: number,
  totalRevenue: number,
) {
  const { default: jsPDF }     = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc   = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const navy  = [74, 99, 141] as [number, number, number];
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(...navy);
  doc.text("Sales Report — Product Breakdown", 40, 50);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(107, 114, 128);
  doc.text(studioName, 40, 66);
  doc.text(`Month: ${monthStr}`, 40, 80);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, 40, 94);

  autoTable(doc, {
    startY: 114,
    head: [["Product", "Category", "Units Sold", "Revenue", "Avg Price"]],
    body: [
      ...rows.map(r => [
        r.product,
        CATEGORY_LABEL[r.category] ?? r.category,
        r.units.toLocaleString(),
        `$${r.revenue.toFixed(2)}`,
        `$${r.avgPrice.toFixed(2)}`,
      ]),
      ["TOTAL", "", totalUnits.toLocaleString(), `$${totalRevenue.toFixed(2)}`, ""],
    ],
    headStyles: { fillColor: navy, textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [55, 65, 81] },
    alternateRowStyles: { fillColor: [240, 245, 251] },
    footStyles: { fillColor: [240, 245, 251], textColor: navy as any, fontStyle: "bold" },
    margin: { left: 40, right: 40 }, tableWidth: pageW - 80,
  });

  doc.save(`${studioName.replace(/\s+/g, "-")}-sales-${monthStr.replace(/\s/g, "-")}.pdf`);
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SalesPageContent({ records, studioName }: Props) {
  const months = useMemo(() => {
    const set = new Set(records.map((r) => r.month));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const [selectedMonth,  setSelectedMonth]  = useState<string>(months[0] ?? "");
  const [tablePage,      setTablePage]      = useState(1);
  const [exporting,      setExporting]      = useState(false);
  const [productSearch,  setProductSearch]  = useState("");

  const monthRecords = useMemo(
    () => records.filter((r) => r.month === selectedMonth),
    [records, selectedMonth]
  );

  const prevMonthRecords = useMemo(() => {
    const idx = months.indexOf(selectedMonth);
    if (idx < 0 || idx + 1 >= months.length) return [];
    return records.filter((r) => r.month === months[idx + 1]);
  }, [records, months, selectedMonth]);

  // ── Revenue trend data (with MoM delta + units) ──────────────────────────────
  const trendData = useMemo(() => {
    const byMonth = new Map<string, { revenue: number; units: number }>();
    records.forEach((r) => {
      const curr = byMonth.get(r.month) ?? { revenue: 0, units: 0 };
      byMonth.set(r.month, { revenue: curr.revenue + r.revenue, units: curr.units + r.unitsSold });
    });
    const sorted = Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
    return sorted.map(([month, data], i) => {
      const prev  = i > 0 ? sorted[i - 1][1].revenue : null;
      const delta = prev !== null && prev > 0 ? ((data.revenue - prev) / prev * 100) : null;
      return { month: monthLabel(month), revenue: data.revenue, units: data.units, delta };
    });
  }, [records]);

  const avgRevenue = trendData.length
    ? Math.round(trendData.reduce((s, d) => s + d.revenue, 0) / trendData.length)
    : 0;
  const bestMonth  = trendData.length ? trendData.reduce((a, b) => a.revenue > b.revenue ? a : b) : null;
  const latestDelta = trendData.length > 1 ? trendData[trendData.length - 1].delta : null;

  // ── Product breakdown ─────────────────────────────────────────────────────────
  const allProductRows = useMemo(() => {
    return monthRecords
      .slice()
      .sort((a, b) => b.revenue - a.revenue)
      .map((r) => ({
        product:  r.product,
        category: r.category,
        units:    r.unitsSold,
        revenue:  r.revenue,
        avgPrice: r.unitsSold > 0 ? r.revenue / r.unitsSold : 0,
      }));
  }, [monthRecords]);

  const productRows = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return allProductRows;
    return allProductRows.filter(
      (r) => r.product.toLowerCase().includes(q) || (CATEGORY_LABEL[r.category] ?? r.category).toLowerCase().includes(q)
    );
  }, [allProductRows, productSearch]);

  const totalRevenue = monthRecords.reduce((s, r) => s + r.revenue, 0);
  const totalUnits   = monthRecords.reduce((s, r) => s + r.unitsSold, 0);
  const prevRevenue  = prevMonthRecords.reduce((s, r) => s + r.revenue, 0);
  const prevUnits    = prevMonthRecords.reduce((s, r) => s + r.unitsSold, 0);

  const topByUnits     = monthRecords.slice().sort((a, b) => b.unitsSold - a.unitsSold)[0];
  const topProductName = (topByUnits?.product ?? "—").startsWith("Grip Socks") ? "Grip Socks" : (topByUnits?.product ?? "—");
  const gripSocksUnits = monthRecords.filter(r => r.product.startsWith("Grip Socks")).reduce((s, r) => s + r.unitsSold, 0);
  const gripSocksRev   = monthRecords.filter(r => r.product.startsWith("Grip Socks")).reduce((s, r) => s + r.revenue, 0);

  const unitsByCat  = ALL_CATEGORIES.map(cat => ({
    cat, units: monthRecords.filter(r => r.category === cat).reduce((s, r) => s + r.unitsSold, 0),
  })).sort((a, b) => b.units - a.units);
  const topCatLabel = CATEGORY_LABEL[unitsByCat[0]?.cat] ?? "—";

  const revDelta   = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : null;
  const unitsDelta = prevUnits   > 0 ? ((totalUnits   - prevUnits)   / prevUnits   * 100) : null;
  const deltaStr   = (d: number | null) =>
    d !== null ? `${d >= 0 ? "+" : ""}${d.toFixed(1)}% vs. last month` : "No prior month data";

  // ── Category chart (horizontal stacked bar — last 6 months) ─────────────────
  const categoryTrend = useMemo(() => {
    const last6 = months.slice(0, 6).reverse();
    return last6.map((mo) => {
      const moRecs = records.filter((r) => r.month === mo);
      const entry: Record<string, string | number> = { month: monthLabel(mo) };
      ALL_CATEGORIES.forEach((cat) => {
        entry[CATEGORY_LABEL[cat]] = Math.round(
          moRecs.filter((r) => r.category === cat).reduce((s, r) => s + r.revenue, 0)
        );
      });
      return entry;
    });
  }, [records, months]);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalTablePages = Math.max(1, Math.ceil(productRows.length / PAGE_SIZE));
  const safePage        = Math.min(tablePage, totalTablePages);
  const pageRows        = productRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const onMonthChange = (m: string) => { setSelectedMonth(m); setTablePage(1); setProductSearch(""); };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProductPDF(studioName, monthLabel(selectedMonth), allProductRows, totalUnits, totalRevenue);
    } finally { setExporting(false); }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* KPI bubbles */}
      <div className="grid grid-cols-3 gap-4">
        <StatBubble
          label="Month Revenue"
          value={formatCurrency(totalRevenue)}
          sub={deltaStr(revDelta)}
          description="Total revenue across all products this month."
          details={[
            { label: "vs. last month",   value: deltaStr(revDelta) },
            { label: "Avg price / unit", value: totalUnits > 0 ? formatCurrency(totalRevenue / totalUnits) : "—" },
          ]}
        />
        <StatBubble
          label="Units Sold"
          value={totalUnits.toLocaleString()}
          sub={deltaStr(unitsDelta)}
          description="Total items sold across all categories this month."
          details={[
            { label: "vs. last month", value: deltaStr(unitsDelta) },
            { label: "Top category",   value: topCatLabel },
          ]}
        />
        <StatBubble
          label="Top Product"
          value={topProductName}
          sub={`${gripSocksUnits > 0 ? gripSocksUnits : topByUnits?.unitsSold ?? 0} units sold`}
          description="Best-selling product by units this month."
          details={[
            { label: "Units",   value: (gripSocksUnits > 0 ? gripSocksUnits : topByUnits?.unitsSold ?? 0).toLocaleString() },
            { label: "Revenue", value: formatCurrency(gripSocksUnits > 0 ? gripSocksRev : (topByUnits?.revenue ?? 0)) },
          ]}
        />
      </div>

      {/* Revenue trend — area chart with stats header */}
      <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        {/* Header row with mini stats */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#4A638D" }}>Revenue Trend — 12 Months</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Monthly net revenue across all product categories</p>
          </div>
          <div className="flex gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#C0CAD6" }}>12-Mo Avg</p>
              <p className="text-sm font-bold" style={{ color: "#4A638D" }}>{formatCurrency(avgRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#C0CAD6" }}>Best Month</p>
              <p className="text-sm font-bold" style={{ color: "#4A638D" }}>{bestMonth?.month ?? "—"}</p>
            </div>
            {latestDelta !== null && (
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#C0CAD6" }}>Latest MoM</p>
                <p className="text-sm font-bold" style={{ color: latestDelta >= 0 ? "#16A34A" : "#DC2626" }}>
                  {latestDelta >= 0 ? "+" : ""}{latestDelta.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#4A638D" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#4A638D" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FB" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              width={48}
            />
            <ReferenceLine
              y={avgRevenue}
              stroke="#C8D8EE"
              strokeDasharray="4 3"
              label={{ value: "avg", position: "insideTopRight", fontSize: 10, fill: "#9CA3AF", dy: -4 }}
            />
            <Tooltip content={<TrendTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4A638D"
              strokeWidth={2.5}
              fill="url(#revenueGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#1B3352", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* By Category — horizontal stacked bar (last 6 months) */}
      <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#4A638D" }}>By Category — Last 6 Months</p>
        <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>Revenue contribution per category</p>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            layout="vertical"
            data={categoryTrend}
            margin={{ top: 0, right: 24, left: 4, bottom: 0 }}
            barSize={18}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FB" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="month"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              width={52}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CategoryTooltip />} cursor={false} wrapperStyle={{ zIndex: 50 }} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 12 }}
              iconType="circle"
              iconSize={8}
            />
            {ALL_CATEGORIES.map((cat, i) => (
              <Bar
                key={cat}
                dataKey={CATEGORY_LABEL[cat]}
                fill={BAR_COLORS[i]}
                stackId="a"
                radius={i === ALL_CATEGORIES.length - 1 ? [0, 3, 3, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product breakdown */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-xs font-bold tracking-widest uppercase flex-1 min-w-0" style={{ color: "#4A638D" }}>Product Breakdown</p>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "#9CA3AF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Filter products…"
                value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setTablePage(1); }}
                className="pl-7 pr-3 py-1.5 text-xs rounded-lg outline-none"
                style={{ border: "1px solid #C8D8EE", color: "#4A638D", background: "#F0F5FB", width: 160, cursor: "text" }}
              />
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="text-xs outline-none cursor-pointer font-semibold"
              style={{
                border: "1.5px solid #4A638D",
                borderRadius: 8,
                color: "#1B3352",
                background: "#EEF3FB",
                padding: "6px 28px 6px 12px",
                appearance: "none" as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%234A638D' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 9px center",
              }}
            >
              {months.map((m) => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: exporting ? "#EEF3FB" : "#4A638D",
                color: exporting ? "#9CA3AF" : "#fff",
                border: "1.5px solid #4A638D",
                cursor: exporting ? "default" : "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.background = "#2E4A6B"; }}
              onMouseLeave={(e) => { if (!exporting) e.currentTarget.style.background = "#4A638D"; }}
            >
              {exporting
                ? <><span className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />Exporting…</>
                : <>↓ Export PDF</>}
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#FAFBFD", borderBottom: "1px solid #E5EDF7" }}>
              {["Product", "Category", "Units Sold", "Revenue", "Avg Price"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={row.product}
                style={{ borderTop: i > 0 ? "1px solid #F0F5FB" : undefined, transition: "background 0.12s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F0F5FB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <td className="px-5 py-3 font-medium" style={{ color: "#1F2937" }}>{row.product}</td>
                <td className="px-5 py-3">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: "#EEF3FB", color: "#4A638D", border: "1px solid #C8D8EE" }}
                  >
                    {CATEGORY_LABEL[row.category] ?? row.category}
                  </span>
                </td>
                <td className="px-5 py-3 tabular-nums" style={{ color: "#374151" }}>{row.units.toLocaleString()}</td>
                <td className="px-5 py-3 tabular-nums font-semibold" style={{ color: "#1B3352" }}>{formatCurrency(row.revenue)}</td>
                <td className="px-5 py-3 tabular-nums" style={{ color: "#6B7280" }}>{formatCurrency(row.avgPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #E5EDF7", background: "#FAFBFD" }}>
              <td className="px-5 py-3 font-semibold text-xs tracking-wide uppercase" style={{ color: "#4A638D" }} colSpan={2}>Total</td>
              <td className="px-5 py-3 tabular-nums font-bold" style={{ color: "#1F2937" }}>{totalUnits.toLocaleString()}</td>
              <td className="px-5 py-3 tabular-nums font-bold" style={{ color: "#1F2937" }}>{formatCurrency(totalRevenue)}</td>
              <td className="px-5 py-3" />
            </tr>
          </tfoot>
        </table>

        {/* Pagination */}
        {totalTablePages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid #E5EDF7" }}>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, productRows.length)} of {productRows.length}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: "#F0F5FB", color: safePage === 1 ? "#C8D8EE" : "#4A638D",
                  border: "1px solid #E2EBF5", cursor: safePage === 1 ? "default" : "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (safePage !== 1) { e.currentTarget.style.background = "#E2EBF5"; e.currentTarget.style.borderColor = "#C8D8EE"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#F0F5FB"; e.currentTarget.style.borderColor = "#E2EBF5"; }}
              >← Prev</button>
              {Array.from({ length: Math.min(5, totalTablePages) }, (_, i) => {
                const pg = totalTablePages <= 5 ? i + 1
                  : safePage <= 3 ? i + 1
                  : safePage >= totalTablePages - 2 ? totalTablePages - 4 + i
                  : safePage - 2 + i;
                const isActive = pg === safePage;
                return (
                  <button
                    key={pg}
                    onClick={() => setTablePage(pg)}
                    className="w-8 h-8 rounded-lg text-xs font-semibold"
                    style={{
                      background: isActive ? "#4A638D" : "#F0F5FB",
                      color:      isActive ? "#fff"    : "#6B7280",
                      border: "1px solid #E2EBF5", cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "#E2EBF5"; e.currentTarget.style.color = "#4A638D"; e.currentTarget.style.borderColor = "#C8D8EE"; } }}
                    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "#F0F5FB"; e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.borderColor = "#E2EBF5"; } }}
                  >{pg}</button>
                );
              })}
              <button
                onClick={() => setTablePage(p => Math.min(totalTablePages, p + 1))}
                disabled={safePage === totalTablePages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: "#F0F5FB", color: safePage === totalTablePages ? "#C8D8EE" : "#4A638D",
                  border: "1px solid #E2EBF5", cursor: safePage === totalTablePages ? "default" : "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (safePage !== totalTablePages) { e.currentTarget.style.background = "#E2EBF5"; e.currentTarget.style.borderColor = "#C8D8EE"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#F0F5FB"; e.currentTarget.style.borderColor = "#E2EBF5"; }}
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
