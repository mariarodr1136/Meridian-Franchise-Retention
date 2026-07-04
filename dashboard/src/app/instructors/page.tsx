import { db } from "@/lib/db";
import { NetworkPageHero } from "@/components/NetworkPageHero";
import { InstructorRoster } from "./InstructorRoster";

async function getNetworkInstructors() {
  const rows = await db.instructor.findMany({
    where: { role: "instructor" },
    include: {
      studio: { select: { id: true, name: true, city: true, state: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const reviews = await db.review.findMany({
    where: { instructorId: { in: rows.map((r) => r.id) } },
    select: { instructorId: true, rating: true },
  });

  const ratingsByInstructorId = new Map<string, number[]>();
  for (const r of reviews) {
    if (!r.instructorId) continue;
    const list = ratingsByInstructorId.get(r.instructorId) ?? [];
    list.push(r.rating);
    ratingsByInstructorId.set(r.instructorId, list);
  }

  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.personKey ?? row.id;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  return [...groups.values()].map((group) => {
    const canonical = group[0]; // rows are pre-sorted by createdAt asc
    const ratings = group.flatMap((row) => ratingsByInstructorId.get(row.id) ?? []);
    const avgRating = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;

    return {
      id: canonical.id,
      name: canonical.name,
      certificationStatus: canonical.certificationStatus as "certified" | "pending" | "expired",
      lastEvalDate: canonical.lastEvalDate?.toISOString() ?? null,
      avgRating,
      reviewCount: ratings.length,
      studios: group.map((row) => ({
        id: row.studio.id,
        name: row.studio.name,
        city: row.studio.city,
        state: row.studio.state,
      })),
    };
  });
}

export default async function InstructorsPage() {
  const instructors = await getNetworkInstructors();

  const withScore = instructors.filter((i) => i.avgRating != null);
  const avgScore  = withScore.length
    ? withScore.reduce((s, i) => s + i.avgRating!, 0) / withScore.length
    : null;
  const pendingCert = instructors.filter((i) => i.certificationStatus === "pending").length;
  const expiredCert = instructors.filter((i) => i.certificationStatus === "expired").length;
  const needsEval   = instructors.filter((i) => {
    if (!i.lastEvalDate) return true;
    const daysSince = (Date.now() - new Date(i.lastEvalDate).getTime()) / 86400000;
    return daysSince > 180;
  }).length;

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <NetworkPageHero title="Instructor IP Roster" />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-4 pb-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Instructors", value: String(instructors.length),                                          color: "#4A638D" },
            { label: "Avg Score",         value: avgScore != null ? `${avgScore.toFixed(1)}★` : "—",                  color: avgScore != null && avgScore >= 4.25 ? "#16a34a" : "#C9A84C" },
            { label: "Cert Alerts",       value: String(pendingCert + expiredCert),                                    color: pendingCert + expiredCert > 0 ? "#EA580C" : "#16a34a" },
            { label: "Eval Overdue",      value: String(needsEval),                                                    color: needsEval > 0 ? "#EA580C" : "#16a34a" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border p-5" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
              <p className="text-xs mb-1" style={{ color: "#9CA3AF" }}>{label}</p>
              <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        <InstructorRoster instructors={instructors} />
      </div>
    </div>
  );
}
