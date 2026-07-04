import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { InstructorReviewsContent } from "@/components/InstructorReviewsContent";
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
          <Link
            href="/instructors"
            className="text-sm font-medium transition-opacity hover:opacity-70 text-white"
          >
            ← Instructor IP
          </Link>
        </div>
      </header>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
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
