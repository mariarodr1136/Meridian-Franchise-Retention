"use client";

import { useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { Review } from "@/types";

interface MonthBucket {
  label: string;
  avgRating: number;
  count: number;
  positive: number;
}

function bucketByMonth(reviews: Review[]): MonthBucket[] {
  const map = new Map<string, Review[]>();
  for (const r of reviews) {
    const d = new Date(r.reviewDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, revs]) => {
      const [yr, mo] = key.split("-");
      const label = new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
      return {
        label,
        avgRating: Math.round(avg * 10) / 10,
        count: revs.length,
        positive: revs.filter((r) => r.rating >= 4).length,
      };
    });
}

function barColor(avg: number) {
  if (avg >= 4.5) return "#16a34a";
  if (avg >= 4.0) return "#4A638D";
  if (avg >= 3.5) return "#C9A84C";
  return "#EA580C";
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: MonthBucket }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const posPct = d.count > 0 ? Math.round((d.positive / d.count) * 100) : 0;
  return (
    <div className="rounded-xl border px-3.5 py-2.5 text-xs shadow-lg"
      style={{ background: "#fff", borderColor: "#C8D8EE", minWidth: 140, pointerEvents: "none" }}>
      <p className="font-bold mb-1" style={{ fontSize: 15, color: "#1F2937" }}>{d.avgRating.toFixed(1)} ★</p>
      <p style={{ color: "#6B7280" }}>{d.count} review{d.count !== 1 ? "s" : ""}</p>
      <p style={{ color: "#16a34a" }}>{posPct}% positive</p>
    </div>
  );
}

interface Props {
  reviews: Review[];
}

export function SentimentTrendChart({ reviews }: Props) {
  const data = useMemo(() => bucketByMonth(reviews), [reviews]);

  if (data.length < 2) return null;

  const overall = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const positivePct = Math.round((positive / reviews.length) * 100);

  return (
    <div className="rounded-xl border mb-6" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
              Rating Trend
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              {reviews.length} reviews · {data.length} months
            </p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xl font-bold" style={{ color: "#1F2937" }}>{overall.toFixed(1)}</p>
              <p className="text-[10px]" style={{ color: "#9CA3AF" }}>overall avg</p>
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "#16a34a" }}>{positivePct}%</p>
              <p className="text-[10px]" style={{ color: "#9CA3AF" }}>positive</p>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EFF8" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              interval={data.length > 8 ? Math.floor(data.length / 6) : 0}
            />
            <YAxis
              yAxisId="left"
              domain={[0, 5]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              tickCount={6}
              width={24}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 9, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(74,99,141,0.04)" }} />
            <Bar yAxisId="right" dataKey="count" fill="#EEF3FB" radius={[3, 3, 0, 0]} name="Reviews" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avgRating"
              stroke="#C9A84C"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props as { cx: number; cy: number; payload: MonthBucket };
                return (
                  <circle
                    key={payload.label}
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={barColor(payload.avgRating)}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                );
              }}
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
              name="Avg Rating"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Star rating reference */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {[
            { label: "4.5+ ★", color: "#16a34a" },
            { label: "4.0–4.4 ★", color: "#4A638D" },
            { label: "3.5–3.9 ★", color: "#C9A84C" },
            { label: "< 3.5 ★", color: "#EA580C" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-4 h-2 rounded" style={{ background: "#EEF3FB", border: "1px solid #C8D8EE" }} />
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>review count</span>
          </div>
        </div>
      </div>
    </div>
  );
}
