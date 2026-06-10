import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SalesPageContent } from "@/components/SalesPageContent";
import { StudioSidebar } from "@/components/StudioSidebar";
import { StatusBadge } from "@/components/StatusBadge";
import type { SalesRecord, StudioStatus } from "@/types";

export default async function SalesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const studio = await db.studio.findUnique({
    where: { id },
    select: {
      id: true, name: true, city: true, state: true, country: true, status: true,
      salesRecords: { orderBy: { month: "desc" } },
    },
  });
  if (!studio) notFound();

  const records: SalesRecord[] = studio.salesRecords.map((r) => ({
    id:       r.id,
    studioId: r.studioId,
    month:    r.month.toISOString(),
    category: r.category,
    product:  r.product,
    unitsSold: r.unitsSold,
    revenue:  r.revenue,
  }));

  const locationLine = [studio.city, studio.state, studio.country !== "US" ? studio.country : null]
    .filter(Boolean).join(", ");

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={150} height={80} priority className="object-contain transition-opacity hover:opacity-80" /></Link>
          <Link href={`/studios/${id}`} className="text-sm font-medium transition-opacity hover:opacity-70 text-white">← {studio.name}</Link>
        </div>
      </header>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        <div className="mb-8 pb-6" style={{ borderBottom: "1px solid #C8D8EE" }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: "#1F2937" }}>Sales Report</h1>
            <StatusBadge status={studio.status as StudioStatus} />
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>{studio.name} · {locationLine}</p>
        </div>

        <div className="flex gap-8">
          <StudioSidebar studioId={id} studioStatus={studio.status} />
          <div className="flex-1 min-w-0">
            {records.length === 0 ? (
              <div className="rounded-2xl border p-16 text-center" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
                <p className="font-medium" style={{ color: "#1F2937" }}>No sales data yet</p>
                <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Sales records will appear once connected to MindBody.</p>
              </div>
            ) : (
              <SalesPageContent records={records} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
