"use client";

import { useState, useEffect } from "react";
import type { NavSection } from "@/types";

interface Props {
  sections: NavSection[];
}

export function StudioNav({ sections }: Props) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-15% 0px -75% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  return (
    <nav className="w-44 flex-shrink-0">
      <div className="sticky top-24 flex flex-col gap-0.5">
        <p className="text-[10px] font-bold tracking-widest uppercase mb-2 px-3" style={{ color: "#9CA3AF" }}>
          On this page
        </p>
        {sections.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => jumpTo(id)}
              className="text-left text-xs px-3 py-2 rounded-lg transition-all cursor-pointer"
              style={
                isActive
                  ? { background: "#EEF3FB", color: "#4A638D", fontWeight: 600, borderLeft: "2px solid #4A638D" }
                  : { color: "#6B7280", fontWeight: 500, borderLeft: "2px solid transparent" }
              }
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
