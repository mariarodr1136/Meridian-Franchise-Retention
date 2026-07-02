import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

function delta(current: number, prev: number) {
  if (!prev) return null;
  const pct = ((current - prev) / prev) * 100;
  return { pct: Math.abs(pct), dir: pct > 0.4 ? "up" : pct < -0.4 ? "down" : "flat" } as const;
}

function NetworkStat({ label, value, sub, wow }: {
  label: string;
  value: string;
  sub?: string;
  wow?: { pct: number; dir: "up" | "down" | "flat" } | null;
}) {
  return (
    <div className="text-center px-6 py-4">
      <div className="flex items-center justify-center gap-1.5">
        <p className="text-2xl font-bold text-white whitespace-nowrap">{value}</p>
        {wow && wow.dir !== "flat" && (
          <span className="text-xs font-semibold whitespace-nowrap"
            style={{ color: wow.dir === "up" ? "#86EFAC" : "#FCA5A5" }}>
            {wow.dir === "up" ? "↑" : "↓"}{wow.pct.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs mt-0.5 whitespace-nowrap" style={{ color: "rgba(255,255,255,0.6)" }}>
        {label}{sub ? ` · ${sub}` : ""}
      </p>
    </div>
  );
}

interface Props {
  title: string;
  className?: string;
}

export async function NetworkPageHero({ title, className }: Props) {
  const studios = await db.studio.findMany({
    include: { metrics: { orderBy: { weekOf: "desc" }, take: 2 } },
  });

  const openStudios  = studios.filter((s) => s.status !== "pre-launch");
  const atRiskCount  = studios.filter((s) => s.status === "at-risk").length;
  const totalMembers = openStudios.reduce((sum, s) => sum + (s.metrics[0]?.activeMemberships ?? 0), 0);
  const prevMembers  = openStudios.reduce((sum, s) => sum + (s.metrics[1]?.activeMemberships ?? 0), 0);
  const avgOccupancy = openStudios.length
    ? openStudios.reduce((sum, s) => sum + (s.metrics[0]?.classFillRate ?? 0), 0) / openStudios.length : 0;
  const prevOccupancy = openStudios.length
    ? openStudios.reduce((sum, s) => sum + (s.metrics[1]?.classFillRate ?? 0), 0) / openStudios.length : 0;
  const totalRevenue = openStudios.reduce((sum, s) => sum + (s.metrics[0]?.weeklyRevenue ?? 0), 0);
  const prevRevenue  = openStudios.reduce((sum, s) => sum + (s.metrics[1]?.weeklyRevenue ?? 0), 0);
  const openAnomalies = await db.anomaly.count({ where: { resolved: false } });

  const stats = [
    { label: "Total Studios",     value: String(studios.length), sub: `${openStudios.length} open`, wow: null },
    { label: "Active Members",    value: formatNumber(totalMembers),   wow: delta(totalMembers, prevMembers) },
    { label: "Network Occupancy", value: formatPercent(avgOccupancy),  wow: delta(avgOccupancy, prevOccupancy) },
    { label: "Weekly Revenue",    value: formatCurrency(totalRevenue), wow: delta(totalRevenue, prevRevenue) },
    { label: "At-Risk Studios",   value: String(atRiskCount), wow: null },
    { label: "Open Anomalies",    value: String(openAnomalies), wow: null },
  ];

  return (
    <div
      className={`relative overflow-hidden${className ? ` ${className}` : ""}`}
      style={{ width: "100vw", height: "280px" }}
    >
      <video
        src="/jetset-banner.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div className="absolute inset-0" style={{ background: "rgba(15,28,52,0.42)" }} />

      {/* Page title */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: "88px" }}>
        <h1
          className="text-white uppercase text-center px-4"
          style={{
            fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
            fontSize: "clamp(28px, 5vw, 58.64px)",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Stat bar */}
      <div className="absolute top-0 left-0 right-0" style={{ background: "#4A638D" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center">
          {/* Logo → home */}
          <div className="flex-none">
            <Link href="/">
              <Image
                src="/jetset-logo-transparent.png"
                alt="JetSet Modern Pilates"
                width={130}
                height={68}
                priority
                className="object-contain transition-opacity hover:opacity-80"
              />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-1 items-center justify-center overflow-x-auto">
            <div className="flex items-center">
              {stats.map((stat, i) => (
                <div key={stat.label} className="flex items-center">
                  <NetworkStat label={stat.label} value={stat.value} sub={stat.sub} wow={stat.wow} />
                  {i < stats.length - 1 && (
                    <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right spacer — balances logo so stats center to full width */}
          <div className="flex-none" style={{ width: 130 }} />
        </div>
      </div>
    </div>
  );
}
