"use client";

import { useState } from "react";

export interface MaintenanceItem {
  id:          string;
  studioId:    string;
  reportedAt:  string;
  category:    string;
  equipment:   string | null;
  description: string;
  priority:    string;
  status:      string;
  resolvedAt:  string | null;
  notes:       string | null;
}

const PRIORITY = {
  urgent: { dot: "#DC2626", label: "Urgent",  labelBg: "#FEE2E2", labelColor: "#B91C1C" },
  medium: { dot: "#D97706", label: "Medium",  labelBg: "#FEF3C7", labelColor: "#B45309" },
  low:    { dot: "#4A638D", label: "Low",     labelBg: "#EEF3FB", labelColor: "#4A638D" },
};

const PRIORITY_ORDER = { urgent: 0, medium: 1, low: 2 };

const CATEGORIES = ["reformer", "straps", "springs", "mirror", "sound", "facility"];

interface Props {
  studioId: string;
  items:    MaintenanceItem[];
}

export function MaintenanceFeed({ studioId, items: initial }: Props) {
  const [items, setItems] = useState<MaintenanceItem[]>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    category: "reformer", equipment: "", description: "", priority: "medium",
  });

  const open     = [...items.filter(i => i.status === "open")]
    .sort((a, b) => (PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 3) - (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 3));
  const resolved = items.filter(i => i.status === "resolved")
    .sort((a, b) => new Date(b.resolvedAt ?? 0).getTime() - new Date(a.resolvedAt ?? 0).getTime());

  async function handleResolve(item: MaintenanceItem) {
    setResolvingId(item.id);
    try {
      const res = await fetch(`/api/maintenance/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => prev.map(i => i.id === item.id ? updated : i));
        setExpandedId(null);
      }
    } finally {
      setResolvingId(null);
    }
  }

  async function handleReopen(item: MaintenanceItem) {
    setResolvingId(item.id);
    try {
      const res = await fetch(`/api/maintenance/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      }
    } finally {
      setResolvingId(null);
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/studios/${studioId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newItem = await res.json();
        setItems(prev => [newItem, ...prev]);
        setForm({ category: "reformer", equipment: "", description: "", priority: "medium" });
        setShowForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {open.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}>
              {open.length} open
            </span>
          )}
          {open.length === 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#D1FAE5", color: "#065F46" }}>
              All clear
            </span>
          )}
        </div>
        <button
          onClick={() => { setShowForm(f => !f); setExpandedId(null); }}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 active:scale-[0.97] cursor-pointer"
          style={{ background: "#4A638D", color: "#fff" }}
        >
          {showForm ? "Cancel" : "+ Log Issue"}
        </button>
      </div>

      {/* Add-issue form */}
      {showForm && (
        <form
          onSubmit={handleAddItem}
          className="rounded-xl border p-4 flex flex-col gap-3"
          style={{ background: "#F8FAFD", borderColor: "#C8D8EE" }}
        >
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>New Issue</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#9CA3AF" }}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="text-xs rounded-lg border px-2.5 py-2 outline-none"
                style={{ borderColor: "#C8D8EE", background: "#fff", color: "#1F2937", cursor: "pointer" }}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#9CA3AF" }}>Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="text-xs rounded-lg border px-2.5 py-2 outline-none"
                style={{ borderColor: "#C8D8EE", background: "#fff", color: "#1F2937", cursor: "pointer" }}
              >
                <option value="urgent">Urgent</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#9CA3AF" }}>Equipment <span style={{ color: "#C8D8EE" }}>(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Reformer #4, Mirror – East Wall"
              value={form.equipment}
              onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
              className="text-xs rounded-lg border px-2.5 py-2 outline-none"
              style={{ borderColor: "#C8D8EE", background: "#fff", color: "#1F2937" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "#9CA3AF" }}>Description <span style={{ color: "#DC2626" }}>*</span></label>
            <textarea
              rows={2}
              placeholder="Describe the issue…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="text-xs rounded-lg border px-2.5 py-2 outline-none resize-none"
              style={{ borderColor: "#C8D8EE", background: "#fff", color: "#1F2937" }}
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !form.description.trim()}
            className="text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-all hover:opacity-80 active:scale-[0.98] cursor-pointer"
            style={{ background: "#4A638D", color: "#fff" }}
          >
            {submitting ? "Logging…" : "Log Issue"}
          </button>
        </form>
      )}

      {/* Open items */}
      {open.length === 0 && !showForm && (
        <div className="rounded-xl border px-4 py-8 text-center" style={{ borderColor: "#C8D8EE", background: "#F8FAFD" }}>
          <p className="text-sm mb-0.5" style={{ color: "#6B7280" }}>No open maintenance issues</p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Log an issue above if anything needs attention</p>
        </div>
      )}

      {open.map((item) => {
        const pc = PRIORITY[item.priority as keyof typeof PRIORITY] ?? PRIORITY.medium;
        const isExpanded = expandedId === item.id;
        const isResolving = resolvingId === item.id;
        const date = new Date(item.reportedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

        return (
          <div
            key={item.id}
            onClick={() => setExpandedId(isExpanded ? null : item.id)}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="rounded-xl border cursor-pointer"
            style={{
              background: "#F8FAFD",
              borderColor: isExpanded ? pc.dot : hoveredId === item.id ? "#4A638D" : "#C8D8EE",
              boxShadow: isExpanded ? "0 4px 16px rgba(0,0,0,0.08)" : hoveredId === item.id ? "0 6px 20px rgba(74,99,141,0.15)" : "none",
              transform: !isExpanded && hoveredId === item.id ? "translateY(-2px)" : "translateY(0)",
              transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
            }}
          >
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pc.dot }} />
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded"
                    style={{ background: pc.labelBg, color: pc.labelColor }}>
                    {pc.label}
                  </span>
                  <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded"
                    style={{ background: "#4A638D", color: "#fff" }}>
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{date}</span>
                  <svg width="10" height="10" viewBox="0 0 10 6" fill="none" aria-hidden="true"
                    style={{
                      color: "#9CA3AF",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      flexShrink: 0,
                    }}
                  >
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {item.equipment && (
                <p className="text-xs font-semibold mb-1" style={{ color: "#1F2937" }}>{item.equipment}</p>
              )}
              <p className="text-[11px] leading-relaxed"
                style={{
                  color: "#6B7280",
                  display: "-webkit-box",
                  WebkitLineClamp: isExpanded ? "unset" : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: isExpanded ? "visible" : "hidden",
                } as React.CSSProperties}
              >
                {item.description}
              </p>
              {item.notes && isExpanded && (
                <p className="text-[10px] mt-1.5 italic" style={{ color: "#9CA3AF" }}>Note: {item.notes}</p>
              )}
            </div>

            {/* Expandable resolve action */}
            <div style={{
              display: "grid",
              gridTemplateRows: isExpanded ? "1fr" : "0fr",
              transition: "grid-template-rows 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              <div style={{ overflow: "hidden", minHeight: 0 }}>
                <div className="px-3.5 pb-3.5">
                  <div style={{ height: 1, background: "#F3F4F6", marginBottom: 10 }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleResolve(item); }}
                    disabled={isResolving}
                    className="w-full text-xs font-semibold py-2 rounded-lg disabled:opacity-50 cursor-pointer transition-all hover:brightness-90 active:scale-[0.98]"
                    style={{ background: "#4A638D", color: "#fff" }}
                  >
                    {isResolving ? "Resolving…" : "Mark Resolved"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Resolved items toggle */}
      {resolved.length > 0 && (
        <div>
          <button
            onClick={() => setShowResolved(s => !s)}
            className="flex items-center gap-1.5 text-[11px] font-medium transition-opacity hover:opacity-70 cursor-pointer"
            style={{ color: "#9CA3AF" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 6" fill="none" aria-hidden="true"
              style={{ transform: showResolved ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {resolved.length} resolved {resolved.length === 1 ? "issue" : "issues"}
          </button>

          <div style={{
            display: "grid",
            gridTemplateRows: showResolved ? "1fr" : "0fr",
            transition: "grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div style={{ overflow: "hidden", minHeight: 0 }}>
              <div className="flex flex-col gap-2 pt-2">
                {resolved.map((item) => {
                  const pc = PRIORITY[item.priority as keyof typeof PRIORITY] ?? PRIORITY.medium;
                  const resolvedDate = item.resolvedAt
                    ? new Date(item.resolvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : null;
                  const isResolving = resolvingId === item.id;

                  return (
                    <div key={item.id} className="rounded-xl border p-3.5"
                      style={{ background: "#F8FAFD", borderColor: "#E5EBF5", opacity: 0.75 }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <circle cx="6" cy="6" r="5.5" stroke="#6B7280" strokeWidth="1"/>
                            <path d="M3.5 6l2 2 3-3" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
                            {item.equipment ?? item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {resolvedDate && (
                            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Resolved {resolvedDate}</span>
                          )}
                          <button
                            onClick={() => handleReopen(item)}
                            disabled={isResolving}
                            className="text-[10px] font-medium underline underline-offset-2 transition-opacity hover:opacity-60 disabled:opacity-40 cursor-pointer"
                            style={{ color: "#9CA3AF" }}
                          >
                            {isResolving ? "…" : "Reopen"}
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed mt-1.5" style={{ color: "#9CA3AF" }}>{item.description}</p>
                      {item.notes && (
                        <p className="text-[10px] mt-1 italic" style={{ color: "#C8D8EE" }}>Note: {item.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
