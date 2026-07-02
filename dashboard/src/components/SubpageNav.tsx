"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/digest",      label: "Weekly Digest" },
  { href: "/pipeline",    label: "Franchise Pipeline" },
  { href: "/churn",       label: "Retention AI" },
  { href: "/compare",     label: "Benchmarking" },
  { href: "/instructors", label: "Instructor IP" },
  { href: "/hub",         label: "Knowledge Hub" },
];

const PILL = "text-[13px] font-semibold px-4 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer";

export function SubpageNav() {
  const pathname = usePathname();

  function onEnter(e: React.MouseEvent<HTMLElement>) {
    (e.currentTarget as HTMLElement).style.background = "#4A638D";
    (e.currentTarget as HTMLElement).style.color = "#fff";
  }
  function onLeave(e: React.MouseEvent<HTMLElement>, isActive: boolean) {
    (e.currentTarget as HTMLElement).style.background = isActive ? "#4A638D" : "transparent";
    (e.currentTarget as HTMLElement).style.color = isActive ? "#fff" : "#4A638D";
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left label — mirrors "Network Map" toggle on the home page */}
      <Link
        href="/"
        className="flex items-center gap-2 group cursor-pointer"
      >
        <svg
          className="w-4 h-4"
          style={{ color: "#4A638D" }}
          fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        <span
          className="text-sm font-bold tracking-widest uppercase transition-opacity group-hover:opacity-70"
          style={{ color: "#4A638D" }}
        >
          Network
        </span>
      </Link>

      {/* Nav bar + search — identical to home page */}
      <nav
        className="flex items-center gap-1 rounded-xl p-1"
        style={{ background: "#fff", border: "1.5px solid #C8D8EE" }}
      >
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={PILL}
              style={{
                color: isActive ? "#fff" : "#4A638D",
                background: isActive ? "#4A638D" : "transparent",
              }}
              onMouseEnter={onEnter}
              onMouseLeave={(e) => onLeave(e, isActive)}
            >
              {label}
            </Link>
          );
        })}

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "#C8D8EE", flexShrink: 0, margin: "0 4px" }} />

        {/* Search trigger */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("jetset:search"))}
          className={`${PILL} flex items-center gap-2`}
          style={{ color: "#4A638D" }}
          onMouseEnter={onEnter}
          onMouseLeave={(e) => onLeave(e, false)}
          aria-label="Search"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Search</span>
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: "#EEF3FB", border: "1px solid #C8D8EE", color: "#9CA3AF", lineHeight: 1.4 }}
          >
            ⌘K
          </kbd>
        </button>
      </nav>
    </div>
  );
}
