"use client";

export function SearchButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("jetset:search"))}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/10 cursor-pointer"
      style={{ color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.22)" }}
      aria-label="Open search"
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="hidden sm:inline">Search</span>
      <kbd
        className="text-[9px] px-1 py-0.5 rounded font-mono"
        style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)" }}
      >
        ⌘K
      </kbd>
    </button>
  );
}
