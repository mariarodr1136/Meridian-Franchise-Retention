import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { PipelineBoard } from "@/components/PipelineBoard";

const STAGES = ["Discovery", "Agreement Signed", "Site Selected", "Permits & Construction", "Pre-Sales"] as const;

async function getLeads() {
  return db.franchiseLead.findMany({ orderBy: [{ stage: "asc" }, { stageEnteredAt: "asc" }] });
}

export default async function PipelinePage() {
  const leads = await getLeads();

  const stalled = leads.filter((l) => {
    const days = Math.floor((Date.now() - new Date(l.stageEnteredAt).getTime()) / 86_400_000);
    return days > 14 && l.stage !== "Launched";
  }).length;

  const byStage = Object.fromEntries(
    STAGES.map((s) => [s, leads.filter((l) => l.stage === s)])
  ) as Record<(typeof STAGES)[number], typeof leads>;

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-10 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={130} height={68} priority className="object-contain" />
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-white">Franchise Pipeline</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
            <Link href="/" className="text-sm font-medium text-white transition-opacity hover:opacity-70">← Network</Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Summary row */}
        <div className="flex items-center gap-6 mb-8">
          {[
            { label: "Total in Pipeline", value: leads.length, color: "#4A638D" },
            ...STAGES.map((s) => ({ label: s, value: byStage[s].length, color: "#4A638D" })),
            { label: "Stalled >14 days", value: stalled, color: stalled > 0 ? "#EA580C" : "#16A34A" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border px-5 py-3 text-center flex-1 min-w-0" style={{ background: "#FFFFFF", borderColor: "#C8D8EE" }}>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Kanban board */}
        <PipelineBoard leads={leads.map((l) => ({
          id: l.id,
          franchiseeName: l.franchiseeName,
          market: l.market,
          state: l.state ?? "",
          stage: l.stage,
          stageEnteredAt: l.stageEnteredAt.toISOString(),
          expectedOpenDate: l.expectedOpenDate?.toISOString() ?? null,
          territoryType: l.territoryType,
          notes: l.notes ?? null,
          docsComplete: l.docsComplete,
          leaseComplete: l.leaseComplete,
          trainingBooked: l.trainingBooked,
          assignedTo: l.assignedTo,
        }))} />
      </div>
    </div>
  );
}
