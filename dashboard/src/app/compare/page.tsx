import { db } from "@/lib/db";
import { NetworkPageHero } from "@/components/NetworkPageHero";
import { CompareContent } from "./CompareContent";

async function getAllStudios() {
  return db.studio.findMany({
    where: { status: { not: "pre-launch" } },
    include: { metrics: { orderBy: { weekOf: "desc" }, take: 13 } },
    orderBy: [{ region: "asc" }, { name: "asc" }],
  });
}

export default async function ComparePage() {
  const studios = await getAllStudios();

  const studioData = studios.map((s) => ({
    id:       s.id,
    name:     s.name,
    city:     s.city,
    state:    s.state,
    status:   s.status,
    openedAt: s.openedAt?.toISOString() ?? null,
    region:   s.region,
    metrics:  s.metrics.map((m) => ({
      weekOf:            m.weekOf.toISOString(),
      weeklyRevenue:     m.weeklyRevenue,
      activeMemberships: m.activeMemberships,
      classFillRate:     m.classFillRate,
      weeklyChurn:       m.weeklyChurn,
      memberBookings:    m.memberBookings,
      classPackBookings: m.classPackBookings,
      classPassBookings: m.classPassBookings,
    })),
  }));

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <NetworkPageHero title="Studio Benchmarking" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-8">
        <CompareContent studios={studioData} />
      </div>
    </div>
  );
}
