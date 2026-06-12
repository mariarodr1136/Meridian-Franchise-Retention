import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { generateStudioChurn } from "@/lib/churn";
import { RetentionPageContent } from "@/components/RetentionPageContent";
import { StudioSidebar } from "@/components/StudioSidebar";
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
      <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
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

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        {/* Page header */}
        {/* Banner */}
        <div className="mb-8 rounded-xl overflow-hidden relative" style={{ height: 160 }}>
          <Image src="/jetset-banner.webp" alt="" width={1400} height={160} priority
            className="w-full h-full object-cover" style={{ objectPosition: "center 78%" }} />
          <div className="absolute inset-0" style={{ background: "rgba(15,28,52,0.38)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <h1 style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", lineHeight: 1.1, marginBottom: 4, textTransform: "uppercase" }}>Retention AI</h1>
            <p style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 14, color: "#fff", fontWeight: 500 }}>{studio.name} · {locationLine}</p>
          </div>
        </div>

        <div className="flex gap-8">
          <StudioSidebar studioId={id} studioStatus={studio.status} />
          <div className="flex-1 min-w-0">
            <RetentionPageContent data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
