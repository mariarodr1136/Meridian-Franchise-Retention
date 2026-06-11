import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { ScheduleAnalytics } from "@/components/ScheduleAnalytics";
import { StudioNav } from "@/components/StudioNav";
import { fetchStudioSchedule, scheduleUrl } from "@/lib/schedule";
import type { ClassMetric, SlotStat, InstructorStat, NavSection, StudioStatus } from "@/types";

const DAY_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function parseHour(t: string): number {
  const m = t.match(/^(\d+):(\d+)(am|pm)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  if (m[3].toLowerCase() === "pm" && h !== 12) h += 12;
  if (m[3].toLowerCase() === "am" && h === 12) h = 0;
  return h + parseInt(m[2]) / 60;
}

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [studio, rawMetrics] = await Promise.all([
    db.studio.findUnique({
      where: { id },
      select: { id: true, name: true, city: true, state: true, country: true, status: true },
    }),
    db.classMetric.findMany({ where: { studioId: id } }),
  ]);
  if (!studio) notFound();

  const schedule = await fetchStudioSchedule(studio.name, studio.state);

  const classMetrics: ClassMetric[] = rawMetrics.map((m) => ({
    id: m.id,
    studioId: m.studioId,
    dayOfWeek: m.dayOfWeek,
    timeSlot: m.timeSlot,
    weekOf: m.weekOf.toISOString(),
    capacity: m.capacity,
    spotsFilled: m.spotsFilled,
    memberBookings: m.memberBookings,
    classPackBookings: m.classPackBookings,
    classPassBookings: m.classPassBookings,
  }));

  // Aggregate by (dayOfWeek, timeSlot)
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
      dayOfWeek,
      timeSlot,
      avgFillRate:  rows.reduce((s, r) => s + r.spotsFilled / r.capacity, 0) / rows.length,
      avgMemberPct: totalFilled > 0 ? rows.reduce((s, r) => s + r.memberBookings,    0) / totalFilled : 0,
      avgPackPct:   totalFilled > 0 ? rows.reduce((s, r) => s + r.classPackBookings, 0) / totalFilled : 0,
      avgPassPct:   totalFilled > 0 ? Math.max(0, 1 - totalMix / totalFilled) : 0,
      weekCount:    rows.length,
    };
  });

  // Join schedule instructor names → slot stats
  const slotLookup = new Map<string, SlotStat>(slotStats.map((s) => [`${s.dayOfWeek}|${s.timeSlot}`, s]));
  const instrMap   = new Map<string, { fills: number[]; count: number }>();

  for (const day of schedule) {
    const dayNum = DAY_NUM[day.day.slice(0, 3)];
    if (dayNum === undefined) continue;
    for (const cls of day.classes) {
      if (!cls.instructor) continue;
      const slot = slotLookup.get(`${dayNum}|${cls.time.split(" ")[0]}`);
      if (!slot) continue;
      if (!instrMap.has(cls.instructor)) instrMap.set(cls.instructor, { fills: [], count: 0 });
      const entry = instrMap.get(cls.instructor)!;
      entry.fills.push(slot.avgFillRate);
      entry.count++;
    }
  }

  const instructorStats: InstructorStat[] = Array.from(instrMap.entries())
    .map(([name, { fills, count }]) => ({
      name,
      classCount:  count,
      avgFillRate: fills.reduce((s, v) => s + v, 0) / fills.length,
      classes:     [],
    }))
    .sort((a, b) => b.avgFillRate - a.avgFillRate);

  // Compute nav sections server-side (conditional on data)
  const hasLowSlots  = slotStats.some((s) => s.avgFillRate < 0.60);
  const hasHighSlots = slotStats.some((s) => s.avgFillRate >= 0.80);
  const hasBuckets   = slotStats.some((s) => parseHour(s.timeSlot) < 12) ||
                       slotStats.some((s) => { const h = parseHour(s.timeSlot); return h >= 12 && h < 17; }) ||
                       slotStats.some((s) => parseHour(s.timeSlot) >= 17);

  const navSections: NavSection[] = [
    { id: "schedule",        label: "Weekly Schedule"  },
    { id: "heatmap",         label: "Fill Rate Heatmap"},
    ...(instructorStats.length > 0         ? [{ id: "instructors",    label: "Instructors"      }] : []),
    ...(hasLowSlots || hasHighSlots        ? [{ id: "slot-performance",label: "Slot Performance" }] : []),
    ...(hasBuckets                         ? [{ id: "booking-mix",    label: "Booking Mix"      }] : []),
  ];

  const locationLine = [studio.city, studio.state, studio.country !== "US" ? studio.country : null]
    .filter(Boolean).join(", ");

  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <header className="sticky top-0 z-40 w-full" style={{ background: "#4A638D" }}>
        <div className="max-w-[1340px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Image src="/jetset-logo-transparent.png" alt="JetSet Modern Pilates" width={150} height={80} priority
              className="object-contain transition-opacity hover:opacity-80" />
          </Link>
          <Link href={`/studios/${id}`} className="text-sm font-medium transition-opacity hover:opacity-70 text-white">
            ← {studio.name}
          </Link>
        </div>
      </header>

      <div className="max-w-[1340px] mx-auto px-6 py-8">
        {/* Title — full width */}
        {/* Banner */}
        <div className="mb-8 rounded-xl overflow-hidden relative" style={{ height: 160 }}>
          <Image src="/jetset-class-wide.jpg" alt="" width={1400} height={160} priority
            className="w-full h-full object-cover" style={{ objectPosition: "center 78%" }} />
          <div className="absolute inset-0" style={{ background: "rgba(15,28,52,0.38)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <h1 style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 44, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", lineHeight: 1.1, marginBottom: 4, textTransform: "uppercase" }}>Weekly Schedule</h1>
            <p style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", fontSize: 16, color: "#fff", fontWeight: 500 }}>{studio.name} · {locationLine}</p>
          </div>
        </div>

        {/* Sidebar + content */}
        <div className="flex gap-8">
          <StudioNav sections={navSections} />

          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Weekly Schedule */}
            <section id="schedule" className="scroll-mt-24">
              {schedule.length > 0 ? (
                <ScheduleGrid days={schedule} classMetrics={classMetrics} scheduleHref={scheduleUrl(studio.name, studio.state)} />
              ) : (
                <div className="rounded-xl border p-10 text-center" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
                  <p className="text-sm font-medium mb-1" style={{ color: "#6B7280" }}>Live schedule unavailable</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Analytics below are based on historical class data</p>
                </div>
              )}
            </section>

            <ScheduleAnalytics slotStats={slotStats} instructorStats={instructorStats} />
          </div>
        </div>
      </div>
    </div>
  );
}
