"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { SalesRecord } from "@/types";

interface Props {
  records: SalesRecord[];
}

const CATEGORY_COLORS: Record<string, string> = {
  retail:     "#4A638D",
  gift_cards: "#C9A84C",
};

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthLabel(iso: string) {
  const d = new Date(iso);
  return `${MONTH_LABELS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

export function SalesPageContent({ records }: Props) {
  const months = useMemo(() => {
    const set = new Set(records.map((r) => r.month));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] ?? "");

  const monthRecords = useMemo(
    () => records.filter((r) => r.month === selectedMonth),
    [records, selectedMonth]
  );

  // Monthly revenue trend (all months, all products summed)
  const trendData = useMemo(() => {
    const byMonth = new Map<string, number>();
    records.forEach((r) => {
      byMonth.set(r.month, (byMonth.get(r.month) ?? 0) + r.revenue);
    });
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month: monthLabel(month), revenue }));
  }, [records]);

  // Product breakdown for selected month
  const productRows = useMemo(() => {
    return monthRecords
      .slice()
      .sort((a, b) => b.revenue - a.revenue)
      .map((r) => ({
        product: r.product,
        category: r.category,
        units: r.unitsSold,
        revenue: r.revenue,
        avgPrice: r.unitsSold > 0 ? r.revenue / r.unitsSold : 0,
      }));
  }, [monthRecords]);

  const totalRevenue  = monthRecords.reduce((s, r) => s + r.revenue, 0);
  const totalUnits    = monthRecords.reduce((s, r) => s + r.unitsSold, 0);
  const topProduct    = productRows[0]?.product ?? "—";

  // Bar chart: category breakdown by month (last 6 months)
  const categoryTrend = useMemo(() => {
    const last6 = months.slice(0, 6).reverse();
    return last6.map((mo) => {
      const moRecs = records.filter((r) => r.month === mo);
      const retail    = moRecs.filter((r) => r.category === "retail").reduce((s, r) => s + r.revenue, 0);
      const giftCards = moRecs.filter((r) => r.category === "gift_cards").reduce((s, r) => s + r.revenue, 0);
      return { month: monthLabel(mo), Retail: Math.round(retail), "Gift Cards": Math.round(giftCards) };
    });
  }, [records, months]);

  const CATEGORY_LABEL: Record<string, string> = { retail: "Retail", gift_cards: "Gift Card" };

  return (
    <div className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Month Revenue",  value: formatCurrency(totalRevenue) },
          { label: "Units Sold",     value: totalUnits.toLocaleString() },
          { label: "Top Product",    value: topProduct },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>{label}</p>
            <p className="text-xl font-bold truncate" style={{ color: "#1F2937" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend line chart */}
      <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>Revenue Trend — 12 Months</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FB" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#9CA3AF" }} width={48} />
            <Tooltip formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
            <Line type="monotone" dataKey="revenue" stroke="#4A638D" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown bar chart */}
      <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#4A638D" }}>By Category — Last 6 Months</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={categoryTrend} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF3FB" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#9CA3AF" }} width={48} />
            <Tooltip formatter={(v, name) => [formatCurrency(Number(v)), String(name)]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Retail"     fill="#4A638D" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Gift Cards" fill="#C9A84C" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product breakdown table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Product Breakdown</p>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            style={{ border: "1px solid #C8D8EE", color: "#4A638D", background: "#F0F5FB" }}
          >
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFD" }}>
              {["Product", "Category", "Units Sold", "Revenue", "Avg Price"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productRows.map((row, i) => (
              <tr key={row.product} style={{ borderTop: i > 0 ? "1px solid #F0F5FB" : undefined }}>
                <td className="px-5 py-3 font-medium" style={{ color: "#1F2937" }}>{row.product}</td>
                <td className="px-5 py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: row.category === "retail" ? "#EEF3FB" : "#FFF8E7",
                      color:      row.category === "retail" ? "#4A638D" : "#C9A84C",
                    }}
                  >
                    {CATEGORY_LABEL[row.category] ?? row.category}
                  </span>
                </td>
                <td className="px-5 py-3 tabular-nums" style={{ color: "#374151" }}>{row.units.toLocaleString()}</td>
                <td className="px-5 py-3 tabular-nums font-semibold" style={{ color: "#1F2937" }}>{formatCurrency(row.revenue)}</td>
                <td className="px-5 py-3 tabular-nums" style={{ color: "#6B7280" }}>{formatCurrency(row.avgPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid #EEF3FB", background: "#F8FAFD" }}>
              <td className="px-5 py-3 font-bold" style={{ color: "#1F2937" }} colSpan={2}>Total</td>
              <td className="px-5 py-3 tabular-nums font-bold" style={{ color: "#1F2937" }}>{totalUnits.toLocaleString()}</td>
              <td className="px-5 py-3 tabular-nums font-bold" style={{ color: "#1F2937" }}>{formatCurrency(totalRevenue)}</td>
              <td className="px-5 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
