import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StudioSidebar } from "@/components/StudioSidebar";
import { StatusBadge } from "@/components/StatusBadge";
import { MembersPageContent } from "@/components/MembersPageContent";
import { generateStudioMembers } from "@/lib/members";
import type { StudioStatus } from "@/types";

async function getStudio(id: string) {
  return db.studio.findUnique({
    where: { id },
    select: {
      id: true, name: true, city: true, state: true, country: true, status: true,
      metrics: { orderBy: { weekOf: "desc" }, take: 1 },
    },
  });
}

export default async function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studio = await getStudio(id);
  if (!studio) notFound();

  const current = studio.metrics[0];
  if (!current || studio.status === "pre-launch") notFound();

  const members = generateStudioMembers({
    studioId:        studio.id,
    memberCount:     current.activeMemberships,
    weeklyChurnRate: current.weeklyChurn,
  });

  const locationLine = [studio.city, studio.state, studio.country !== "US" ? studio.country : null]
    .filter(Boolean).join(", ");

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={150} height={80} priority className="object-contain transition-opacity hover:opacity-80" />
          </Link>
          <Link href={`/studios/${id}`} className="text-sm font-medium transition-opacity hover:opacity-70 text-white">
            ← {studio.name}
          </Link>
        </div>
      </header>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8 pb-6" style={{ borderBottom: "1px solid #C8D8EE" }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: "#1F2937" }}>Members</h1>
            <StatusBadge status={studio.status as StudioStatus} />
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>{studio.name} · {locationLine}</p>
        </div>

        <div className="flex gap-8">
          <StudioSidebar studioId={id} studioStatus={studio.status} />

          <div className="flex-1 min-w-0 flex flex-col gap-6">

            <MembersPageContent members={members} studioName={studio.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
