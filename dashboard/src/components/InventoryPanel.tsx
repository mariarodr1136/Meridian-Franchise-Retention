"use client";

import { useState, useMemo } from "react";
import type { InventoryItem } from "@/types";

interface Props {
  studioId: string;
  studioName?: string;
  items: InventoryItem[];
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthLabel(iso: string) {
  const d = new Date(iso);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

// ── Stat card with hover lift ──────────────────────────────────────────────────
function StatCard({
  label, value, sub, alertLevel,
}: {
  label: string;
  value: number | string;
  sub?: string;
  alertLevel?: "red" | "amber" | null;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = "#4A638D";
  const alertMap = {
    red:   { bg: "#FEF2F2", border: "#FECACA", val: "#DC2626" },
    amber: { bg: "#FFFBEB", border: "#FDE68A", val: "#D97706" },
  };
  const alert = alertLevel && Number(value) > 0 ? alertMap[alertLevel] : null;
  return (
    <div
      className="rounded-xl border p-5 cursor-default select-none"
      style={{
        background:  alert ? alert.bg : "#fff",
        borderColor: hovered ? accent : (alert ? alert.border : "#C8D8EE"),
        boxShadow:   hovered ? "0 8px 24px rgba(74,99,141,0.14)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform:   hovered ? "translateY(-2px)" : "translateY(0)",
        transition:  "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-xs mb-1 font-medium tracking-wide" style={{ color: "#9CA3AF" }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: alert ? alert.val : accent }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{sub}</p>}
    </div>
  );
}

// ── Status pill with dot ───────────────────────────────────────────────────────
function StatusPill({ qty, reorder }: { qty: number; reorder: number }) {
  if (qty <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold"
        style={{ background: "#FEE2E2", color: "#991B1B" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#DC2626" }} />
        Out of Stock
      </span>
    );
  }
  if (qty < reorder) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold"
        style={{ background: "#FFFBEB", color: "#92400E" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#D97706" }} />
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full"
      style={{ background: "#F0FDF4", color: "#166534" }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22C55E" }} />
      OK
    </span>
  );
}

// ── Mini stock level bar ───────────────────────────────────────────────────────
function StockBar({ qty, reorder, max }: { qty: number; reorder: number; max: number }) {
  const pct   = Math.min(100, max > 0 ? (qty / max) * 100 : 0);
  const color = qty <= 0 ? "#DC2626" : qty < reorder ? "#F59E0B" : "#22C55E";
  return (
    <div className="w-full h-1 rounded-full mt-1.5" style={{ background: "#EEF3FB" }}>
      <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: color, transition: "width 400ms ease" }} />
    </div>
  );
}

// ── Inline number input ────────────────────────────────────────────────────────
function NumInput({ field, value, onChange }: { field: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={field}
      className="w-16 text-sm rounded-lg px-2 py-1 text-center outline-none"
      style={{ border: "1px solid #C8D8EE", background: "#F0F5FB", color: "#1F2937" }}
    />
  );
}

// ── Export PDF button ──────────────────────────────────────────────────────────
function ExportButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
      style={{
        background: hovered && !loading ? "#3d5478" : "#4A638D",
        color:      "#fff",
        transform:  hovered && !loading ? "translateY(-1px)" : "translateY(0)",
        boxShadow:  hovered && !loading ? "0 4px 12px rgba(74,99,141,0.3)" : "none",
        transition: "background 150ms ease, transform 150ms ease, box-shadow 150ms ease",
        opacity:    loading ? 0.7 : 1,
        cursor:     loading ? "default" : "pointer",
      }}
    >
      {loading ? (
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 17h16" />
        </svg>
      )}
      {loading ? "Exporting…" : "Export PDF"}
    </button>
  );
}

// ── Edit / Save buttons ────────────────────────────────────────────────────────
function EditButton({ rowHovered, onClick }: { rowHovered: boolean; onClick: () => void }) {
  const [btnHovered, setBtnHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setBtnHovered(true)}
      onMouseLeave={() => setBtnHovered(false)}
      className="text-xs px-3 py-1 rounded-lg font-medium whitespace-nowrap"
      style={{
        border:     `1px solid ${btnHovered ? "#4A638D" : "#C8D8EE"}`,
        color:      btnHovered ? "#fff" : "#4A638D",
        background: btnHovered ? "#4A638D" : rowHovered ? "#EEF3FB" : "transparent",
        transition: "background 150ms ease, color 150ms ease, border-color 150ms ease",
      }}
    >
      Edit
    </button>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={saving}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-xs px-3 py-1 rounded-lg font-semibold text-white whitespace-nowrap"
      style={{
        background: hovered && !saving ? "#3d5478" : "#4A638D",
        transform:  hovered && !saving ? "translateY(-1px)" : "translateY(0)",
        boxShadow:  hovered && !saving ? "0 4px 10px rgba(74,99,141,0.3)" : "none",
        transition: "background 150ms ease, transform 150ms ease, box-shadow 150ms ease",
        opacity:    saving ? 0.7 : 1,
      }}
    >
      {saving ? "Saving…" : "Save"}
    </button>
  );
}

// ── Table row (own component for hover state) ──────────────────────────────────
function TableRow({
  item, isEditing, editValues, saving, isFirst, maxQty,
  onEdit, onSave, onCancel, onEditChange,
}: {
  item: InventoryItem;
  isEditing: boolean;
  editValues: Record<string, string>;
  saving: boolean;
  isFirst: boolean;
  maxQty: number;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEditChange: (field: string, value: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const liveClosing = isEditing
    ? Math.max(0, (parseInt(editValues.openingQty) || 0) + (parseInt(editValues.receivedQty) || 0) - (parseInt(editValues.usedQty) || 0))
    : item.closingQty;

  const closingColor = item.closingQty <= 0 ? "#DC2626" : item.closingQty < item.reorderPoint ? "#D97706" : "#1F2937";

  return (
    <tr
      style={{
        borderTop:  isFirst ? "1px solid #EEF3FB" : "1px solid #F0F5FB",
        background: isEditing ? "#F8FAFD" : hovered ? "#F5F8FE" : "transparent",
        transition: "background 120ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td className="px-4 py-3 font-medium" style={{ color: "#1F2937", minWidth: 140 }}>
        {item.name}
      </td>

      {isEditing ? (
        <>
          {(["openingQty", "receivedQty", "usedQty"] as const).map((f) => (
            <td key={f} className="px-2 py-2">
              <NumInput field={f} value={editValues[f] ?? ""} onChange={(v) => onEditChange(f, v)} />
            </td>
          ))}
          <td className="px-4 py-3" style={{ minWidth: 90 }}>
            <span className="tabular-nums font-semibold" style={{ color: closingColor }}>{liveClosing}</span>
          </td>
          <td className="px-2 py-2">
            <NumInput field="reorderPoint" value={editValues.reorderPoint ?? ""} onChange={(v) => onEditChange("reorderPoint", v)} />
          </td>
          <td className="px-4 py-3" />
          <td className="px-3 py-3">
            <div className="flex items-center gap-2">
              <SaveButton saving={saving} onClick={onSave} />
              <button
                onClick={onCancel}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ color: "#6B7280" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F0F5FB")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                ✕
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-3 tabular-nums" style={{ color: "#374151" }}>{item.openingQty}</td>
          <td className="px-4 py-3 tabular-nums" style={{ color: "#374151" }}>{item.receivedQty}</td>
          <td className="px-4 py-3 tabular-nums" style={{ color: "#374151" }}>{item.usedQty}</td>
          <td className="px-4 py-3" style={{ minWidth: 100 }}>
            <span className="tabular-nums font-semibold" style={{ color: closingColor }}>{item.closingQty}</span>
            <StockBar qty={item.closingQty} reorder={item.reorderPoint} max={maxQty} />
          </td>
          <td className="px-4 py-3 tabular-nums text-xs" style={{ color: "#9CA3AF" }}>{item.reorderPoint}</td>
          <td className="px-4 py-3">
            <StatusPill qty={item.closingQty} reorder={item.reorderPoint} />
          </td>
          <td className="px-3 py-3">
            <EditButton rowHovered={hovered} onClick={onEdit} />
          </td>
        </>
      )}
    </tr>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export function InventoryPanel({ studioId, studioName = "Studio", items }: Props) {
  const months = useMemo(() => {
    const set = new Set(items.map((i) => i.month));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] ?? "");
  const [search, setSearch]               = useState("");
  const [catFilter, setCatFilter]         = useState("all");
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editValues, setEditValues]       = useState<Record<string, string>>({});
  const [saving, setSaving]               = useState(false);
  const [localItems, setLocalItems]       = useState<InventoryItem[]>(items);
  const [exporting, setExporting]         = useState(false);

  const allMonthItems = useMemo(
    () => localItems.filter((i) => i.month === selectedMonth),
    [localItems, selectedMonth]
  );

  // All unique categories present for this month (for filter pills)
  const allCategories = useMemo(() => {
    const set = new Set(allMonthItems.map((i) => i.category));
    return Array.from(set).sort();
  }, [allMonthItems]);

  const monthItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allMonthItems
      .filter((i) => catFilter === "all" || i.category === catFilter)
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }, [allMonthItems, search, catFilter]);

  // Categories present in the filtered view (for section headers in "all" mode)
  const categories = useMemo(() => {
    const set = new Set(monthItems.map((i) => i.category));
    return Array.from(set).sort();
  }, [monthItems]);

  const totalUnits      = allMonthItems.reduce((s, i) => s + i.closingQty, 0);
  const outOfStockCount = allMonthItems.filter((i) => i.closingQty <= 0).length;
  const lowStockCount   = allMonthItems.filter((i) => i.closingQty > 0 && i.closingQty < i.reorderPoint).length;

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setEditValues({
      openingQty:   String(item.openingQty),
      receivedQty:  String(item.receivedQty),
      usedQty:      String(item.usedQty),
      reorderPoint: String(item.reorderPoint),
    });
  }

  async function saveEdit(item: InventoryItem) {
    setSaving(true);
    const opening  = parseInt(editValues.openingQty)  || 0;
    const received = parseInt(editValues.receivedQty) || 0;
    const used     = parseInt(editValues.usedQty)     || 0;
    const closing  = Math.max(0, opening + received - used);
    const reorder  = parseInt(editValues.reorderPoint) || item.reorderPoint;

    await fetch(`/api/studios/${studioId}/inventory`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, openingQty: opening, receivedQty: received, usedQty: used, closingQty: closing, reorderPoint: reorder }),
    });

    setLocalItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, openingQty: opening, receivedQty: received, usedQty: used, closingQty: closing, reorderPoint: reorder }
          : i
      )
    );
    setSaving(false);
    setEditingId(null);
  }

  async function exportPDF() {
    setExporting(true);
    try {
      const { default: jsPDF }     = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc   = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const navy  = [74, 99, 141] as [number, number, number];
      const pageW = doc.internal.pageSize.getWidth();
      const label = monthLabel(selectedMonth);

      // Header bar
      doc.setFillColor(...navy);
      doc.rect(0, 0, pageW, 52, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("JETSET MODERN PILATES", 40, 32);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 216, 238);
      doc.text(`Inventory Report  ·  ${studioName}  ·  ${label}`, 40, 46);
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      doc.setTextColor(160, 174, 192);
      doc.setFontSize(8);
      doc.text(`Generated ${today}`, pageW - 40, 46, { align: "right" });

      // Summary strip
      const sy = 68;
      doc.setFillColor(240, 245, 251);
      doc.roundedRect(40, sy, pageW - 80, 44, 6, 6, "F");
      const summaryItems = [
        { label: "Total SKUs",    value: String(allMonthItems.length) },
        { label: "Units on Hand", value: String(totalUnits) },
        { label: "Low Stock",     value: String(lowStockCount) },
        { label: "Out of Stock",  value: String(outOfStockCount) },
      ];
      const colW = (pageW - 80) / 4;
      summaryItems.forEach(({ label: sl, value: sv }, idx) => {
        const cx = 40 + idx * colW + colW / 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...navy);
        doc.text(sv, cx, sy + 21, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(120, 130, 150);
        doc.text(sl.toUpperCase(), cx, sy + 34, { align: "center" });
      });

      let curY = sy + 62;

      const allCats = Array.from(new Set(allMonthItems.map((i) => i.category))).sort();
      for (const cat of allCats) {
        const catItems = allMonthItems
          .filter((i) => i.category === cat)
          .sort((a, b) => a.name.localeCompare(b.name));

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...navy);
        doc.text(categoryLabel(cat).toUpperCase(), 40, curY);
        curY += 6;

        autoTable(doc, {
          startY: curY,
          margin: { left: 40, right: 40 },
          head: [["Item", "Opening", "Received", "Used / Sold", "Closing", "Reorder At", "Status"]],
          body: catItems.map((i) => {
            const status = i.closingQty <= 0 ? "Out of Stock" : i.closingQty < i.reorderPoint ? "Low Stock" : "OK";
            return [i.name, i.openingQty, i.receivedQty, i.usedQty, i.closingQty, i.reorderPoint, status];
          }),
          headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
          bodyStyles: { fontSize: 8.5, textColor: [31, 41, 55] },
          alternateRowStyles: { fillColor: [248, 250, 253] },
          columnStyles: {
            0: { cellWidth: "auto" },
            1: { halign: "center" },
            2: { halign: "center" },
            3: { halign: "center" },
            4: { halign: "center", fontStyle: "bold" },
            5: { halign: "center", textColor: [120, 130, 150] as [number, number, number] },
            6: { halign: "center", fontStyle: "bold" },
          },
          didParseCell(data) {
            if (data.column.index === 6 && data.section === "body") {
              const v = String(data.cell.raw);
              if (v === "Out of Stock") data.cell.styles.textColor = [153, 27, 27];
              else if (v === "Low Stock") data.cell.styles.textColor = [146, 64, 14];
              else data.cell.styles.textColor = [22, 101, 52];
            }
          },
        });

        curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
      }

      doc.save(`inventory-${studioName.replace(/\s+/g, "-").toLowerCase()}-${label.replace(/\s/g, "-").toLowerCase()}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total SKUs"    value={allMonthItems.length} sub={monthLabel(selectedMonth)} />
        <StatCard label="Units on Hand" value={totalUnits}           sub="closing stock total" />
        <StatCard label="Out of Stock"  value={outOfStockCount}      alertLevel="red" />
        <StatCard label="Low Stock"     value={lowStockCount}        alertLevel="amber" />
      </div>

      {/* ── Table card ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>

        {/* Toolbar row 1 */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-xs font-bold tracking-widest uppercase flex-1 min-w-0" style={{ color: "#4A638D" }}>
            Inventory — End of Month
          </p>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
              style={{ color: "#9CA3AF" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Filter items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-xs rounded-lg outline-none"
              style={{ border: "1px solid #C8D8EE", color: "#4A638D", background: "#F0F5FB", width: 160, cursor: "text" }}
            />
          </div>

          {/* Month picker */}
          <select
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setSearch(""); setCatFilter("all"); setEditingId(null); }}
            className="text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            style={{ border: "1px solid #C8D8EE", color: "#4A638D", background: "#F0F5FB" }}
          >
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>

          {/* Export */}
          <ExportButton loading={exporting} onClick={exportPDF} />
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <CategoryPill label="All" value="all" active={catFilter === "all"} count={allMonthItems.length} onClick={() => setCatFilter("all")} />
          {allCategories.map((cat) => (
            <CategoryPill
              key={cat}
              label={categoryLabel(cat)}
              value={cat}
              active={catFilter === cat}
              count={allMonthItems.filter((i) => i.category === cat).length}
              onClick={() => setCatFilter(cat)}
            />
          ))}
        </div>

        {/* Body — fixed min-height so filtering never shifts page position */}
        <div style={{ minHeight: 480 }}>

        {/* Empty state */}
        {monthItems.length === 0 && (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium" style={{ color: "#1F2937" }}>No items match{search ? ` "${search}"` : ""}</p>
            <button
              onClick={() => { setSearch(""); setCatFilter("all"); }}
              className="text-xs mt-1.5 underline"
              style={{ color: "#4A638D", cursor: "pointer" }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Category groups — header shown in "all" view; hidden in single-category view */}
        {categories.map((cat) => {
          const catItems = monthItems.filter((i) => i.category === cat);
          const maxQty   = Math.max(...catItems.map((i) => i.openingQty + i.receivedQty), 1);
          return (
            <div key={cat}>
              {/* Category header — only shown in "all" view */}
              {catFilter === "all" && (
                <div className="px-5 py-2.5 flex items-center gap-2"
                  style={{ background: "#F8FAFD", borderBottom: "1px solid #EEF3FB" }}>
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#6B7280" }}>
                    {categoryLabel(cat)}
                  </span>
                  <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "#E8EEFA", color: "#4A638D" }}>
                    {catItems.length}
                  </span>
                </div>
              )}

              {/* Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFD" }}>
                    {["Item", "Opening", "Received", "Used / Sold", "Closing Stock", "Reorder At", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap"
                        style={{ color: "#9CA3AF", borderBottom: "1px solid #EEF3FB" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      item={item}
                      isEditing={editingId === item.id}
                      editValues={editValues}
                      saving={saving}
                      isFirst={idx === 0}
                      maxQty={maxQty}
                      onEdit={() => startEdit(item)}
                      onSave={() => saveEdit(item)}
                      onCancel={() => setEditingId(null)}
                      onEditChange={(f, v) => setEditValues((p) => ({ ...p, [f]: v }))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        </div>{/* end min-height body */}
      </div>
    </div>
  );
}

// ── Category filter pill ───────────────────────────────────────────────────────
function CategoryPill({
  label, value, active, count, onClick,
}: {
  label: string; value: string; active: boolean; count: number; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
      style={{
        background:  active ? "#4A638D" : hovered ? "#E8EEFA" : "#F0F5FB",
        color:       active ? "#fff"    : hovered ? "#4A638D" : "#6B7280",
        border:      `1px solid ${active ? "#4A638D" : hovered ? "#C8D8EE" : "#E2EBF5"}`,
        cursor:      "pointer",
        transition:  "background 150ms ease, color 150ms ease, border-color 150ms ease",
      }}
    >
      {label}
      <span
        className="text-[10px] px-1 py-0.5 rounded-full font-bold leading-none"
        style={{
          background: active ? "rgba(255,255,255,0.25)" : "#E2EBF5",
          color:      active ? "#fff" : "#4A638D",
          minWidth: 16,
          textAlign: "center",
        }}
      >
        {count}
      </span>
    </button>
  );
}

