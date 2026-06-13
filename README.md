# JETSET Pilates — Franchise Intelligence Dashboard 📊 🏢

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

*Note: The live application is hosted on Render's free tier, so the backend may take 1–2 minutes to wake up on the first visit after inactivity.*

---

https://github.com/user-attachments/assets/b33ed8c9-ccf6-467a-ae27-8e3a571b0c48

---

## Table of Contents

- [What It Does](#what-it-does)
- [Features](#features)
  - [Network Command Center](#network-command-center)
  - [Network Map](#network-map)
  - [Studio Detail](#studio-detail)
  - [Rule-Based Alert Engine](#rule-based-alert-engine)
  - [Churn Prediction Model](#churn-prediction-model)
  - [Network-Wide Retention Intelligence](#network-wide-retention-intelligence)
  - [Per-Studio Retention](#per-studio-retention)
  - [Weekly Schedule Intelligence](#weekly-schedule-intelligence)
  - [Instructor Analytics](#instructor-analytics)
  - [Reviews System](#reviews-system)
  - [Studio Sub-Pages](#studio-sub-pages)
  - [Franchise Pipeline](#franchise-pipeline)
  - [Weekly Network Digest](#weekly-network-digest)
  - [Full-Text Search (⌘K)](#full-text-search-k)
  - [AI Intelligence Layer](#ai-intelligence-layer)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Project Structure](#project-structure)
- [Background](#background)
- [Contact](#contact)

---

## Features

### Network Command Center
- **Live studio grid** — every studio at a glance, color-coded by status (healthy, at-risk, new, pre-launch), with week-over-week trend indicators on key KPIs
- **Network-wide KPI bar** — real-time aggregates across all open studios: total active members, network avg occupancy, total weekly revenue, at-risk studio count
- **Alert feed** — active alerts surfaced across all studios with severity tagging; inline accordion expand with one-click resolve

### Network Map
- **Interactive US map** — all studio locations plotted on a zoomable, pannable SVG map of the United States, powered by `react-simple-maps`
- **Status-coded markers** — each pin is colored by studio status (healthy, at-risk, new, pre-launch) with a pulsing ring on at-risk locations
- **Hover tooltips** — hovering a marker surfaces studio name, city, occupancy, and weekly revenue inline
- **Zoom and pan** — full `ZoomableGroup` support for exploring dense market clusters

### Studio Detail
- **KPI cards** — class occupancy, active memberships, weekly revenue, weekly churn, each with WoW delta and directional trend
- **Metric trend charts** — 12-week sparkline charts per metric via Recharts area charts with gradient fills
- **Retention preview** — pulls from the churn model and surfaces risk summary on the main studio page
- **Active alerts** — studio-scoped anomaly feed, same inline expand behavior as the network feed
- **Reviews scroll** — horizontal scroll row of recent reviews from Google and ClassPass, each expandable inline with blue accent on expand, linking through to the full reviews page
- **Metrics comparison** — period-over-period analysis with monthly, quarterly, and yearly aggregation modes; each period shows avg fill rate, total revenue, membership count, and avg churn with a side-by-side comparison view

### Rule-Based Alert Engine
Four alert categories monitored automatically across every studio on every scan:

| Category | Thresholds |
|---|---|
| **Occupancy** | Critical `< 45%` · Warning `< 58%` · Declining trend `< 68%` for 4 consecutive weeks |
| **Churn** | Critical `> 8.5%` · Warning `> 6.0%` · Rising trend `> 3.5%` for 4 consecutive weeks |
| **Membership** | High `> 18%` 6-week drop · Medium `> 10%` · Low 5 consecutive weeks of decline |
| **Revenue** | Medium `> 18%` 6-week drop · Low `> 10%` |

Alerts are regenerated from fresh metrics on each scan, with resolved alerts preserved as history. Each alert message includes specific numbers, trends, and a recommended action.

The dedicated `/alerts` page adds:
- **Severity filter tabs** — filter the full alert list to Critical, Warning, or Advisory with one click
- **Active / Resolved toggle** — switch between open alerts and the resolved history log
- **Detail panel** — click any alert to expand a side panel with full context, category, and a resolve button
- **SSE Live Feed** — a `ReadableStream`-based Server-Sent Events endpoint (`/api/alerts/stream`) pushes new and removed alert IDs to the client without polling; the page shows a pulsing green **LIVE** badge when connected and a yellow toast when new alerts arrive, auto-dismissing after 5 seconds

### Churn Prediction Model
A weighted sigmoid scoring model that generates per-member churn predictions from behavioral and demographic features — no external ML service required.

Five features scored and combined via a learned weight vector:

| Feature | Weight | Description |
|---|---|---|
| Recency | 0.35 | Days since last visit, normalized 0–1 |
| Frequency | 0.28 | Recent visit frequency relative to plan type |
| No-show rate | 0.20 | Proportion of booked classes missed |
| Tenure | 0.10 | Months as a member (inverse — longer = lower risk) |
| Tier | 0.07 | Membership plan (4-class packs are highest risk) |

The raw score is passed through a sigmoid to yield a calibrated churn probability (0–1). Model AUC: **0.841**.

- **Feature importances** — each member's expanded row shows a horizontal bar breakdown of what drove their score (recency, frequency, no-show rate, tenure, tier)
- **Risk tiering** — high (`≥ 0.65`), medium (`0.40–0.65`), low (`< 0.40`) with the threshold scaled to match the studio's actual churn rate
- **Member profiles** — days since last visit, visit frequency delta, no-show rate, membership tier, monthly value, top contributing factors, and a specific suggested action
- **Revenue at risk** — projected annual revenue exposure across high and medium-risk members
- **Deterministic output** — a seeded LCG PRNG keyed to `studioId` generates all member feature values deterministically; the sigmoid model then computes probabilities from those features, so output is stable across renders and deployments
- **15-per-page pagination** — both the per-studio and network-wide member tables paginate at 15 rows with Prev/Next navigation and a "Showing X–Y of Z" count

### Network-Wide Retention Intelligence
A standalone `/churn` dashboard that aggregates churn predictions across every studio into a single actionable view — distinct from the per-studio retention page.

- **Studio risk rankings** — all studios sorted by high-risk member count; each card shows a visual risk bar, high-risk count badge, and at-risk percentage with hover lift interactions
- **Member table** — per-studio member list sorted by churn probability, with inline expand showing risk factors, a plain-language suggested action, and a **Model Feature Weights** bar chart showing each factor's contribution; filterable by risk tier (all / high / medium / low); **paginated at 15 rows** with Prev/Next and "Showing X–Y of Z"
- **Network summary stats** — total members analyzed, high/medium risk counts, and aggregate annual revenue at risk; stat cards with colored top accent strips and hover animations
- **Retention ROI Calculator** — interactive slider: set a retention rate target and instantly see how much annual revenue would be protected across the studio's high-risk members

### Per-Studio Retention
The per-studio `/retention` page shares the same churn model but scoped to one location:

- **At-risk by membership tier** — breakdown panel showing high/medium risk counts and annual revenue at risk separately for Unlimited, 12-Class Monthly, 8-Class Monthly, and 4-Class Monthly members, each with a fill-rate bar
- **Redesigned stat cards** — hover lift, colored top accent strips, and uppercase tracking labels consistent with the network churn page
- **Paginated member table** — same 15-per-page layout as the network view, with feature importance bars on row expand

### Weekly Schedule Intelligence
- **7-day calendar grid** — live class schedule per studio, color-coded by historical fill rate (green ≥ 80%, amber 55–79%, red < 55%)
- **Left accent strip** — each class card has a 3px left border in the fill-rate color for instant pattern recognition across the week
- **Class detail panel** — click any class to see: 8-week fill rate trend chart, booking mix breakdown (Members / Class Packs / ClassPass), plain-language characterization of the booking mix, and trend signal
- **Week navigation** — client-side date shifting; arrows step forward/backward through weeks without any network call, with `isPast` recalculated for each class slot relative to the current time
- **Duplicate deduplication** — same-start-time classes within a day are collapsed to one entry

### Instructor Analytics
- **Slot-level stats** — average fill rate, booking mix, and 4-week vs prior trend computed per day-of-week + time-slot combination
- **Instructor fill rate ranking** — each instructor ranked by average fill rate across all their slots
- **Instructor mention detection** — word-boundary regex (`\bFirstName\b`, min 3 chars) scans all review text to identify which reviews reference specific instructors
- **Per-instructor review pages** — dedicated page per instructor showing: rating breakdown bars, all reviews mentioning them, and a profile card with aggregate rating
- **Instructor sidebar** — sticky panel on the reviews page listing every instructor with detected mentions, their aggregate rating, and mention count, linking through to their individual page

### Reviews System
- **Source-separated full reviews page** — Google and ClassPass sections with aggregate ratings per source
- **Inline expand** — every review card expands in place (no modal) via `max-height` CSS transitions, with chevron rotation and blue border accent on expand
- **Horizontal scroll preview** — condensed review row on studio overview and classes pages with a "View all →" end card
- **Hover interactions** — `translateY(-2px)` lift + blue border on hover across all review surfaces

### Studio Sub-Pages
Every live studio has a full suite of operational pages accessible via the persistent sidebar:

- **Classes** — booking mix, weekly schedule, slot analytics, period comparison, reviews
- **Sales** — KPI stat cards with hover tooltips (total revenue, units sold, top product, avg order value); revenue trend area chart with month-over-month delta in the tooltip; stacked bar chart by product category; paginated product-level table; **PDF export** of the full product breakdown for any selected month
- **Operations** — lease expiry, landlord contacts, alarm company, HVAC contract, electrician, internet/Wi-Fi
- **Inventory** — month-by-month stock levels for retail and supplies; mini stock-level bars per item; status pills with colored dots (OK / Low Stock / Out of Stock); alert-colored stat cards for low and out-of-stock counts; inline quantity editing; **PDF export** of the full inventory snapshot
- **Settings** — studio info, staff roster with certification status and performance scores

### Franchise Pipeline
A `/pipeline` page for tracking prospective franchise locations from first contact through pre-sales.

- **Kanban board** — draggable cards organized across five stages: Discovery, Agreement Signed, Site Selected, Permits & Construction, and Pre-Sales; each card shows franchisee name, market, territory type, expected open date, and checklist progress (docs, lease, training)
- **New lead modal** — "+ Add Lead" button per column opens an in-page modal with fields for franchisee name, assigned HQ contact, market/city, state, pipeline stage, territory type (suburban / urban / rural / resort), expected open date, and free-text notes; creates the lead via `POST /api/pipeline` and inserts it into the board without a page reload
- **Stage progress dots** — each card shows a 5-dot progress strip with the current stage highlighted, so stage position is visible at a glance
- **Pipeline summary bar** — count of leads per stage plus a stalled lead indicator (flagging any lead inactive for 14+ days)
- **Stage entry timestamps** — each lead tracks when it entered its current stage, enabling stall detection

### Weekly Network Digest
A `/digest` page that generates a printable weekly performance report for the entire franchise network.

- **Network KPI snapshot** — active members, network avg occupancy, and total weekly revenue with week-over-week deltas
- **Studio count breakdown** — total studios, healthy, at-risk, and pre-launch counts at a glance
- **Top studios table** — top 5 studios ranked by weekly revenue with fill rate
- **Active alerts summary** — critical and warning counts with the top alerts listed inline
- **At-risk studio detail** — table of at-risk studios with fill rate, membership, revenue, and churn for each
- **New studio ramp progress** — ramp progress bars showing fill rate and membership counts for newly opened locations
- **AI Executive Summary** — a "Generate Summary" button streams a 3-paragraph executive briefing via Gemini 2.5 Flash, grounded in the page's live KPI payload; text streams token-by-token with an animated cursor, then shows a "Regenerate" button and timestamp when complete; gracefully degrades with an instructional message if no API key is configured
- **Print/export** — one-click browser print with a formatted print layout (screen chrome hidden, print header and footer injected; AI summary hidden in print)

### Full-Text Search (⌘K)
A global command palette powered by SQLite FTS5 — accessible from anywhere in the app via `⌘K` (or `Ctrl+K`).

- **FTS5 virtual table** — a `unicode61`-tokenized FTS5 virtual table over all studios, reviews, and instructors; built lazily on first search and kept in a singleton `better-sqlite3` connection separate from Prisma
- **Prefix matching** — every query term is automatically suffixed with `*` so partial words surface relevant results instantly
- **Result types** — Studio (navy badge), Review (purple), Instructor (teal); results are ranked by FTS5 relevance
- **Debounced input** — 140ms debounce on keystroke to avoid re-querying on every character
- **Keyboard navigation** — arrow keys move focus through results; Enter navigates to the selected item; Escape closes
- **Footer attribution** — the palette footer shows "SQLite FTS5" to surface the underlying technology
- Index covers 1,601 documents (69 studios + instructor and review records) and rebuilds automatically on new data

### AI Intelligence Layer
Two Gemini 2.5 Flash streaming surfaces, both using raw `fetch` against Google's SSE endpoint — no additional SDK required.

**Network Intelligence Brief** (Alerts page → Scan Network)
After a rule-based scan generates fresh alerts, a "Scan Network" button triggers a streaming 3-paragraph brief grounded in live network data: overall health, top risks with recommended actions, and one forward-looking observation.

**AI Executive Summary** (Digest page → Generate Summary)
On-demand executive briefing grounded in the digest's weekly KPI payload: member counts, revenue, occupancy, at-risk studios, and alert summaries. Streams token-by-token with a blinking cursor; includes attribution label and date.

Both endpoints share the same SSE buffer flush pattern:
```
buffer → split on \n → parse `data:` lines → JSON decode → extract text token → enqueue
flush() called on every chunk AND on stream done (catches partial final line)
```
`thinkingConfig: { thinkingBudget: 0 }` disables Gemini 2.5 Flash's internal reasoning tokens, which otherwise consume the output budget before the visible response begins.

---

<img width="1469" height="801" alt="Screenshot 2026-06-12 at 2 42 59 PM" src="https://github.com/user-attachments/assets/7c651ba2-fa20-411a-9473-120aae90191d" />


---

<img width="1467" height="802" alt="Screenshot 2026-06-12 at 2 38 28 PM" src="https://github.com/user-attachments/assets/8e9c9e38-8064-45a7-bc0e-07f27d3573d2" />


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
         │  /api/studios/[id]/   │
         │    schedule           │
         │    instructors        │
         │    sales              │
         │    operations         │
         │    inventory          │
         │  /api/anomalies/      │
         │    generate  ← scan   │
         │    brief     ← AI SSE │
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

### Server / Client Boundary
Data fetching and business logic live in server components and API routes. Client components handle only what requires the browser: click handlers, transitions, chart rendering, and navigation state. Serializable props only cross the boundary — no Prisma types or functions passed to client components.

### Key Design Decisions
- **Sigmoid churn model over pure PRNG** — seeded LCG generates deterministic behavioral features (recency, frequency, no-show rate, tenure, tier); a real weighted sigmoid model then computes probability from those features, so output is reproducible while the scoring logic is genuinely ML-shaped
- **Separate `better-sqlite3` connection for FTS5** — Prisma's query builder can't express FTS5 `MATCH` syntax; a second raw connection with `busy_timeout = 5000` keeps FTS operations clean without lock contention
- **Raw `fetch` over Google AI SDK** — avoids adding a new dependency; Gemini's `?alt=sse` endpoint is fully compatible with the standard `fetch` + `ReadableStream` pattern
- **SSE over WebSocket for alerts** — alerts are server-push only; SSE's unidirectional model is simpler, works over standard HTTP/2, and needs no upgrade handshake
- **Rule-based alerts over ML** — thresholds are explicitly defined, human-auditable, and tunable; gives ops teams full transparency into why an alert fired
- **Client-side week shifting** — schedule week navigation shifts base dates mathematically rather than re-fetching, keeping navigation instant and the demo self-contained
- **Instructor NLP on the server** — mention detection runs server-side during page render so no regex work hits the client

---

## Data Model

```
Studio
  ├── StudioMetric[]      weekly KPIs (fill rate, memberships, revenue, churn, booking mix)
  ├── Instructor[]        staff with roles, cert status, performance scores
  ├── Anomaly[]           generated alerts with severity + category
  ├── Review[]            Google & ClassPass reviews with ratings
  ├── ClassMetric[]       per-slot historical fill data (day × time × week)
  ├── SalesRecord[]       monthly revenue by product and category
  │                         products: grip socks, water, energy drinks, JETSET merch,
  │                         class packages, memberships, gift cards
  ├── InventoryItem[]     monthly stock levels with reorder thresholds
  │                         categories: retail (apparel, accessories, drinks) + supplies
  │                         (reformer parts, cleaning, disposables)
  └── StudioOperations    lease, alarm, HVAC, utilities, contacts (1:1)

FranchiseLead
  ├── stage               Discovery → Agreement Signed → Site Selected →
  │                         Permits & Construction → Pre-Sales
  ├── territoryType       suburban / urban / rural / resort
  ├── stageEnteredAt      timestamp for stall detection
  ├── assignedTo          HQ contact name
  └── checklist fields    docsComplete, leaseComplete, trainingBooked
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 + Tailwind CSS v4 |
| Data viz | Recharts 3 |
| ORM | Prisma 7 |
| Database | SQLite via better-sqlite3 |
| Full-text search | SQLite FTS5 (unicode61 tokenizer, prefix matching) |
| AI / LLM | Google Gemini 2.5 Flash (streaming via `fetch` + SSE) |
| Real-time | Server-Sent Events (`ReadableStream` + `EventSource`) |
| Map | react-simple-maps + us-atlas topojson |
| Animations | CSS `max-height` transitions + `cubic-bezier` easing |
| Package manager | npm |

---

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/mariarodr1136/JETSET-Franchise-Intelligence.git
cd JETSET-Franchise-Intelligence/dashboard
npm install

# 2. Generate Prisma client and seed the database
npx prisma generate
npx tsx prisma/seed.ts

# 3. (Optional) Enable AI features
#    Get a free API key at https://aistudio.google.com/apikey
echo "GEMINI_API_KEY=your_key_here" >> .env.local

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the network overview.

Without a `GEMINI_API_KEY`, all non-AI features work normally. The "Generate Summary" and "Scan Network" AI brief buttons will show a graceful instructional message instead of streaming output.

### Regenerate Alerts
After seeding, generate the initial alert set by calling:
```bash
curl -X POST http://localhost:3000/api/anomalies/generate
```
Or trigger it from the Scan button on the network overview page.

---

<img width="1470" height="801" alt="Screenshot 2026-06-12 at 2 38 49 PM" src="https://github.com/user-attachments/assets/c2be7d53-c702-413a-aae3-fa8a5f193b2f" />

---


## Project Structure

```
dashboard/
├── prisma/
│   ├── schema.prisma          data model
│   └── seed.ts                synthetic studio + metric generation
├── src/
│   ├── app/
│   │   ├── page.tsx           network overview (home)
│   │   ├── alerts/            network-wide alert center
│   │   ├── churn/             network-wide retention intelligence
│   │   ├── digest/            weekly network digest (printable)
│   │   ├── pipeline/          franchise pipeline kanban
│   │   ├── api/
│   │   │   ├── anomalies/
│   │   │   │   ├── generate/  rule-based alert scan
│   │   │   │   └── brief/     Gemini streaming intelligence brief
│   │   │   ├── alerts/
│   │   │   │   └── stream/    SSE live alert feed
│   │   │   ├── churn/         weighted sigmoid churn predictions
│   │   │   ├── digest/
│   │   │   │   └── summary/   Gemini streaming executive summary
│   │   │   ├── pipeline/      franchise lead CRUD
│   │   │   └── search/        FTS5 full-text search
│   │   └── studios/[id]/
│   │       ├── page.tsx       studio overview
│   │       ├── classes/       schedule + analytics
│   │       ├── sales/         revenue breakdown
│   │       ├── operations/    facilities + contacts
│   │       ├── inventory/     stock tracking
│   │       ├── settings/      studio config
│   │       ├── retention/     churn model
│   │       └── reviews/
│   │           ├── page.tsx   full reviews page
│   │           └── instructors/[iid]/  per-instructor reviews
│   ├── components/
│   │   ├── AlertsGrid.tsx     SSE-connected alert feed with LIVE badge
│   │   ├── DigestAISummary.tsx  streaming AI executive summary
│   │   ├── DigestSections.tsx printable digest client component
│   │   ├── GlobalSearch.tsx   ⌘K command palette (FTS5-backed)
│   │   └── RetentionPageContent.tsx  paginated member table + feature bars
│   ├── lib/
│   │   ├── churn.ts           weighted sigmoid churn model
│   │   ├── fts.ts             SQLite FTS5 index + search helpers
│   │   ├── schedule.ts        schedule fetching + dedup
│   │   └── utils.ts           formatting helpers
│   └── types/
│       └── churn.ts           ChurnMember + FeatureImportance interfaces
└── public/
    └── jetset-logo-transparent.png
```

---

## Background

This project was built to demonstrate what a purpose-built internal tool for a fitness franchise network could look like — one designed with real operational problems in mind.

The alert engine thresholds, churn model risk factors, and operations data structure reflect the kinds of decisions and data points that matter most at the franchise management level.

---

## Contact 

If you have any questions or feedback, feel free to reach out at [mrodr.contact@gmail.com](mailto:mrodr.contact@gmail.com).

*This is an independent demo project and is not officially affiliated with, endorsed by, or implemented at JETSET Pilates. All studio data is synthetically generated.*
