import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ClassesPageContent } from "@/components/ClassesPageContent";
import { StudioSidebar } from "@/components/StudioSidebar";
import { StudioNav } from "@/components/StudioNav";
import { fetchStudioSchedule, extractInstructors, scheduleUrl } from "@/lib/schedule";
import type { StudioMetric, Instructor, Review, ClassMetric, SlotStat, InstructorStat, NavSection, StudioStatus } from "@/types";

const DAY_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function parseHour(t: string): number {
  const m = t.match(/^(\d+):(\d+)(am|pm)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  if (m[3].toLowerCase() === "pm" && h !== 12) h += 12;
  if (m[3].toLowerCase() === "am" && h === 12) h = 0;
  return h + parseInt(m[2]) / 60;
}

export default async function ClassesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [studio, rawMetrics, rawReviews] = await Promise.all([
    db.studio.findUnique({
      where: { id },
      include: {
        metrics:      { orderBy: { weekOf: "desc" } },
        instructors:  { orderBy: [{ role: "asc" }, { name: "asc" }] },
        classMetrics: true,
      },
    }),
    db.classMetric.findMany({ where: { studioId: id } }),
    db.review.findMany({ where: { studioId: id }, orderBy: { reviewDate: "desc" } }),
  ]);

  if (!studio) notFound();

  const isPreLaunch = studio.status === "pre-launch";
  const locationLine = [studio.city, studio.state, studio.country !== "US" ? studio.country : null]
    .filter(Boolean).join(", ");

  if (isPreLaunch) {
    return (
      <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
        <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
          <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/"><Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={150} height={80} priority className="object-contain transition-opacity hover:opacity-80" /></Link>
            <Link href={`/studios/${id}`} className="text-sm font-medium transition-opacity hover:opacity-70 text-white">← {studio.name}</Link>
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
                <h1 style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", lineHeight: 1.1, marginBottom: 4, textTransform: "uppercase" }}>Classes</h1>
                <p style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 14, color: "#fff", fontWeight: 500 }}>{studio.name} · {locationLine}</p>
              </div>
            </div>
          <div className="flex gap-8">
            <StudioSidebar studioId={id} studioStatus={studio.status} />
            <div className="flex-1 min-w-0 flex items-center justify-center py-24">
              <p className="text-sm" style={{ color: "#9CA3AF" }}>Class data will be available once this studio opens.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const schedule = await fetchStudioSchedule(studio.name, studio.state);

  // ── Metrics ──────────────────────────────────────────────────────────
  const metrics: StudioMetric[] = studio.metrics.map((m) => ({
    id: m.id, studioId: m.studioId,
    weekOf: m.weekOf.toISOString(),
    classFillRate: m.classFillRate,
    activeMemberships: m.activeMemberships,
    weeklyChurn: m.weeklyChurn,
    weeklyRevenue: m.weeklyRevenue,
    presalesPipelineCount: m.presalesPipelineCount,
    memberBookings: m.memberBookings,
    classPackBookings: m.classPackBookings,
    classPassBookings: m.classPassBookings,
  }));

  const current = metrics[0] ?? null;

  // ── Instructors (prefer live schedule names for instructors) ──────────
  const realNames = extractInstructors(schedule);
  const seededStaff: Instructor[] = studio.instructors.map((i) => ({
    id: i.id, studioId: i.studioId, name: i.name,
    role: i.role as Instructor["role"],
    certificationStatus: i.certificationStatus as Instructor["certificationStatus"],
    email: i.email ?? null,
    phone: i.phone ?? null,
    lastEvalDate: i.lastEvalDate?.toISOString() ?? null,
    performanceScore: i.performanceScore,
  }));
  const realInstructors: Instructor[] = realNames.map((name, idx) => ({
    id: `sched-${idx}`, studioId: id, name, role: "instructor",
    certificationStatus: "certified", email: null, phone: null, lastEvalDate: null, performanceScore: null,
  }));
  const instructors: Instructor[] = [
    ...seededStaff.filter((i) => i.role !== "instructor"),
    ...(realInstructors.length > 0 ? realInstructors : seededStaff.filter((i) => i.role === "instructor")),
  ];

  // ── Reviews ───────────────────────────────────────────────────────────
  const reviews: Review[] = rawReviews.map((r) => ({
    id: r.id, studioId: r.studioId,
    source: r.source as "google" | "classpass",
    author: r.author, rating: r.rating, body: r.body,
    reviewDate: r.reviewDate.toISOString(),
  }));

  // ── ClassMetrics ──────────────────────────────────────────────────────
  const classMetrics: ClassMetric[] = studio.classMetrics.map((m) => ({
    id: m.id, studioId: m.studioId,
    dayOfWeek: m.dayOfWeek, timeSlot: m.timeSlot,
    weekOf: m.weekOf.toISOString(),
    capacity: m.capacity, spotsFilled: m.spotsFilled,
    memberBookings: m.memberBookings, classPackBookings: m.classPackBookings, classPassBookings: m.classPassBookings,
  }));

  // ── Slot stats ────────────────────────────────────────────────────────
  const slotMap = new Map<string, typeof rawMetrics>();
  for (const m of rawMetrics) {
    const key = `${m.dayOfWeek}|${m.timeSlot}`;
    if (!slotMap.has(key)) slotMap.set(key, []);
    slotMap.get(key)!.push(m);
  }
  const slotStats: SlotStat[] = Array.from(slotMap.entries()).map(([key, rows]) => {
    const sep = key.indexOf("|");
    const dayOfWeek = parseInt(key.slice(0, sep));
    const timeSlot  = key.slice(sep + 1);
    const totalFilled = rows.reduce((s, r) => s + r.spotsFilled, 0);
    const totalMix    = rows.reduce((s, r) => s + r.memberBookings + r.classPackBookings, 0);
    return {
      dayOfWeek, timeSlot,
      avgFillRate:  rows.reduce((s, r) => s + r.spotsFilled / r.capacity, 0) / rows.length,
      avgMemberPct: totalFilled > 0 ? rows.reduce((s, r) => s + r.memberBookings, 0)    / totalFilled : 0,
      avgPackPct:   totalFilled > 0 ? rows.reduce((s, r) => s + r.classPackBookings, 0) / totalFilled : 0,
      avgPassPct:   totalFilled > 0 ? Math.max(0, 1 - totalMix / totalFilled) : 0,
      weekCount:    rows.length,
    };
  });

  // ── Instructor stats via schedule slots ───────────────────────────────
  const slotLookup = new Map<string, SlotStat>(slotStats.map((s) => [`${s.dayOfWeek}|${s.timeSlot}`, s]));
  const instrMap   = new Map<string, { fills: number[]; count: number; classes: Set<string> }>();
  for (const day of schedule) {
    const dayNum = DAY_NUM[day.day.slice(0, 3)];
    if (dayNum === undefined) continue;
    for (const cls of day.classes) {
      if (!cls.instructor) continue;
      const slot = slotLookup.get(`${dayNum}|${cls.time.split(" ")[0]}`);
      if (!slot) continue;
      if (!instrMap.has(cls.instructor)) instrMap.set(cls.instructor, { fills: [], count: 0, classes: new Set() });
      const entry = instrMap.get(cls.instructor)!;
      entry.fills.push(slot.avgFillRate);
      entry.count++;
      if (cls.name) entry.classes.add(cls.name);
    }
  }
  const instructorStats: InstructorStat[] = Array.from(instrMap.entries())
    .map(([name, { fills, count, classes }]) => ({
      name, classCount: count,
      avgFillRate: fills.reduce((s, v) => s + v, 0) / fills.length,
      classes: Array.from(classes),
    }))
    .sort((a, b) => b.avgFillRate - a.avgFillRate);

  // ── Sidebar scroll sections ───────────────────────────────────────────
  const hasBooking = !!current && (current.memberBookings + current.classPackBookings + current.classPassBookings) > 0;
  const hasLowSlots  = slotStats.some((s) => s.avgFillRate < 0.60);
  const hasHighSlots = slotStats.some((s) => s.avgFillRate >= 0.80);

  const navSections: NavSection[] = [
    ...(schedule.length > 0                    ? [{ id: "schedule",  label: "Weekly Schedule"   }] : []),
    ...(hasBooking                             ? [{ id: "booking",   label: "How Clients Book"  }] : []),
    ...(slotStats.length > 0                   ? [{ id: "heatmap",   label: "Fill Rate Heatmap" }] : []),
    ...(instructorStats.length > 0             ? [{ id: "instructors", label: "Instructors"     }] : []),
    ...(reviews.length > 0                     ? [{ id: "reviews",   label: "Reviews"           }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/"><Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={150} height={80} priority className="object-contain transition-opacity hover:opacity-80" /></Link>
          <Link href={`/studios/${id}`} className="text-sm font-medium transition-opacity hover:opacity-70 text-white">← {studio.name}</Link>
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
            <h1 style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", lineHeight: 1.1, marginBottom: 4, textTransform: "uppercase" }}>Classes</h1>
            <p style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 14, color: "#fff", fontWeight: 500 }}>{studio.name} · {locationLine}</p>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col gap-4 w-52 flex-shrink-0 sticky top-24 self-start">
            <StudioSidebar studioId={id} studioStatus={studio.status} />
            {navSections.length > 0 && <StudioNav sections={navSections} label="On this page" />}
          </div>

          <div className="flex-1 min-w-0">
            <ClassesPageContent
              studioId={id}
              studioName={studio.name}
              metrics={metrics}
              current={current}
              classMetrics={classMetrics}
              instructors={instructors}
              reviews={reviews}
              schedule={schedule}
              scheduleHref={scheduleUrl(studio.name, studio.state)}
              slotStats={slotStats}
              instructorStats={instructorStats}
              hasSchedule={schedule.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
