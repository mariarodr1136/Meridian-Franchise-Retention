"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Detail {
  label: string;
  value: string;
}

interface MetricBubbleProps {
  label: string;
  value: string;
  trend: "up" | "down" | "flat";
  trendStr?: string;
  reverse?: boolean;
  description: string;
  details: Detail[];
  compact?: boolean;
}

export function MetricBubble({ label, value, trend, trendStr, reverse, description, details, compact }: MetricBubbleProps) {
  const [hovered, setHovered] = useState(false);

  const trendColor =
    trend === "flat"
      ? "text-neutral-400"
      : (trend === "up" && !reverse) || (trend === "down" && reverse)
      ? "text-green-600"
      : "text-orange-500";

  return (
    <div
      className={`rounded-xl border relative cursor-default select-none h-full ${compact ? "p-3" : "p-5"}`}
      style={{
        background: "#fff",
        borderColor: hovered ? "#4A638D" : "#C8D8EE",
        boxShadow: hovered ? "0 8px 24px rgba(74,99,141,0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className={compact ? "text-[10px] mb-1" : "text-xs mb-2"} style={{ color: "#9CA3AF" }}>{label}</p>
      <p className={compact ? "text-lg font-bold" : "text-2xl font-bold"} style={{ color: "#1F2937" }}>{value}</p>
      {trendStr && (
        <p className={cn(compact ? "text-[10px] mt-1" : "text-xs mt-1.5", "font-medium", trendColor)}>
          {trendStr} WoW
        </p>
      )}

      {/* Hover popup */}
      <div
        className="absolute left-0 right-0 bottom-full mb-2 rounded-xl border p-4 z-50"
        style={{
          background: "#fff",
          borderColor: "#4A638D",
          boxShadow: "0 8px 28px rgba(74,99,141,0.18)",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(4px)",
          pointerEvents: hovered ? "auto" : "none",
          transition: "opacity 150ms ease, transform 150ms ease",
        }}
      >
        <p className="text-xs mb-3" style={{ color: "#4A638D" }}>{description}</p>
        <div className="flex flex-col gap-0">
          {details.map(({ label: dl, value: dv }) => (
            <div
              key={dl}
              className="flex justify-between items-center py-1.5"
              style={{ borderBottom: "1px solid #F0F5FB" }}
            >
              <span className="text-xs" style={{ color: "#9CA3AF" }}>{dl}</span>
              <span className="text-xs font-semibold" style={{ color: "#1F2937" }}>{dv}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
