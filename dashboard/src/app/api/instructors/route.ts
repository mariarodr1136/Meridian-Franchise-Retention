import { db } from "@/lib/db";

export async function GET() {
  const instructors = await db.instructor.findMany({
    include: {
      studio: { select: { id: true, name: true, city: true, state: true, status: true } },
    },
    orderBy: [{ performanceScore: "desc" }, { name: "asc" }],
  });

  return Response.json(
    instructors.map((i) => ({
      id:                  i.id,
      name:                i.name,
      role:                i.role,
      certificationStatus: i.certificationStatus,
      lastEvalDate:        i.lastEvalDate?.toISOString() ?? null,
      performanceScore:    i.performanceScore,
      studio: {
        id:     i.studio.id,
        name:   i.studio.name,
        city:   i.studio.city,
        state:  i.studio.state,
        status: i.studio.status,
      },
    }))
  );
}
