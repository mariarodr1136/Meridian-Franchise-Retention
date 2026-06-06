"use client";

import { useState, useMemo } from "react";
import type { InventoryItem } from "@/types";

interface Props {
  studioId: string;
  items: InventoryItem[];
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthLabel(iso: string) {
  const d = new Date(iso);
  return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
}

function StatusPill({ qty, reorder }: { qty: number; reorder: number }) {
  if (qty <= 0)          return <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#FEE2E2", color: "#991B1B" }}>Out of Stock</span>;
  if (qty < reorder)     return <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#FFFBEB", color: "#92400E" }}>Low Stock</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#166534" }}>OK</span>;
}

export function InventoryPanel({ studioId, items }: Props) {
  const months = useMemo(() => {
    const set = new Set(items.map((i) => i.month));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [localItems, setLocalItems] = useState<InventoryItem[]>(items);

  const monthItems = useMemo(
    () => localItems
      .filter((i) => i.month === selectedMonth)
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    [localItems, selectedMonth]
  );

  const lowStockCount = monthItems.filter((i) => i.closingQty < i.reorderPoint && i.closingQty >= 0).length;
  const outOfStockCount = monthItems.filter((i) => i.closingQty <= 0).length;

  function startEdit(item: InventoryItem) {
    setEditingId(item.id);
    setEditValues({
      openingQty:  String(item.openingQty),
      receivedQty: String(item.receivedQty),
      usedQty:     String(item.usedQty),
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

  const categories = useMemo(() => {
    const set = new Set(monthItems.map((i) => i.category));
    return Array.from(set).sort();
  }, [monthItems]);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
          <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Total SKUs</p>
          <p className="text-2xl font-bold" style={{ color: "#1F2937" }}>{monthItems.length}</p>
        </div>
        <div className="rounded-xl border p-5" style={{ background: outOfStockCount > 0 ? "#FEF2F2" : "#fff", borderColor: outOfStockCount > 0 ? "#FECACA" : "#C8D8EE" }}>
          <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Out of Stock</p>
          <p className="text-2xl font-bold" style={{ color: outOfStockCount > 0 ? "#DC2626" : "#1F2937" }}>{outOfStockCount}</p>
        </div>
        <div className="rounded-xl border p-5" style={{ background: lowStockCount > 0 ? "#FFFBEB" : "#fff", borderColor: lowStockCount > 0 ? "#FDE68A" : "#C8D8EE" }}>
          <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>Low Stock</p>
          <p className="text-2xl font-bold" style={{ color: lowStockCount > 0 ? "#D97706" : "#1F2937" }}>{lowStockCount}</p>
        </div>
      </div>

      {/* Month selector + table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Inventory — End of Month</p>
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

        {categories.map((cat) => {
          const catItems = monthItems.filter((i) => i.category === cat);
          return (
            <div key={cat}>
              <div className="px-5 py-2" style={{ background: "#F8FAFD", borderBottom: "1px solid #EEF3FB" }}>
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>
                  {cat === "retail" ? "Retail" : cat === "supplies" ? "Supplies" : cat}
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFD" }}>
                    {["Item", "Opening", "Received", "Used / Sold", "Closing", "Reorder At", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catItems.map((item, i) => {
                    const isEditing = editingId === item.id;
                    return (
                      <tr key={item.id} style={{ borderTop: i > 0 ? "1px solid #F0F5FB" : "1px solid #EEF3FB" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "#1F2937" }}>{item.name}</td>
                        {isEditing ? (
                          <>
                            {["openingQty", "receivedQty", "usedQty"].map((f) => (
                              <td key={f} className="px-2 py-2">
                                <input
                                  type="number"
                                  value={editValues[f] ?? ""}
                                  onChange={(e) => setEditValues((p) => ({ ...p, [f]: e.target.value }))}
                                  className="w-16 text-sm rounded px-2 py-1 text-center outline-none"
                                  style={{ border: "1px solid #C8D8EE", background: "#F0F5FB" }}
                                />
                              </td>
                            ))}
                            <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: "#1F2937" }}>
                              {Math.max(0, (parseInt(editValues.openingQty) || 0) + (parseInt(editValues.receivedQty) || 0) - (parseInt(editValues.usedQty) || 0))}
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="number"
                                value={editValues.reorderPoint ?? ""}
                                onChange={(e) => setEditValues((p) => ({ ...p, reorderPoint: e.target.value }))}
                                className="w-16 text-sm rounded px-2 py-1 text-center outline-none"
                                style={{ border: "1px solid #C8D8EE", background: "#F0F5FB" }}
                              />
                            </td>
                            <td className="px-4 py-3" />
                            <td className="px-4 py-3 flex items-center gap-2">
                              <button onClick={() => saveEdit(item)} disabled={saving} className="text-xs px-3 py-1 rounded-lg font-semibold text-white" style={{ background: "#4A638D" }}>Save</button>
                              <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded-lg" style={{ color: "#6B7280" }}>✕</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 tabular-nums" style={{ color: "#374151" }}>{item.openingQty}</td>
                            <td className="px-4 py-3 tabular-nums" style={{ color: "#374151" }}>{item.receivedQty}</td>
                            <td className="px-4 py-3 tabular-nums" style={{ color: "#374151" }}>{item.usedQty}</td>
                            <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: "#1F2937" }}>{item.closingQty}</td>
                            <td className="px-4 py-3 tabular-nums text-xs" style={{ color: "#9CA3AF" }}>{item.reorderPoint}</td>
                            <td className="px-4 py-3"><StatusPill qty={item.closingQty} reorder={item.reorderPoint} /></td>
                            <td className="px-4 py-3">
                              <button onClick={() => startEdit(item)} className="text-xs px-3 py-1 rounded-lg" style={{ border: "1px solid #C8D8EE", color: "#4A638D" }}>Edit</button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
