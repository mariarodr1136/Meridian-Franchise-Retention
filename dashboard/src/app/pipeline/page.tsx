import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { PipelineBoard } from "@/components/PipelineBoard";

async function getLeads() {
  return db.franchiseLead.findMany({ orderBy: [{ stage: "asc" }, { stageEnteredAt: "asc" }] });
}

export default async function PipelinePage() {
  const leads = await getLeads();

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
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
