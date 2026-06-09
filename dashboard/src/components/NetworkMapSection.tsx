"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { StudioWithLatestMetric } from "@/types";

const NetworkMap = dynamic(() => import("./NetworkMap").then((m) => m.NetworkMap), { ssr: false });

const NAV_LINKS = [
  { href: "/digest",   label: "Weekly Digest" },
  { href: "/pipeline", label: "Franchise Pipeline" },
  { href: "/churn",    label: "Retention AI" },
];

export function NetworkMapSection({ studios }: { studios: StudioWithLatestMetric[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {/* Collapse toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <svg
            className="w-4 h-4 transition-transform duration-200"
            style={{ color: "#4A638D", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
            fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          <span className="text-sm font-bold tracking-widest uppercase transition-opacity group-hover:opacity-70"
            style={{ color: "#4A638D" }}>
            Network Map
          </span>
        </button>

        {/* Page nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }, i) => (
            <span key={href} className="flex items-center gap-1">
              {i > 0 && <span className="text-xs" style={{ color: "#C8D8EE" }}>·</span>}
              <Link
                href={href}
                className="text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "#4A638D" }}
              >
                {label} →
              </Link>
            </span>
          ))}
        </div>
      </div>

      {open && <NetworkMap studios={studios} />}
    </div>
  );
}
