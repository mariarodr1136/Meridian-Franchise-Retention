import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { InstructorReviewsContent } from "@/components/InstructorReviewsContent";
import type { Review } from "@/types";

async function getData(studioId: string, iid: string) {
  const [studio, instructor] = await Promise.all([
    db.studio.findUnique({
      where: { id: studioId },
      select: { id: true, name: true, reviews: { orderBy: { reviewDate: "desc" } } },
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

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-10 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
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

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <InstructorReviewsContent
          instructorName={instructor.name}
          studioName={studio.name}
          reviews={mentionedReviews}
        />
      </div>
    </div>
  );
}
