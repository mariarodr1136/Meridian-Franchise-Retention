"use client";

import { useState, useEffect } from "react";
import type { NavSection } from "@/types";

interface Props {
  sections: NavSection[];
  label?: string;
}

export function StudioNav({ sections, label = "On this page" }: Props) {
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
    <div>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid #C8D8EE", background: "#fff", boxShadow: "0 1px 4px rgba(74,99,141,0.07)" }}
      >
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>
            {label}
          </p>
        </div>

        {/* Nav items */}
        <div className="px-3 py-3 flex flex-col gap-0.5">
          {sections.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => jumpTo(id)}
                className={`text-left w-full px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#EEF3FB] text-[#4A638D] font-semibold"
                    : "text-[#6B7280] font-normal hover:bg-[#EEF3FB] hover:text-[#4A638D] hover:translate-x-1"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
