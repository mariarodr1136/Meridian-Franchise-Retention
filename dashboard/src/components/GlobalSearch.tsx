"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/fts";

const TYPE_CONFIG = {
  studio:     { label: "Studio",     color: "#4A638D", bg: "#EEF3FB" },
  review:     { label: "Review",     color: "#7B5EA7", bg: "#F3EEF9" },
  instructor: { label: "Instructor", color: "#0F766E", bg: "#CCFBF1" },
};

function getHref(r: SearchResult): string {
  if (r.type === "studio")     return `/studios/${r.entityId}`;
  if (r.type === "review")     return `/studios/${r.studioId}/reviews`;
  if (r.type === "instructor") return `/studios/${r.studioId}/settings`;
  return "/";
}

export function GlobalSearch() {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [cursor, setCursor]   = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef   = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json() as SearchResult[];
        setResults(data);
        setCursor(0);
      } finally {
        setLoading(false);
      }
    }, 140);
  }, []);

  function handleQuery(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    search(e.target.value);
  }

  function navigate(r: SearchResult) {
    router.push(getHref(r));
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) navigate(results[cursor]);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[580px] rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)",
          animation: "searchEnter 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#E4EDF8" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: "#9CA3AF", flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleQuery}
            onKeyDown={onKeyDown}
            placeholder="Search studios, reviews, instructors…"
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            style={{ color: "#1F2937" }}
          />
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
              style={{ borderColor: "#4A638D", borderTopColor: "transparent" }} />
          )}
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
            style={{ background: "#F1F5F9", color: "#9CA3AF", border: "1px solid #E2E8F0" }}>
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="py-2 max-h-80 overflow-y-auto">
            {results.map((r, i) => {
              const tc = TYPE_CONFIG[r.type];
              const isActive = i === cursor;
              return (
                <li
                  key={`${r.type}-${r.entityId}`}
                  onClick={() => navigate(r)}
                  onMouseEnter={() => setCursor(i)}
                  className="flex items-center gap-3 px-5 py-2.5 cursor-pointer"
                  style={{ background: isActive ? "#F0F5FB" : "transparent" }}
                >
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: tc.bg, color: tc.color }}
                  >
                    {tc.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#1F2937" }}>{r.title}</p>
                    {r.body && (
                      <p className="text-xs truncate mt-0.5" style={{ color: "#9CA3AF" }}>{r.body.slice(0, 80)}</p>
                    )}
                  </div>
                  {isActive && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "#9CA3AF", flexShrink: 0 }}>
                      <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        ) : query.length >= 2 && !loading ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "#9CA3AF" }}>No results for &ldquo;{query}&rdquo;</p>
          </div>
        ) : query.length === 0 ? (
          <div className="px-5 py-5">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#9CA3AF" }}>Search across</p>
            <div className="flex gap-2 flex-wrap">
              {(["Studios", "Reviews", "Instructors"] as const).map((label) => (
                <span key={label} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#F0F5FB", color: "#4A638D" }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Footer hint */}
        <div className="px-5 py-2.5 border-t flex items-center gap-4" style={{ borderColor: "#E4EDF8", background: "#FAFBFD" }}>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#9CA3AF" }}>
            <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}>↑↓</kbd>
            navigate
          </div>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "#9CA3AF" }}>
            <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: "#F1F5F9", border: "1px solid #E2E8F0" }}>↵</kbd>
            open
          </div>
          <div className="ml-auto text-[10px]" style={{ color: "#C8D8EE" }}>SQLite FTS5</div>
        </div>
      </div>

      <style>{`
        @keyframes searchEnter {
          from { opacity: 0; transform: scale(0.96) translateY(-6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
