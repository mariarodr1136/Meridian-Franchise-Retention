"use client";

import { useState, useRef, useEffect } from "react";
import type { MaintenanceItem } from "./MaintenanceFeed";

interface DropdownOption { value: string; label: string; }

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = !!value;
  const displayLabel = value ? options.find((o) => o.value === value)?.label ?? label : label;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer"
        style={{
          background:  active ? "#4A638D" : "#fff",
          color:       active ? "#fff"    : "#6B7280",
          border:      `1px solid ${active ? "#4A638D" : "#C8D8EE"}`,
        }}
      >
        {displayLabel}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }}>
          <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 rounded-xl overflow-hidden z-20"
          style={{
            background:  "#fff",
            border:      "1px solid #C8D8EE",
            boxShadow:   "0 8px 24px rgba(74,99,141,0.14)",
            minWidth:    140,
          }}
        >
          {options.map((o) => {
            const selected = value === o.value;
            return (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="w-full text-left text-xs px-3 py-2.5 transition-colors cursor-pointer"
                style={{
                  background: selected ? "#EEF3FB" : "transparent",
                  color:      selected ? "#4A638D"  : "#6B7280",
                  fontWeight: selected ? 600 : 400,
                }}
                onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "#F0F5FB"; }}
                onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const PRIORITY = {
  urgent: { dot: "#DC2626", label: "Urgent",  labelBg: "#FEE2E2", labelColor: "#B91C1C" },
  medium: { dot: "#D97706", label: "Medium",  labelBg: "#FEF3C7", labelColor: "#B45309" },
  low:    { dot: "#4A638D", label: "Low",     labelBg: "#EEF3FB", labelColor: "#4A638D" },
};

const PRIORITY_ORDER = { urgent: 0, medium: 1, low: 2 };

function applyFilters(
  items: MaintenanceItem[],
  status: string,
  priority: string,
  category: string,
): MaintenanceItem[] {
  const now = Date.now();
  const ten = 10 * 24 * 60 * 60 * 1000;
  return items.filter((i) => {
    if (status === "open"     && i.status !== "open")     return false;
    if (status === "resolved" && i.status !== "resolved") return false;
    if (status === "past10"   && now - new Date(i.reportedAt).getTime() > ten) return false;
    if (priority && i.priority !== priority) return false;
    if (category && i.category !== category) return false;
    return true;
  });
}

interface Props {
  items: MaintenanceItem[];
  studioId: string;
}

export function MaintenancePageContent({ items: initial, studioId }: Props) {
  const [items, setItems]           = useState<MaintenanceItem[]>(initial);
  const [statusFilter, setStatus]   = useState("");
  const [priorityFilter, setPriority] = useState("");
  const [categoryFilter, setCategory] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const filtered = applyFilters(items, statusFilter, priorityFilter, categoryFilter)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "open" ? -1 : 1;
      return (PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 3)
           - (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 3);
    });

  const openCount    = items.filter(i => i.status === "open").length;
  const urgentCount  = items.filter(i => i.priority === "urgent" && i.status === "open").length;
  const resolvedCount = items.filter(i => i.status === "resolved").length;

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

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-6">

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open Issues",    value: openCount,    color: openCount > 0 ? "#DC2626" : "#6B7280" },
          { label: "Urgent",         value: urgentCount,  color: urgentCount > 0 ? "#D97706" : "#6B7280" },
          { label: "Resolved",       value: resolvedCount, color: "#16A34A" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
            <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown
          label="Status"
          value={statusFilter}
          onChange={setStatus}
          options={[
            { value: "",         label: "All Status" },
            { value: "open",     label: "Open"       },
            { value: "resolved", label: "Resolved"   },
          ]}
        />
        <FilterDropdown
          label="Priority"
          value={priorityFilter}
          onChange={setPriority}
          options={[
            { value: "",       label: "Priority" },
            { value: "urgent", label: "Urgent"   },
            { value: "medium", label: "Medium"   },
            { value: "low",    label: "Low"      },
          ]}
        />
        <FilterDropdown
          label="Equipment"
          value={categoryFilter}
          onChange={setCategory}
          options={[
            { value: "",         label: "Equipment" },
            { value: "reformer", label: "Reformer"  },
            { value: "straps",   label: "Straps"    },
            { value: "springs",  label: "Springs"   },
            { value: "mirror",   label: "Mirror"    },
            { value: "sound",    label: "Sound"     },
            { value: "facility", label: "Facility"  },
          ]}
        />
        {(statusFilter || priorityFilter || categoryFilter) && (
          <button
            onClick={() => { setStatus(""); setPriority(""); setCategory(""); }}
            className="text-xs font-medium transition-opacity hover:opacity-60 cursor-pointer"
            style={{ color: "#9CA3AF" }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Items list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border px-4 py-12 text-center" style={{ borderColor: "#C8D8EE", background: "#fff" }}>
          <p className="text-sm font-medium mb-1" style={{ color: "#1F2937" }}>No issues match this filter</p>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>Try a different filter or log a new issue from the studio overview.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const pc = PRIORITY[item.priority as keyof typeof PRIORITY] ?? PRIORITY.medium;
            const isExpanded  = expandedId === item.id;
            const isResolving = resolvingId === item.id;
            const isResolved  = item.status === "resolved";
            const date = new Date(item.reportedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            const resolvedDate = item.resolvedAt
              ? new Date(item.resolvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : null;

            return (
              <div
                key={item.id}
                onClick={() => !isResolved && setExpandedId(isExpanded ? null : item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="rounded-xl border"
                style={{
                  background:   "#fff",
                  borderColor:  isExpanded ? pc.dot : hoveredId === item.id ? "#4A638D" : "#C8D8EE",
                  boxShadow:    isExpanded ? "0 4px 16px rgba(0,0,0,0.08)" : hoveredId === item.id ? "0 6px 20px rgba(74,99,141,0.12)" : "none",
                  transform:    !isExpanded && hoveredId === item.id ? "translateY(-1px)" : "translateY(0)",
                  transition:   "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
                  cursor:       isResolved ? "default" : "pointer",
                  opacity:      isResolved ? 0.72 : 1,
                }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isResolved ? "#9CA3AF" : pc.dot }} />
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded"
                        style={{ background: isResolved ? "#F3F4F6" : pc.labelBg, color: isResolved ? "#9CA3AF" : pc.labelColor }}>
                        {isResolved ? "Resolved" : pc.label}
                      </span>
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded"
                        style={{ background: "#4A638D", color: "#fff" }}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {isResolved && resolvedDate && (
                        <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Resolved {resolvedDate}</span>
                      )}
                      <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Reported {date}</span>
                      {isResolved ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReopen(item); }}
                          disabled={isResolving}
                          className="text-[10px] font-medium underline underline-offset-2 transition-opacity hover:opacity-60 disabled:opacity-40 cursor-pointer"
                          style={{ color: "#9CA3AF" }}
                        >
                          {isResolving ? "…" : "Reopen"}
                        </button>
                      ) : (
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
                      )}
                    </div>
                  </div>

                  {item.equipment && (
                    <p className="text-sm font-semibold mb-1" style={{ color: "#1F2937" }}>{item.equipment}</p>
                  )}
                  <p className="text-xs leading-relaxed"
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
                    <p className="text-[11px] mt-1.5 italic" style={{ color: "#9CA3AF" }}>Note: {item.notes}</p>
                  )}
                </div>

                {/* Expandable resolve */}
                {!isResolved && (
                  <div style={{
                    display: "grid",
                    gridTemplateRows: isExpanded ? "1fr" : "0fr",
                    transition: "grid-template-rows 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}>
                    <div style={{ overflow: "hidden", minHeight: 0 }}>
                      <div className="px-4 pb-4">
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
