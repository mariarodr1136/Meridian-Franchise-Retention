import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StudioSettingsForm } from "@/components/StudioSettingsForm";
import { StudioSidebar } from "@/components/StudioSidebar";
import { StatusBadge } from "@/components/StatusBadge";
import type { Instructor, StudioStatus } from "@/types";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const studio = await db.studio.findUnique({
    where: { id },
    include: {
      instructors: { orderBy: [{ role: "asc" }, { name: "asc" }] },
    },
  });
  if (!studio) notFound();

  const instructors: Instructor[] = studio.instructors.map((i) => ({
    id:                  i.id,
    studioId:            i.studioId,
    name:                i.name,
    role:                i.role as Instructor["role"],
    certificationStatus: i.certificationStatus as Instructor["certificationStatus"],
    lastEvalDate:        i.lastEvalDate?.toISOString() ?? null,
    performanceScore:    i.performanceScore,
  }));

  const studioData = {
    id:             studio.id,
    name:           studio.name,
    city:           studio.city,
    state:          studio.state,
    country:        studio.country,
    region:         studio.region,
    status:         studio.status as StudioStatus,
    openedAt:       studio.openedAt?.toISOString() ?? null,
    franchiseeName: studio.franchiseeName,
    address:        studio.address,
    phone:          studio.phone,
    email:          studio.email,
  };

  const locationLine = [studio.city, studio.state, studio.country !== "US" ? studio.country : null]
    .filter(Boolean).join(", ");

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-10 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={150} height={80} priority className="object-contain transition-opacity hover:opacity-80" /></Link>
          <Link href={`/studios/${id}`} className="text-sm font-medium transition-opacity hover:opacity-70 text-white">← {studio.name}</Link>
        </div>
      </header>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        <div className="mb-8 pb-6" style={{ borderBottom: "1px solid #C8D8EE" }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: "#1F2937" }}>Settings</h1>
            <StatusBadge status={studio.status as StudioStatus} />
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>{studio.name} · {locationLine}</p>
        </div>

        <div className="flex gap-8">
          <StudioSidebar studioId={id} studioStatus={studio.status} />
          <div className="flex-1 min-w-0">
            <StudioSettingsForm studio={studioData} instructors={instructors} />
          </div>
        </div>
      </div>
    </div>
  );
}
