import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { generateStudioChurn } from "@/lib/churn";
import { RetentionPageContent } from "@/components/RetentionPageContent";
import { StatusBadge } from "@/components/StatusBadge";
import type { StudioStatus } from "@/types";

export default async function RetentionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const studio = await db.studio.findUnique({
    where: { id },
    select: {
      id: true, name: true, city: true, state: true, country: true, status: true,
      metrics: { orderBy: { weekOf: "desc" }, take: 1 },
    },
  });
  if (!studio || studio.status === "pre-launch") notFound();

  const current = studio.metrics[0];
  const memberCount     = current?.activeMemberships ?? 50;
  const weeklyChurnRate = current?.weeklyChurn ?? 0.02;

  const data = generateStudioChurn({
    studioId:      studio.id,
    studioName:    studio.name,
    studioCity:    studio.city,
    studioStatus:  studio.status,
    memberCount,
    weeklyChurnRate,
  });

  const locationLine = [studio.city, studio.state, studio.country !== "US" ? studio.country : null]
    .filter(Boolean).join(", ");

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-10 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={150} height={80} priority
              className="object-contain transition-opacity hover:opacity-80" />
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-white">Member Retention Intelligence</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
            <Link href={`/studios/${id}`} className="text-sm font-medium transition-opacity hover:opacity-70 text-white">
              ← {studio.name}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="mb-8 pb-6" style={{ borderBottom: "1px solid #C8D8EE" }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: "#1F2937" }}>Retention AI</h1>
            <StatusBadge status={studio.status as StudioStatus} />
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>{studio.name} · {locationLine}</p>
        </div>

        <RetentionPageContent data={data} />
      </div>
    </div>
  );
}
