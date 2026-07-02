"use client";

import { useState, useMemo } from "react";
import { StudioCard } from "./StudioCard";
import type { StudioWithLatestMetric, StudioStatus } from "@/types";

const STATUS_STYLE: Record<StudioStatus, { border: string; text: string; label: string }> = {
  healthy:      { border: "border-green-500", text: "text-green-600", label: "Healthy" },
  "at-risk":    { border: "border-red-500",   text: "text-red-600",   label: "At Risk" },
  new:          { border: "border-[#4A638D]", text: "text-[#4A638D]", label: "New"     },
  "pre-launch": { border: "border-gray-400",  text: "text-gray-500",  label: "Pre-Launch" },
};

const STATE_NAMES: Record<string, string> = {
  CA: "California", CO: "Colorado",      CT: "Connecticut",
  DC: "Washington, D.C.", FL: "Florida", GA: "Georgia",
  IA: "Iowa",        IL: "Illinois",     IN: "Indiana",
  KS: "Kansas",      MA: "Massachusetts", MO: "Missouri",
  NC: "North Carolina", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York",    PA: "Pennsylvania", SC: "South Carolina",
  TN: "Tennessee",   TX: "Texas",        UT: "Utah",
  VA: "Virginia",    WA: "Washington",
};

interface Props {
  studios: StudioWithLatestMetric[];
}

export function StudioGrid({ studios }: Props) {
  const [query, setQuery]         = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(studios.map((s) => s.state ?? "Other"))
  );
  const [tab, setTab]             = useState<"open" | "coming-soon">("open");
  const [statusFilter, setStatusFilter] = useState<StudioStatus | "all">("all");
  const [hoveredTab, setHoveredTab] = useState<"open" | "coming-soon" | null>(null);

  const tabFiltered = useMemo(() =>
    studios.filter((s) => tab === "open" ? s.status !== "pre-launch" : s.status === "pre-launch"),
  [studios, tab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tabFiltered.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.state ?? "").toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
      );
    });
  }, [tabFiltered, query, statusFilter]);

  const byState = useMemo(() => {
    const map: Record<string, StudioWithLatestMetric[]> = {};
    for (const s of filtered) {
      const key = s.state ?? "Other";
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return Object.entries(map)
      .sort(([a], [b]) => (STATE_NAMES[a] ?? a).localeCompare(STATE_NAMES[b] ?? b));
  }, [filtered]);

  function toggleRegion(region: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(region) ? next.delete(region) : next.add(region);
      return next;
    });
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#4A638D" }}
            fill="none" stroke="currentColor" strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search studios by name, city, or region…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm outline-none transition-all"
            style={{ borderColor: "#C8D8EE", background: "#FFFFFF", color: "#1F2937" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4A638D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(74,99,141,0.10)"; }}
            onMouseLeave={(e) => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.borderColor = "#C8D8EE"; e.currentTarget.style.boxShadow = "none"; } }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#4A638D"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(74,99,141,0.12)"; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = "#C8D8EE"; e.currentTarget.style.boxShadow = "none"; }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full transition-opacity hover:opacity-70"
              style={{ color: "#4A638D", background: "#EEF3FB" }}
            >
              clear
            </button>
          )}
        </div>
        {query && (
          <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
            {filtered.length} {filtered.length === 1 ? "studio" : "studios"} found
          </p>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-8 mb-4">
        {(["open", "coming-soon"] as const).map((t) => {
          const label = t === "open" ? "Open Locations" : "Coming Soon";
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => { setTab(t); setStatusFilter("all"); }}
              onMouseEnter={() => setHoveredTab(t)}
              onMouseLeave={() => setHoveredTab(null)}
              className="pb-2 text-sm font-bold tracking-widest uppercase cursor-pointer"
              style={{
                fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
                color: active ? "#4A638D" : hoveredTab === t ? "#4A638D" : "#9CA3AF",
                borderBottom: active ? "2px solid #4A638D" : hoveredTab === t ? "2px solid #C8D8EE" : "2px solid #E5E7EB",
                transform: !active && hoveredTab === t ? "translateY(-1px)" : "translateY(0)",
                transition: "color 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {([
          { value: "all",      label: "All" },
          { value: "healthy",  label: "Healthy" },
          { value: "at-risk",  label: "At Risk" },
          { value: "new",      label: "New" },
        ] as { value: StudioStatus | "all"; label: string }[]).map(({ value, label }) => {
          const active = statusFilter === value && tab === "open";
          const disabled = tab === "coming-soon";
          return (
            <button
              key={value}
              onClick={() => { if (!disabled) setStatusFilter(value); }}
              className="text-xs font-medium px-3 py-1 rounded-full border transition-all"
              style={{
                background:  disabled ? "#F3F4F6" : active ? "#4A638D" : "#FFFFFF",
                color:       disabled ? "#D1D5DB" : active ? "#FFFFFF" : "#4A638D",
                borderColor: disabled ? "#E5E7EB" : active ? "#4A638D" : "#C8D8EE",
                cursor:      disabled ? "default" : "pointer",
              }}
              onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.boxShadow = "0 0 0 2px #4A638D"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              {label}
              <span className="ml-1.5 opacity-60">
                {value === "all"
                  ? tabFiltered.length
                  : tabFiltered.filter((s) => s.status === value).length}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border py-16 text-center" style={{ borderColor: "#C8D8EE", background: "#FFFFFF" }}>
          <p className="text-sm" style={{ color: "#6B7280" }}>No studios match &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        byState.map(([stateCode, stateStudios]) => {
          const stateName = STATE_NAMES[stateCode] ?? stateCode;
          const isCollapsed = !expanded.has(stateCode);
          const statusCounts = (["healthy", "at-risk", "new", "pre-launch"] as StudioStatus[])
            .map((s) => ({ status: s, count: stateStudios.filter((st) => st.status === s).length }))
            .filter((s) => s.count > 0);
          return (
            <div key={stateCode} className="mb-8">
              <button
                onClick={() => toggleRegion(stateCode)}
                className="w-full flex items-center gap-3 mb-4 group cursor-pointer"
              >
                <h2
                  className="text-2xl font-bold tracking-wide uppercase"
                  style={{ color: "#4A638D", fontFamily: "var(--font-montserrat), Montserrat, sans-serif" }}
                >
                  {stateName}
                </h2>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {statusCounts.map(({ status, count }) => {
                    const s = STATUS_STYLE[status];
                    return (
                      <span key={status} className={`text-xs rounded-2xl px-3 py-1 border-2 bg-white font-medium ${s.border} ${s.text}`}>
                        {count} {STATUS_STYLE[status].label}
                      </span>
                    );
                  })}
                </div>
                <div className="flex-1 border-t" style={{ borderColor: "#C8D8EE" }} />
                <svg
                  className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
                  style={{
                    color: "#4A638D",
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  }}
                  fill="none" stroke="currentColor" strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <div style={{
                display: "grid",
                gridTemplateRows: isCollapsed ? "0fr" : "1fr",
                transition: "grid-template-rows 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
              }}>
                <div style={{ overflow: "hidden", minHeight: 0 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
                    {stateStudios.map((studio) => (
                      <StudioCard key={studio.id} studio={studio} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
