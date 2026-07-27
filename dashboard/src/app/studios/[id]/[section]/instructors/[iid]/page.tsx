import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { InstructorReviewsContent } from "@/components/InstructorReviewsContent";
import { InstructorSidebar } from "@/components/InstructorSidebar";
import { StudioSidebar } from "@/components/StudioSidebar";
import type { Review } from "@/types";
import { assignStaffPhotos } from "@/lib/staffPhotos";

async function getData(studioId: string, iid: string) {
  const [studio, instructor] = await Promise.all([
    db.studio.findUnique({
      where: { id: studioId },
      select: {
        id: true, name: true, status: true,
        reviews: { orderBy: { reviewDate: "desc" } },
        instructors: { select: { id: true, name: true, role: true }, orderBy: { name: "asc" } },
      },
    }),
    db.instructor.findUnique({
      where: { id: iid },
      select: { id: true, name: true, studioId: true },
    }),
  ]);
  return { studio, instructor };
}

export default async function InstructorReviewsPage({
  params,
}: {
  params: Promise<{ id: string; iid: string }>;
}) {
  const { id, iid } = await params;
  const { studio, instructor } = await getData(id, iid);
  if (!studio || !instructor || instructor.studioId !== id) notFound();

  const reviews: Review[] = studio.reviews.map((r) => ({
    id: r.id,
    studioId: r.studioId,
    source: r.source as "google" | "classpass",
    author: r.author,
    rating: r.rating,
    body: r.body,
    reviewDate: r.reviewDate.toISOString(),
  }));

  const first = instructor.name.split(" ")[0];
  const re = new RegExp(`\\b${first}\\b`, "i");
  const mentionedReviews = reviews.filter((r) => re.test(r.body));

  const instructors = (studio.instructors ?? []).filter((i) => i.role === "instructor");
  const photoMap = assignStaffPhotos(instructors.map((i) => i.name));
  const photo = photoMap.get(instructor.name);

  const mentionedInstructors = instructors
    .map((inst) => {
      const fn = inst.name.split(" ")[0];
      if (fn.length < 3) return null;
      const ire = new RegExp(`\\b${fn}\\b`, "i");
      const matched = reviews.filter((r) => ire.test(r.body));
      if (!matched.length) return null;
      const avg = matched.reduce((s, r) => s + r.rating, 0) / matched.length;
      return { id: inst.id, name: inst.name, avg, count: matched.length };
    })
    .filter(Boolean)
    .sort((a, b) => b!.avg - a!.avg) as { id: string; name: string; avg: number; count: number }[];

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Image
            src="/jetset-logo-transparent.png"
            alt="JetSet Modern Pilates"
            width={150} height={80} priority
            className="object-contain transition-opacity hover:opacity-80"
          /></Link>
          <Link
            href={`/studios/${id}/reviews`}
            className="text-sm font-medium transition-opacity hover:opacity-70 text-white"
          >
            ← Reviews
          </Link>
        </div>
      </header>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          <StudioSidebar studioId={id} studioStatus={studio.status} />

          <div className="flex-1 min-w-0">
            <InstructorReviewsContent
              instructorName={instructor.name}
              studioName={studio.name}
              reviews={mentionedReviews}
              photo={photo}
            />
          </div>

          <InstructorSidebar studioId={id} instructors={mentionedInstructors} photoMap={photoMap} />
        </div>
      </div>
    </div>
  );
}
