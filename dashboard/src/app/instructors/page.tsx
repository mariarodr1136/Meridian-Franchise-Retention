import { db } from "@/lib/db";
import { NetworkPageHero } from "@/components/NetworkPageHero";
import { InstructorRoster } from "./InstructorRoster";

async function getNetworkInstructors() {
  return db.instructor.findMany({
    include: {
      studio: { select: { id: true, name: true, city: true, state: true, status: true } },
    },
    orderBy: [{ performanceScore: "desc" }, { name: "asc" }],
  });
}

export default async function InstructorsPage() {
  const raw = await getNetworkInstructors();

  const instructors = raw.map((i) => ({
    id:                  i.id,
    name:                i.name,
    role:                i.role as "instructor" | "studio_lead" | "general_manager" | "director_of_operations",
    certificationStatus: i.certificationStatus as "certified" | "pending" | "expired",
    lastEvalDate:        i.lastEvalDate?.toISOString() ?? null,
    performanceScore:    i.performanceScore,
    studio: {
      id:     i.studio.id,
      name:   i.studio.name,
      city:   i.studio.city,
      state:  i.studio.state,
      status: i.studio.status,
    },
  }));

  const withScore   = instructors.filter((i) => i.performanceScore != null);
  const avgScore    = withScore.length
    ? Math.round(withScore.reduce((s, i) => s + i.performanceScore!, 0) / withScore.length)
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
            { label: "Total Instructors", value: String(instructors.filter((i) => i.role === "instructor").length), color: "#4A638D" },
            { label: "Avg Score",         value: avgScore != null ? String(avgScore) : "—",                         color: avgScore != null && avgScore >= 85 ? "#16a34a" : "#C9A84C" },
            { label: "Cert Alerts",       value: String(pendingCert + expiredCert),                                 color: pendingCert + expiredCert > 0 ? "#EA580C" : "#16a34a" },
            { label: "Eval Overdue",      value: String(needsEval),                                                 color: needsEval > 0 ? "#EA580C" : "#16a34a" },
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
