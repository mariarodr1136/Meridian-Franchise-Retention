import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import HubContent from "./HubContent";
import { SubpageNav } from "@/components/SubpageNav";

async function getNetworkData() {
  const [studios, anomalies] = await Promise.all([
    db.studio.findMany({
      include: {
        metrics: { orderBy: { weekOf: "desc" }, take: 2 },
      },
      orderBy: [{ region: "asc" }, { name: "asc" }],
    }),
    db.anomaly.findMany({
      where: { resolved: false },
      include: { studio: { select: { name: true, city: true } } },
      orderBy: { generatedAt: "desc" },
    }),
  ]);
  return { studios, anomalies };
}

function delta(current: number, prev: number): { pct: number; dir: "up" | "down" | "flat" } | null {
  if (!prev) return null;
  const pct = ((current - prev) / prev) * 100;
  return { pct: Math.abs(pct), dir: pct > 0.4 ? "up" : pct < -0.4 ? "down" : "flat" };
}

function NetworkStat({ label, value, sub, wow }: {
  label: string; value: string; sub?: string;
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

export default async function HubPage() {
  const { studios, anomalies } = await getNetworkData();

  const openStudios = studios.filter((s) => s.status !== "pre-launch");
  const atRiskCount = studios.filter((s) => s.status === "at-risk").length;
  const totalMembers = openStudios.reduce((sum, s) => sum + (s.metrics[0]?.activeMemberships ?? 0), 0);
  const prevMembers  = openStudios.reduce((sum, s) => sum + (s.metrics[1]?.activeMemberships ?? 0), 0);
  const avgOccupancy = openStudios.length
    ? openStudios.reduce((sum, s) => sum + (s.metrics[0]?.classFillRate ?? 0), 0) / openStudios.length
    : 0;
  const prevOccupancy = openStudios.length
    ? openStudios.reduce((sum, s) => sum + (s.metrics[1]?.classFillRate ?? 0), 0) / openStudios.length
    : 0;
  const totalRevenue = openStudios.reduce((sum, s) => sum + (s.metrics[0]?.weeklyRevenue ?? 0), 0);
  const prevRevenue  = openStudios.reduce((sum, s) => sum + (s.metrics[1]?.weeklyRevenue ?? 0), 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F5FB" }}>

      {/* Hero + stat bar — same structure as main page */}
      <div className="relative overflow-hidden" style={{ width: "100vw", height: "280px" }}>
        <video
          src="/jetset-banner.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div className="absolute inset-0" style={{ background: "rgba(15,28,52,0.42)" }} />

        {/* Knowledge Hub title */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: "88px" }}>
          <h1
            className="text-white uppercase"
            style={{
              fontFamily: "var(--font-montserrat), Montserrat, sans-serif",
              fontSize: "58.64px",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            Knowledge Hub
          </h1>
        </div>

        {/* Stat bar — absolute at top, same as main page */}
        <div className="absolute top-0 left-0 right-0" style={{ background: "#4A638D" }}>
          <div className="max-w-[1400px] mx-auto px-6 flex items-center">
            {/* Logo */}
            <div className="flex-none">
              <Image
                src="/jetset-logo-transparent.png"
                alt="JetSet Modern Pilates"
                width={130}
                height={68}
                priority
                className="object-contain"
              />
            </div>

            {/* Stats centered */}
            <div className="flex flex-1 items-center justify-center">
              {[
                { label: "Total Studios",     value: String(studios.length), sub: `${openStudios.length} open`, wow: null },
                { label: "Active Members",    value: formatNumber(totalMembers), wow: delta(totalMembers, prevMembers) },
                { label: "Network Occupancy", value: formatPercent(avgOccupancy), wow: delta(avgOccupancy, prevOccupancy) },
                { label: "Weekly Revenue",    value: formatCurrency(totalRevenue), wow: delta(totalRevenue, prevRevenue) },
                { label: "At-Risk Studios",   value: String(atRiskCount), wow: null },
                { label: "Open Anomalies",    value: String(anomalies.length), wow: null },
              ].map((stat, i, arr) => (
                <div key={stat.label} className="flex items-center">
                  <NetworkStat label={stat.label} value={stat.value} sub={stat.sub} wow={stat.wow} />
                  {i < arr.length - 1 && (
                    <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>

            {/* Right: back to network */}
            <div className="flex-none flex justify-end" style={{ width: 160 }}>
              <Link
                href="/"
                className="flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all hover:brightness-95"
                style={{ background: "#F0F5FB", color: "#4A638D", border: "1.5px solid #4A638D" }}
              >
                ← Network
              </Link>
            </div>
          </div>
        </div>
      </div>
      <SubpageNav />

      {/* Body */}
      <HubContent />
    </div>
  );
}
