import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ReviewsPageContent } from "@/components/ReviewsPageContent";
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { StudioSidebar } from "@/components/StudioSidebar";
import type { Review, StudioStatus } from "@/types";
import { assignStaffPhotos } from "@/lib/staffPhotos";

async function getStudioWithReviews(id: string) {
  return db.studio.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      country: true,
      status: true,
      reviews:     { orderBy: { reviewDate: "desc" } },
      instructors: { where: { role: "instructor" }, orderBy: { name: "asc" } },
    },
  });
}

function computeMentions(
  reviews: Review[],
  instructors: { id: string; name: string }[]
): { id: string; name: string; avg: number; count: number }[] {
  return instructors
    .map((inst) => {
      const first = inst.name.split(" ")[0];
      if (first.length < 3) return null;
      const re = new RegExp(`\\b${first}\\b`, "i");
      const matched = reviews.filter((r) => re.test(r.body));
      if (!matched.length) return null;
      const avg = matched.reduce((s, r) => s + r.rating, 0) / matched.length;
      return { id: inst.id, name: inst.name, avg, count: matched.length };
    })
    .filter(Boolean)
    .sort((a, b) => b!.avg - a!.avg) as { id: string; name: string; avg: number; count: number }[];
}

export default async function StudioReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studio = await getStudioWithReviews(id);
  if (!studio) notFound();

  const reviews: Review[] = studio.reviews.map((r) => ({
    id: r.id,
    studioId: r.studioId,
    source: r.source as "google" | "classpass",
    author: r.author,
    rating: r.rating,
    body: r.body,
    reviewDate: r.reviewDate.toISOString(),
  }));

  const instructors = studio.instructors.map((i) => ({ id: i.id, name: i.name }));
  const mentionedInstructors = computeMentions(reviews, instructors);
  const photoMap = assignStaffPhotos(instructors.map((i) => i.name));

  const locationLine = [studio.city, studio.state, studio.country !== "US" ? studio.country : null]
    .filter(Boolean).join(", ");

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Image
            src="/jetset-logo-transparent.png"
            alt="JetSet Modern Pilates"
            width={150} height={80} priority
            className="object-contain transition-opacity hover:opacity-80"
          /></Link>
          <Link href={`/studios/${id}`} className="text-sm font-medium transition-opacity hover:opacity-70 text-white">
            ← {studio.name}
          </Link>
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
            <h1 style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", lineHeight: 1.1, marginBottom: 4, textTransform: "uppercase" }}>Reviews</h1>
            <p style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 14, color: "#fff", fontWeight: 500 }}>{studio.name} · {locationLine}</p>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Studio nav sidebar */}
          <StudioSidebar studioId={id} studioStatus={studio.status} />

          {/* Main review content */}
          <div className="flex-1 min-w-0">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border p-16 text-center" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
                <p className="text-2xl mb-2">✦</p>
                <p className="font-medium" style={{ color: "#1F2937" }}>No reviews yet</p>
                <p className="text-sm mt-1" style={{ color: "#6B7280" }}>Reviews will appear here once clients leave feedback.</p>
              </div>
            ) : (
              <ReviewsPageContent reviews={reviews} />
            )}
          </div>

          {/* Instructor sidebar */}
          <InstructorSidebar studioId={id} instructors={mentionedInstructors} photoMap={photoMap} />
        </div>
      </div>
    </div>
  );
}
