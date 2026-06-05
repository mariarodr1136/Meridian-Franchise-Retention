export type ScheduleClass = {
  day: string;
  date: string;
  time: string;
  startHour: number;
  name: string;
  instructor: string;
  isPast: boolean;
};

export type ScheduleDay = {
  day: string;
  date: string;
  classes: ScheduleClass[];
};

function toSlug(studioName: string): string {
  return studioName
    .toLowerCase()
    .replace(/[–—]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function scheduleUrl(studioName: string, state: string | null): string {
  return `https://jetsetpilates.com/${(state ?? "").toLowerCase()}/${toSlug(studioName)}/schedule/`;
}

function parseStartHour(timeStr: string): number {
  const m = timeStr.match(/^(\d+):(\d+)(am|pm)/i);
  if (!m) return 0;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const ap = m[3].toLowerCase();
  if (ap === "pm" && h !== 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h + min / 60;
}

export async function fetchStudioSchedule(
  studioName: string,
  state: string | null
): Promise<ScheduleDay[]> {
  const url = scheduleUrl(studioName, state);
  let html: string;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return [];
    html = await res.text();
  } catch {
    return [];
  }

  const days: ScheduleDay[] = [];

  // Strip title attributes — some contain <ul>...</ul> in tooltip policy text,
  // which would cause the </ul> regex to terminate the classes list early.
  const cleanHtml = html.replace(/ title="[^"]*"/g, "");

  // Each day block starts with <div class="schedule-day
  const daySections = cleanHtml.split('<div class="schedule-day').slice(1);

  for (const section of daySections) {
    const dayMatch = section.match(/schedule-day-header-day">([^<]+)<\/span>/);
    const dateMatch = section.match(/schedule-day-header-date">([^<]+)<\/span>/);
    if (!dayMatch || !dateMatch) continue;

    const day = dayMatch[1].trim();
    const date = dateMatch[1].trim();

    const ulMatch = section.match(/<ul class="classes">([\s\S]*?)<\/ul>/);
    if (!ulMatch) {
      days.push({ day, date, classes: [] });
      continue;
    }

    const classes: ScheduleClass[] = [];
    const liItems = ulMatch[1].split("<li ").slice(1);

    for (const item of liItems) {
      const isPast = item.includes("class-past");
      const nameMatch = item.match(/<div class="class-name">([^<]+)/);
      const timeMatch = item.match(/<div class="class-time">([^<]+)/);
      const teacherMatch = item.match(/<div class="class-teacher">([^<]+)<\/div>/);
      if (!nameMatch || !timeMatch || !teacherMatch) continue;

      const name = nameMatch[1].trim();
      if (name.toLowerCase().includes("lead shift")) continue;

      const time = timeMatch[1].trim();
      const instructor = teacherMatch[1].trim();
      const startHour = parseStartHour(time.split(" ")[0]);

      classes.push({ day, date, time, startHour, name, instructor, isPast });
    }

    days.push({ day, date, classes });
  }

  return days;
}

export function extractInstructors(schedule: ScheduleDay[]): string[] {
  const seen = new Set<string>();
  for (const d of schedule) {
    for (const c of d.classes) {
      if (c.instructor) seen.add(c.instructor);
    }
  }
  return Array.from(seen).sort();
}
