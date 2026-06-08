# JETSET Pilates — Franchise Intelligence Dashboard 📊 🏢

![Next.js](https://img.shields.io/badge/Next.js-Framework-black)
![React](https://img.shields.io/badge/React-UI%20Library-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-Language-3178C6)
![Tailwind%20CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-06B6D4)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57)
![Recharts](https://img.shields.io/badge/Recharts-Data%20Visualization-22C55E)
![OpenAI](https://img.shields.io/badge/OpenAI-AI%20Integration-412991)
![Radix%20UI](https://img.shields.io/badge/Radix%20UI-Component%20Library-purple)

A full-stack internal analytics platform for franchise headquarters to monitor, diagnose, and act on performance data across an entire studio network — in real time, from a single interface.

This is a demo build of what a purpose-built franchise ops tool could look like at scale.

---

## What It Does

Running a multi-location fitness franchise means managing dozens of studios, hundreds of instructors, and thousands of members — without a unified view of what's actually happening on the ground. This dashboard solves that.

From the network home page, operators get an instant read on every studio: occupancy rates, active memberships, weekly revenue, churn, and live alerts for anything that needs attention. One click drills into any studio with full historical metrics, a live class schedule, revenue breakdowns, operations contacts, inventory levels, and member reviews — organized into a clean, navigable interface designed for the way ops teams actually work.

---

Live Application: XXX

*Note: The live application is hosted on Render's free tier, so the backend may take 1–2 minutes to wake up on the first visit after inactivity.*

---

## Table of Contents

- [What It Does](#what-it-does)
- [Features](#features)
  - [Network Command Center](#network-command-center)
  - [Studio Detail](#studio-detail)
  - [Rule-Based Alert Engine](#rule-based-alert-engine)
  - [Churn Prediction Model](#churn-prediction-model)
  - [Weekly Schedule Intelligence](#weekly-schedule-intelligence)
  - [Instructor Analytics](#instructor-analytics)
  - [Reviews System](#reviews-system)
  - [Studio Sub-Pages](#studio-sub-pages)
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

### Studio Detail
- **KPI cards** — class occupancy, active memberships, weekly revenue, weekly churn, each with WoW delta and directional trend
- **Metric trend charts** — 12-week sparkline charts per metric via Recharts area charts with gradient fills
- **Retention preview** — pulls from the churn model and surfaces risk summary on the main studio page
- **Active alerts** — studio-scoped anomaly feed, same inline expand behavior as the network feed
- **Reviews scroll** — horizontal scroll row of recent reviews from Google and ClassPass, each expandable inline with blue accent on expand, linking through to the full reviews page

### Rule-Based Alert Engine
Four alert categories monitored automatically across every studio on every scan:

| Category | Thresholds |
|---|---|
| **Occupancy** | Critical `< 45%` · Warning `< 58%` · Declining trend `< 68%` for 4 consecutive weeks |
| **Churn** | Critical `> 8.5%` · Warning `> 6.0%` · Rising trend `> 3.5%` for 4 consecutive weeks |
| **Membership** | High `> 18%` 6-week drop · Medium `> 10%` · Low 5 consecutive weeks of decline |
| **Revenue** | Medium `> 18%` 6-week drop · Low `> 10%` |

Alerts are regenerated from fresh metrics on each scan, with resolved alerts preserved as history. Each alert message includes specific numbers, trends, and a recommended action.

### Churn Prediction Model
A deterministic, seeded probabilistic model that generates per-member churn predictions from studio-level metric data — no external ML service required.

- **Risk tiering** — high, medium, and low buckets scaled to the studio's actual churn rate and status
- **Member profiles** — each at-risk member gets: days since last visit, visit frequency delta, no-show rate, membership tier, monthly value, top contributing factors, and a specific suggested action
- **Revenue at risk** — projected annual revenue exposure across high and medium-risk members
- **Deterministic output** — same studio always produces the same member list; no randomness between page loads
- Seeded PRNG using a linear congruential generator keyed to studio ID — privacy-safe, no real member data required

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
- **Sales** — revenue by product and category, monthly trends
- **Operations** — lease expiry, landlord contacts, alarm company, HVAC contract, electrician, internet/Wi-Fi
- **Inventory** — month-by-month stock levels with opening/closing quantities and reorder alerts
- **Settings** — studio info, staff roster with certification status and performance scores

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
│  Churn model                Accordion expand             │
│  Instructor mentions        Schedule navigation          │
│  Page layouts               Hover effects                │
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
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Prisma ORM          │
         │   SQLite (dev.db)     │
         └───────────────────────┘
```

### Server / Client Boundary
Data fetching and business logic live in server components and API routes. Client components handle only what requires the browser: click handlers, transitions, chart rendering, and navigation state. Serializable props only cross the boundary — no Prisma types or functions passed to client components.

### Key Design Decisions
- **Deterministic churn model** — uses a seeded LCG PRNG keyed to `studioId` so output is stable across renders and deployments without storing synthetic member data
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
  ├── InventoryItem[]     monthly stock levels with reorder thresholds
  └── StudioOperations    lease, alarm, HVAC, utilities, contacts (1:1)
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

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the network overview.

### Regenerate Alerts
After seeding, generate the initial alert set by calling:
```bash
curl -X POST http://localhost:3000/api/anomalies/generate
```
Or trigger it from the Scan button on the network overview page.

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
│   ├── components/            all UI components
│   ├── lib/
│   │   ├── churn.ts           churn prediction model
│   │   ├── schedule.ts        schedule fetching + dedup
│   │   └── utils.ts           formatting helpers
│   └── types/                 shared TypeScript interfaces
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
