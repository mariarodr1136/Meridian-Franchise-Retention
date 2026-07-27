# Meridian: Franchise Retention Intelligence 📊 🏢

![Next.js](https://img.shields.io/badge/Next.js-Framework-black)
![React](https://img.shields.io/badge/React-UI%20Library-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-Language-3178C6)
![Tailwind%20CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-06B6D4)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57)
![Recharts](https://img.shields.io/badge/Recharts-Data%20Visualization-22C55E)
![Gemini](https://img.shields.io/badge/Gemini-AI%20Integration-4285F4)
![Radix%20UI](https://img.shields.io/badge/Radix%20UI-Component%20Library-purple)
![react--simple--maps](https://img.shields.io/badge/react--simple--maps-Map%20Visualization-4A638D)

A full-stack internal analytics platform for franchise headquarters to monitor, diagnose, and act on performance data across an entire studio network — in real time, from a single interface.

This is a demo build of what a purpose-built franchise ops tool could look like at scale.

---

## What It Does

Running a multi-location fitness franchise means managing dozens of studios, hundreds of instructors, and thousands of members — without a unified view of what's actually happening on the ground. This dashboard solves that.

From the network home page, operators get an instant read on every studio: occupancy rates, active memberships, weekly revenue, churn, and live alerts for anything that needs attention. One click drills into any studio with full historical metrics, a live class schedule, revenue breakdowns, operations contacts, inventory levels, and member reviews — organized into a clean, navigable interface designed for the way ops teams actually work.

---

Live Application: https://jetset-franchise-intelligence.onrender.com/

> The live application is hosted on Render's free tier, so the backend may take 1–2 minutes to wake up on the first visit after inactivity.*



https://github.com/user-attachments/assets/2d9e678d-2401-457b-b6be-ce104c71497d




---

## Features

### Network Command Center
- **Live studio grid** — every studio at a glance, color-coded by status (healthy, at-risk, new, pre-launch), with week-over-week trends on key KPIs
- **Network-wide KPI bar** — real-time aggregates: total active members, average occupancy, weekly revenue, at-risk studio count, open anomalies
- **Alert feed & themed nav** — active alerts with severity tagging and one-click resolve, plus pill-style navigation to all network pages with a built-in ⌘K search trigger
- **Interactive US map** — all locations on a zoomable SVG map (`react-simple-maps`), markers color-coded by status with a pulsing ring on at-risk studios and hover tooltips showing occupancy and revenue

### Studio Detail
- **KPI cards & trend charts** — occupancy, memberships, revenue, and churn with WoW deltas and 12-week Recharts sparklines
- **Retention preview & alerts** — churn-model risk summary and a studio-scoped anomaly feed on the main page
- **Metrics comparison** — period-over-period analysis with monthly, quarterly, and yearly aggregation modes
- **Reviews scroll** — recent Google and ClassPass reviews, expandable inline, linking to the full reviews page

### Rule-Based Alert Engine
Four categories monitored automatically across every studio on every scan:

| Category | Thresholds |
|---|---|
| **Occupancy** | Critical `< 45%` · Warning `< 58%` · Declining trend `< 68%` for 4 consecutive weeks |
| **Churn** | Critical `> 8.5%` · Warning `> 6.0%` · Rising trend `> 3.5%` for 4 consecutive weeks |
| **Membership** | High `> 18%` 6-week drop · Medium `> 10%` · Low 5 consecutive weeks of decline |
| **Revenue** | Medium `> 18%` 6-week drop · Low `> 10%` |

Alerts regenerate from fresh metrics on each scan (resolved alerts preserved as history), and every message includes specific numbers, trends, and a recommended action. The dedicated `/alerts` page adds severity filter tabs, an active/resolved toggle, a detail side panel, and an **SSE live feed** — `/api/alerts/stream` pushes new and removed alerts to the client without polling, with a LIVE badge and toast notifications.

### Churn Prediction Model
A weighted sigmoid scoring model generating per-member churn predictions — no external ML service required. Five features combined via a learned weight vector:

| Feature | Weight | Description |
|---|---|---|
| Recency | 0.35 | Days since last visit, normalized 0–1 |
| Frequency | 0.28 | Recent visit frequency relative to plan type |
| No-show rate | 0.20 | Proportion of booked classes missed |
| Tenure | 0.10 | Months as a member (inverse — longer = lower risk) |
| Tier | 0.07 | Membership plan (4-class packs are highest risk) |

The raw score passes through a sigmoid to yield a calibrated probability. Model AUC: **0.841**.

- **Feature importances** — each member's expanded row shows a bar breakdown of what drove their score
- **Risk tiering & profiles** — high / medium / low tiers with thresholds scaled to the studio's actual churn rate; per-member visit stats, top contributing factors, and a suggested action
- **Revenue at risk** — projected annual exposure across high and medium-risk members
- **Deterministic output** — a seeded PRNG keyed to `studioId` generates member features, so predictions are stable across renders and deployments

### Retention Intelligence
- **Network view (`/churn`)** — studio risk rankings sorted by high-risk member count, network summary stats, a filterable paginated member table, and an interactive **Retention ROI Calculator** showing revenue protected at a target retention rate
- **Per-studio view (`/retention`)** — at-risk breakdown by membership tier and a **cohort retention chart** with quarterly decay curves from M0 to M12

### Studio Benchmarking
A `/compare` page for side-by-side comparison of any two studios: a KPI table with the winning side highlighted per metric, and four dual-line trend charts (revenue, memberships, fill rate, churn) over 13 weeks.

### Instructor IP Roster
A `/instructors` page covering every instructor's performance, certification, and evaluation status: network summary cards, a roster filterable by role / cert status / studio with free-text search and sorting, score tiers (Elite ≥ 92 → Needs Attention < 75), cert badges, and overdue-evaluation detection (no eval in 180 days).

### Weekly Schedule Intelligence
- **7-day calendar grid** — live class schedule color-coded by historical fill rate (green ≥ 80%, amber 55–79%, red < 55%)
- **Class detail panel** — 8-week fill rate trend, booking mix breakdown (Members / Class Packs / ClassPass), and a plain-language trend signal
- **Client-side week navigation** — stepping between weeks shifts dates mathematically with no network call

### Instructor Analytics
- **Slot-level stats** — average fill rate, booking mix, and 4-week trend per day-of-week + time-slot combination, with instructors ranked by fill rate
- **Mention detection** — word-boundary regex scans all review text to identify which reviews reference each instructor
- **Per-instructor pages** — rating breakdown bars, all mentioning reviews, and an aggregate rating profile

### Reviews System
- **Source-separated reviews page** — Google and ClassPass sections with aggregate ratings per source and inline-expanding review cards
- **Sentiment trend chart** — monthly review count (bars) combined with average rating (line), color-coded by score tier

### Maintenance Tracker
A per-studio `/maintenance` page for equipment and facility issues: cards with category, priority, status, and assigned contact; simultaneous status + priority filtering; summary stats; and inline resolve / status-update actions.

### Studio Sub-Pages
Every live studio has a full operational suite via the persistent sidebar:

- **Classes** — booking mix, weekly schedule, slot analytics, period comparison, reviews
- **Sales** — revenue KPIs, trend chart with MoM deltas, stacked bars by product category, paginated product table, **PDF export**
- **Operations** — lease expiry, landlord contacts, alarm, HVAC, electrician, internet
- **Inventory** — month-by-month stock levels with reorder status, inline quantity editing, **PDF export**
- **Settings** — studio info and staff roster with certification status and performance scores

### Franchise Pipeline
A `/pipeline` kanban tracking prospective locations across five stages (Discovery → Pre-Sales): draggable lead cards with checklist progress, an add-lead modal posting to `/api/pipeline`, stage-entry timestamps, and a stalled-lead indicator (14+ days inactive).

### Weekly Network Digest
A printable `/digest` report: network KPI snapshot with WoW deltas, studio health breakdown, top-5 revenue table, alert summary, at-risk studio detail, new-studio ramp progress, and one-click print with a dedicated print layout. A "Generate Summary" button streams a 3-paragraph **AI executive summary** grounded in the page's live KPI payload.

### Full-Text Search (⌘K)
A global command palette powered by **SQLite FTS5** — a `unicode61`-tokenized virtual table over 1,600+ studios, reviews, and instructors, built lazily and held in a singleton `better-sqlite3` connection separate from Prisma. Prefix matching on every term, debounced input, relevance-ranked and type-badged results, full keyboard navigation.

### AI Intelligence Layer
Two Gemini 2.5 Flash streaming surfaces, both using raw `fetch` against Google's SSE endpoint — no SDK required:

- **Network Intelligence Brief** (Alerts → Scan Network) — after a rule-based scan, streams a brief covering overall health, top risks with recommended actions, and a forward-looking observation
- **AI Executive Summary** (Digest → Generate Summary) — an on-demand briefing grounded in the weekly KPI payload, streaming token-by-token with a blinking cursor

Both share the same SSE buffer-flush pattern (split on newlines, parse `data:` lines, flush on every chunk and on stream end to catch partial final lines), and set `thinkingConfig: { thinkingBudget: 0 }` so Gemini's internal reasoning tokens don't consume the output budget. Without an API key, both degrade gracefully to an instructional message.

### Studio Knowledge Hub
A `/hub` content library for operators and staff: six categories (Announcements, Operations Manual, Training, Brand Standards, HR, Resources) with doc counts and "New" badges, document cards with status / author / read time / tags, and debounced in-category search. Server-rendered stat bar with live network KPIs; interactivity isolated in a client component.

---


<img width="1470" height="796" alt="Screenshot 2026-07-26 at 6 05 42 PM" src="https://github.com/user-attachments/assets/30ee403d-295b-44f9-b3aa-09e4866aceaa" />

<img width="1467" height="802" alt="Studio detail" src="https://github.com/user-attachments/assets/8e9c9e38-8064-45a7-bc0e-07f27d3573d2" />

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App Router                   │
│                                                          │
│  Server Components          Client Components            │
│  ─────────────────          ──────────────────           │
│  Data fetching              Interactive UI               │
│  Prisma queries             useState / useMemo           │
│  Alert detection            Charts (Recharts)            │
│  Churn model (sigmoid)      Accordion expand             │
│  Instructor mentions        Schedule navigation          │
│  Page layouts               GlobalSearch (⌘K)           │
│                             AlertsGrid (SSE)             │
│                             DigestAISummary (streaming)  │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │    REST API Routes    │
         │  /api/studios/[id]/*  │ ← schedule, sales, ops,
         │  /api/anomalies/*     │   inventory, maintenance
         │  /api/compare         │ ← benchmarking
         │  /api/instructors     │ ← IP roster
         │  /api/search          │ ← FTS5 query
         │  /api/alerts/stream   │ ← SSE live feed
         │  /api/digest/summary  │ ← AI SSE
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Prisma ORM          │
         │   SQLite (dev.db)     │
         ├───────────────────────┤
         │   better-sqlite3      │
         │   FTS5 virtual table  │ ← global search index
         └───────────────────────┘
                     │
         ┌───────────▼───────────┐
         │  Google Gemini API    │
         │  gemini-2.5-flash     │ ← SSE streaming
         └───────────────────────┘
```

Data fetching and business logic live in server components and API routes; client components handle only what requires the browser. Only serializable props cross the boundary.

### Key Design Decisions
- **Sigmoid churn model over pure PRNG** — a seeded LCG generates deterministic behavioral features; a real weighted sigmoid then computes probability from them, so output is reproducible while the scoring logic is genuinely ML-shaped
- **Rule-based alerts over ML** — thresholds are explicit, human-auditable, and tunable, giving ops teams full transparency into why an alert fired
- **Separate `better-sqlite3` connection for FTS5** — Prisma can't express FTS5 `MATCH` syntax; a second raw connection with `busy_timeout` avoids lock contention
- **Raw `fetch` over Google AI SDK** — Gemini's `?alt=sse` endpoint works with the standard `fetch` + `ReadableStream` pattern, avoiding a dependency
- **SSE over WebSocket for alerts** — alerts are server-push only; SSE's unidirectional model is simpler and needs no upgrade handshake

---

## Data Model

```
Studio
  ├── StudioMetric[]      weekly KPIs (fill rate, memberships, revenue, churn, booking mix)
  ├── Instructor[]        staff with roles, cert status, performance scores, last eval date
  ├── Anomaly[]           generated alerts with severity + category
  ├── Review[]            Google & ClassPass reviews with ratings
  ├── ClassMetric[]       per-slot historical fill data (day × time × week)
  ├── SalesRecord[]       monthly revenue by product and category
  ├── InventoryItem[]     monthly stock levels with reorder thresholds
  ├── MaintenanceItem[]   equipment/facility issues with category, priority, status
  └── StudioOperations    lease, alarm, HVAC, utilities, contacts (1:1)

FranchiseLead
  ├── stage               Discovery → Agreement Signed → Site Selected →
  │                         Permits & Construction → Pre-Sales
  ├── territoryType       suburban / urban / rural / resort
  ├── stageEnteredAt      timestamp for stall detection
  └── checklist fields    docsComplete, leaseComplete, trainingBooked
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| UI | Tailwind CSS v4 · Recharts 3 |
| Data | Prisma 7 · SQLite via better-sqlite3 · FTS5 full-text search |
| AI / LLM | Google Gemini 2.5 Flash (streaming via `fetch` + SSE) |
| Real-time | Server-Sent Events (`ReadableStream` + `EventSource`) |
| Map | react-simple-maps + us-atlas topojson |

---

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/mariarodr1136/Meridian-Franchise-Retention-Intelligence.git
cd Meridian-Franchise-Retention-Intelligence/dashboard
npm install

# 2. Generate Prisma client and seed the database
npx prisma generate
npx tsx prisma/seed.ts
npx tsx prisma/seed-pipeline.ts   # franchise pipeline leads

# 3. (Optional) Enable AI features — free key at https://aistudio.google.com/apikey
echo "GEMINI_API_KEY=your_key_here" >> .env.local

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the network overview. Without a `GEMINI_API_KEY`, all non-AI features work normally — the AI buttons show a graceful instructional message instead.

After seeding, generate the initial alert set from the Scan button on the network overview, or:

```bash
curl -X POST http://localhost:3000/api/anomalies/generate
```

---

<img width="1470" height="801" alt="Weekly digest" src="https://github.com/user-attachments/assets/c2be7d53-c702-413a-aae3-fa8a5f193b2f" />

---

## Project Structure

```
dashboard/
├── prisma/
│   ├── schema.prisma          data model
│   ├── seed.ts                synthetic studio + metric generation
│   └── seed-pipeline.ts       franchise pipeline lead seed
├── src/
│   ├── app/
│   │   ├── page.tsx           network overview (home)
│   │   ├── alerts/            network-wide alert center (SSE live feed)
│   │   ├── churn/             network-wide retention intelligence
│   │   ├── compare/           studio benchmarking
│   │   ├── digest/            weekly network digest (printable)
│   │   ├── hub/               studio knowledge hub
│   │   ├── instructors/       instructor IP roster
│   │   ├── pipeline/          franchise pipeline kanban
│   │   ├── api/               anomalies (scan + AI brief), alerts/stream (SSE),
│   │   │                      churn, compare, digest/summary (AI), instructors,
│   │   │                      pipeline, search (FTS5)
│   │   └── studios/[id]/      studio overview + classes, sales, operations,
│   │                          inventory, maintenance, retention, settings,
│   │                          reviews (incl. per-instructor pages)
│   ├── components/            AlertsGrid, GlobalSearch (⌘K), DigestAISummary,
│   │                          CohortRetentionChart, SentimentTrendChart,
│   │                          MaintenanceFeed, NetworkPageHero, RetentionPageContent
│   ├── lib/
│   │   ├── churn.ts           weighted sigmoid churn model
│   │   ├── fts.ts             SQLite FTS5 index + search helpers
│   │   ├── schedule.ts        schedule fetching + dedup
│   │   └── utils.ts           formatting helpers
│   └── types/
└── public/
```

---

## Contact

If you have any questions or feedback, feel free to reach out at [mrodr.contact@gmail.com](mailto:mrodr.contact@gmail.com).

*This is an independent demo project and is not officially affiliated with, endorsed by, or implemented at any fitness franchise. All studio data is synthetically generated.*
