"use client";

import { useState, useMemo } from "react";
import { StudioCard } from "./StudioCard";
import type { StudioWithLatestMetric } from "@/types";

const REGION_ORDER = ["Southeast", "Northeast", "Texas", "California", "Mountain West", "Midwest", "International"];

interface Props {
  studios: StudioWithLatestMetric[];
}

export function StudioGrid({ studios }: Props) {
  const [query, setQuery]         = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return studios;
    return studios.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        (s.state ?? "").toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
    );
  }, [studios, query]);

  const byRegion = REGION_ORDER.reduce<Record<string, StudioWithLatestMetric[]>>((acc, r) => {
    const group = filtered.filter((s) => s.region === r);
    if (group.length) acc[r] = group;
    return acc;
  }, {});

  function toggleRegion(region: string) {
    setCollapsed((prev) => {
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border py-16 text-center" style={{ borderColor: "#C8D8EE", background: "#FFFFFF" }}>
          <p className="text-sm" style={{ color: "#6B7280" }}>No studios match &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        Object.entries(byRegion).map(([region, regionStudios]) => {
          const isCollapsed = collapsed.has(region);
          return (
            <div key={region} className="mb-8">
              <button
                onClick={() => toggleRegion(region)}
                className="w-full flex items-center gap-3 mb-4 group"
              >
                <h2 className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
                  {region}
                </h2>
                <div className="flex-1 border-t" style={{ borderColor: "#C8D8EE" }} />
                <span className="text-xs" style={{ color: "#6B7280" }}>
                  {regionStudios.length} {regionStudios.length === 1 ? "studio" : "studios"}
                </span>
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
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

              {!isCollapsed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
                  {regionStudios.map((studio) => (
                    <StudioCard key={studio.id} studio={studio} />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
