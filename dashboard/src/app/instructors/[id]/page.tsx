import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { InstructorReviewsContent } from "@/components/InstructorReviewsContent";
import { NetworkPageHero } from "@/components/NetworkPageHero";
import { BackButton } from "@/components/BackButton";
import type { Review } from "@/types";
import { assignStaffPhotos } from "@/lib/staffPhotos";

async function getMergedInstructor(id: string) {
  const self = await db.instructor.findUnique({
    where: { id },
    select: { id: true, role: true, personKey: true },
  });
  if (!self || self.role !== "instructor") return null;

  const siblings = await db.instructor.findMany({
    where: self.personKey ? { personKey: self.personKey } : { id: self.id },
    include: { studio: { select: { id: true, name: true, city: true, state: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!siblings.length) return null;

  const reviews = await db.review.findMany({
    where: { instructorId: { in: siblings.map((s) => s.id) } },
    orderBy: { reviewDate: "desc" },
  });

  return { siblings, reviews };
}

export default async function NetworkInstructorReviewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getMergedInstructor(id);
  if (!data) notFound();
  const { siblings, reviews } = data;

  const canonical = siblings[0];

  const studioNameById: Record<string, string> = {};
  for (const s of siblings) studioNameById[s.studioId] = s.studio.name;

  const reviewsMapped: Review[] = reviews.map((r) => ({
    id: r.id,
    studioId: r.studioId,
    source: r.source as "google" | "classpass",
    author: r.author,
    rating: r.rating,
    body: r.body,
    reviewDate: r.reviewDate.toISOString(),
  }));

  const photoMap = assignStaffPhotos([canonical.name]);
  const photo = photoMap.get(canonical.name);
  const studioLabel = siblings.map((s) => s.studio.name).join(" · ");

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <NetworkPageHero title="Instructor IP Roster" />

      <div className="max-w-[1340px] mx-auto px-6 pt-4 pb-8">
        <BackButton fallbackHref="/instructors" label="← All Instructors" />
        <InstructorReviewsContent
          instructorName={canonical.name}
          studioName={studioLabel}
          reviews={reviewsMapped}
          photo={photo}
          studioNameById={studioNameById}
        />
      </div>
    </div>
  );
}
