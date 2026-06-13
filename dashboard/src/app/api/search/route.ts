import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ftsSearch, ftsCount, buildSearchIndex } from "@/lib/fts";

async function ensureIndex() {
  if (ftsCount() > 0) return;
  const [studios, reviews, instructors] = await Promise.all([
    db.studio.findMany({ select: { id: true, name: true, city: true, state: true, region: true, franchiseeName: true } }),
    db.review.findMany({ select: { id: true, studioId: true, author: true, source: true, body: true } }),
    db.instructor.findMany({ select: { id: true, studioId: true, name: true, role: true } }),
  ]);
  buildSearchIndex({ studios, reviews, instructors });
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return Response.json([]);

  await ensureIndex();
  const results = ftsSearch(q);
  return Response.json(results);
}

// POST rebuilds the full index (call after seeding)
export async function POST() {
  const [studios, reviews, instructors] = await Promise.all([
    db.studio.findMany({ select: { id: true, name: true, city: true, state: true, region: true, franchiseeName: true } }),
    db.review.findMany({ select: { id: true, studioId: true, author: true, source: true, body: true } }),
    db.instructor.findMany({ select: { id: true, studioId: true, name: true, role: true } }),
  ]);
  const count = buildSearchIndex({ studios, reviews, instructors });
  return Response.json({ indexed: count });
}
