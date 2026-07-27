import { db } from "@/lib/db";
import { NetworkPageHero } from "@/components/NetworkPageHero";
import { PipelineBoard } from "@/components/PipelineBoard";

async function getLeads() {
  return db.franchiseLead.findMany({ orderBy: [{ stage: "asc" }, { stageEnteredAt: "asc" }] });
}

export default async function PipelinePage() {
  const leads = await getLeads();

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <NetworkPageHero title="Franchise Pipeline" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-8">
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
