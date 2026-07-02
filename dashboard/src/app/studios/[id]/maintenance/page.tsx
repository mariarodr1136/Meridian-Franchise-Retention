import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StudioSidebar } from "@/components/StudioSidebar";
import { MaintenancePageContent } from "@/components/MaintenancePageContent";

async function getStudioWithMaintenance(id: string) {
  return db.studio.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      country: true,
      status: true,
      maintenanceItems: {
        orderBy: [{ status: "asc" }, { priority: "asc" }, { reportedAt: "desc" }],
      },
    },
  });
}

export default async function StudioMaintenancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studio = await getStudioWithMaintenance(id);
  if (!studio) notFound();

  const items = studio.maintenanceItems.map((m) => ({
    id:          m.id,
    studioId:    m.studioId,
    reportedAt:  m.reportedAt.toISOString(),
    category:    m.category,
    equipment:   m.equipment,
    description: m.description,
    priority:    m.priority,
    status:      m.status,
    resolvedAt:  m.resolvedAt?.toISOString() ?? null,
    notes:       m.notes,
  }));

  const locationLine = [studio.city, studio.state, studio.country !== "US" ? studio.country : null]
    .filter(Boolean).join(", ");

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/jetset-logo-transparent.png"
              alt="JetSet Modern Pilates"
              width={150} height={80} priority
              className="object-contain transition-opacity hover:opacity-80"
            />
          </Link>
          <Link href={`/studios/${id}`} className="text-sm font-medium transition-opacity hover:opacity-70 text-white">
            ← {studio.name}
          </Link>
        </div>
      </header>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        {/* Banner */}
        <div className="mb-8 rounded-xl overflow-hidden relative" style={{ height: 160 }}>
          <Image
            src="/jetset-banner.webp"
            alt=""
            width={1400} height={160} priority
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 78%" }}
          />
          <div className="absolute inset-0" style={{ background: "rgba(15,28,52,0.38)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <h1 style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", lineHeight: 1.1, marginBottom: 4, textTransform: "uppercase" }}>
              Maintenance Log
            </h1>
            <p style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 14, color: "#fff", fontWeight: 500 }}>
              {studio.name} · {locationLine}
            </p>
          </div>
        </div>

        <div className="flex gap-8">
          <StudioSidebar studioId={id} studioStatus={studio.status} />

          <MaintenancePageContent items={items} studioId={id} />
        </div>
      </div>
    </div>
  );
}
