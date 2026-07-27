import { db } from "@/lib/db";

// ── Thresholds ────────────────────────────────────────────────────────────────
const FILL_CRITICAL     = 0.45;  // < 45% → high
const FILL_WARNING      = 0.58;  // < 58% → medium
const FILL_WATCH        = 0.68;  // declining trend below this → low
const CHURN_CRITICAL    = 0.085; // > 8.5% → high
const CHURN_WARNING     = 0.060; // > 6.0% → medium
const CHURN_WATCH       = 0.035; // rising trend above this → low
const MEMBER_DECLINE_HI = 0.18;  // > 18% drop over ~6 weeks → high
const MEMBER_DECLINE_MD = 0.10;  // > 10% drop → medium
const MEMBER_DECLINE_LO = 0.05;  // > 5% drop, consistently declining → low
const REV_DECLINE_MD    = 0.18;  // > 18% drop → medium
const REV_DECLINE_LO    = 0.10;  // > 10% drop → low
const MIN_AGE_WEEKS     = 12;    // studios in early ramp get fill-rate grace

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
function pct(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}
function usd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

type AlertDraft = {
  studioId: string;
  severity: string;
  category: string;
  summary: string;
  generatedAt: Date;
  resolved: boolean;
};

function detectAlerts(
  studio: { id: string; name: string; openedAt: Date | null },
  metrics: {
    weekOf: Date;
    classFillRate: number;
    activeMemberships: number;
    weeklyChurn: number;
    weeklyRevenue: number;
  }[]
): AlertDraft[] {
  if (metrics.length < 4) return [];

  const now = new Date("2026-06-01");
  const ageWeeks = studio.openedAt
    ? (now.getTime() - new Date(studio.openedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
    : 999;

  // metrics[0] = most recent, metrics[N-1] = oldest
  const recent3 = metrics.slice(0, 3);
  const older3  = metrics.slice(metrics.length - 3);
  const all     = metrics;

  const alerts: AlertDraft[] = [];
  const seen = new Set<string>(); // one alert per category

  function add(category: string, severity: string, summary: string) {
    if (seen.has(category)) return;
    seen.add(category);
    alerts.push({ studioId: studio.id, severity, category, summary, generatedAt: now, resolved: false });
  }

  // ── Fill rate ──────────────────────────────────────────────────────────────
  if (ageWeeks > MIN_AGE_WEEKS) {
    const fill3 = avg(recent3.map((m) => m.classFillRate));

    if (fill3 < FILL_CRITICAL) {
      add("occupancy", "high",
        `${studio.name} class fill rate has averaged ${pct(fill3)} over the past 3 weeks — critically below the 70% network benchmark. Immediate schedule review and demand-generation push recommended.`
      );
    } else if (fill3 < FILL_WARNING) {
      add("occupancy", "medium",
        `${studio.name} class fill rate has averaged ${pct(fill3)} over the past 3 weeks, below the 70% network benchmark. Consider class schedule optimization and a targeted local marketing push.`
      );
    } else if (fill3 < FILL_WATCH && metrics.length >= 4) {
      // Flag a downward trend over 4 consecutive weeks (newest first)
      const fillTrend = metrics.slice(0, 4).map((m) => m.classFillRate);
      const declining = fillTrend[0] < fillTrend[1] && fillTrend[1] < fillTrend[2] && fillTrend[2] < fillTrend[3];
      if (declining) {
        add("occupancy", "low",
          `${studio.name} class fill rate has declined for 4 consecutive weeks, now at ${pct(fillTrend[0])}. Monitor closely — early intervention can prevent further drop below the 70% benchmark.`
        );
      }
    }
  }

  // ── Churn ──────────────────────────────────────────────────────────────────
  {
    const churn3 = avg(recent3.map((m) => m.weeklyChurn));

    if (churn3 > CHURN_CRITICAL) {
      add("churn", "high",
        `${studio.name} weekly churn has averaged ${pct(churn3)} over the past 3 weeks — more than 4× the healthy network average of ~2%. Immediate member retention outreach and operations review recommended.`
      );
    } else if (churn3 > CHURN_WARNING) {
      add("churn", "medium",
        `${studio.name} weekly churn is running at ${pct(churn3)}, elevated above the ~2% network average. Review recent member feedback and consider a proactive retention campaign.`
      );
    } else if (churn3 > CHURN_WATCH && metrics.length >= 4) {
      const churnTrend = metrics.slice(0, 4).map((m) => m.weeklyChurn); // newest first
      const rising = churnTrend[0] > churnTrend[1] && churnTrend[1] > churnTrend[2] && churnTrend[2] > churnTrend[3];
      if (rising) {
        add("churn", "low",
          `${studio.name} weekly churn has risen for 4 consecutive weeks and is now at ${pct(churn3)}. Early intervention now can prevent escalation — review instructor feedback and class satisfaction.`
        );
      }
    }
  }

  // ── Membership decline ─────────────────────────────────────────────────────
  if (metrics.length >= 6) {
    const recentMembers = avg(recent3.map((m) => m.activeMemberships));
    const olderMembers  = avg(older3.map((m) => m.activeMemberships));

    if (olderMembers > 0) {
      const decline = (olderMembers - recentMembers) / olderMembers;
      const from    = Math.round(olderMembers);
      const to      = Math.round(recentMembers);

      if (decline > MEMBER_DECLINE_HI) {
        add("membership", "high",
          `${studio.name} active memberships have dropped ${pct(decline, 0)} over 6 weeks (${from} → ${to} members). Urgent: activate referral program, review pricing, and schedule a field ops visit.`
        );
      } else if (decline > MEMBER_DECLINE_MD) {
        add("membership", "medium",
          `${studio.name} active memberships are down ${pct(decline, 0)} over 6 weeks (${from} → ${to} members). Recommend activating the referral program and a local community outreach push.`
        );
      } else if (decline > MEMBER_DECLINE_LO) {
        const memberTrend = metrics.slice(0, 5).map((m) => m.activeMemberships); // newest first
        const consistently = memberTrend[0] < memberTrend[1] && memberTrend[1] < memberTrend[2]
          && memberTrend[2] < memberTrend[3] && memberTrend[3] < memberTrend[4];
        if (consistently) {
          add("membership", "low",
            `${studio.name} has seen 5 consecutive weeks of membership decline (${from} → ${to}). Worth monitoring — consider a light win-back campaign to stabilize before the trend deepens.`
          );
        }
      }
    }
  }

  // ── Revenue decline ────────────────────────────────────────────────────────
  if (metrics.length >= 6) {
    const recentRev = avg(recent3.map((m) => m.weeklyRevenue));
    const olderRev  = avg(older3.map((m) => m.weeklyRevenue));

    if (olderRev > 0) {
      const decline = (olderRev - recentRev) / olderRev;

      if (decline > REV_DECLINE_MD) {
        add("revenue", "medium",
          `${studio.name} weekly revenue has fallen ${pct(decline, 0)} over 6 weeks (${usd(olderRev)} → ${usd(recentRev)} avg). Review membership mix, late-cancel rates, and retail performance.`
        );
      } else if (decline > REV_DECLINE_LO) {
        add("revenue", "low",
          `${studio.name} weekly revenue is trending down ${pct(decline, 0)} over 6 weeks (${usd(olderRev)} → ${usd(recentRev)} avg). Monitor closely and consider a seasonal promotion to lift bookings.`
        );
      }
    }
  }

  return alerts;
}

export async function POST() {
  // Clear all currently unresolved alerts — we regenerate from fresh data.
  // Resolved alerts are preserved as history.
  const { count: cleared } = await db.anomaly.deleteMany({ where: { resolved: false } });

  // Fetch all open studios with up to 8 weeks of metrics
  const studios = await db.studio.findMany({
    where:   { status: { not: "pre-launch" } },
    include: {
      metrics: {
        orderBy: { weekOf: "desc" },
        take: 8,
      },
    },
  });

  const allAlerts: AlertDraft[] = [];

  for (const studio of studios) {
    const detected = detectAlerts(
      { id: studio.id, name: studio.name, openedAt: studio.openedAt },
      studio.metrics.map((m) => ({
        weekOf:            m.weekOf,
        classFillRate:     m.classFillRate,
        activeMemberships: m.activeMemberships,
        weeklyChurn:       m.weeklyChurn,
        weeklyRevenue:     m.weeklyRevenue,
      }))
    );
    allAlerts.push(...detected);
  }

  if (allAlerts.length > 0) {
    await db.anomaly.createMany({ data: allAlerts });
  }

  return Response.json({ created: allAlerts.length, cleared });
}
