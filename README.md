# JETSET Pilates — Franchise Intelligence Dashboard

A full-stack analytics platform for franchise headquarters to monitor, diagnose, and act on performance across an entire studio network — real-time KPIs, predictive churn scoring, automated alerts, and AI-generated briefings in a single interface.

**Live demo:** https://jetset-franchise-intelligence.onrender.com/
*(Hosted on Render's free tier — the backend may take 1–2 minutes to wake on first visit.)*

![Next.js](https://img.shields.io/badge/Next.js-Framework-black)
![React](https://img.shields.io/badge/React-UI%20Library-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-Language-3178C6)
![Tailwind%20CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-06B6D4)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57)
![Gemini](https://img.shields.io/badge/Gemini-AI%20Integration-4285F4)

https://github.com/user-attachments/assets/b33ed8c9-ccf6-467a-ae27-8e3a571b0c48

---

## Highlights

- **Network command center** — live grid of every studio, color-coded by health status, with network-wide KPIs (members, occupancy, revenue, churn) and an interactive US map of all locations
- **Churn prediction model** — a weighted sigmoid model scores every member on five behavioral features (recency, frequency, no-show rate, tenure, tier), with per-member feature-importance breakdowns, risk tiering, and projected revenue at risk (AUC 0.841)
- **Rule-based alert engine** — automated scans across four categories (occupancy, churn, membership, revenue) with explicit, auditable thresholds; new alerts push to the client live over Server-Sent Events
- **AI intelligence layer** — Gemini 2.5 Flash streams executive briefings and network scans grounded in live data, using raw `fetch` + SSE with no extra SDK
- **Global full-text search (⌘K)** — command palette backed by a SQLite FTS5 index over 1,600+ studios, reviews, and instructors, with prefix matching and keyboard navigation
- **Studio benchmarking & instructor roster** — side-by-side comparison of any two studios with dual-line trend charts, plus a network-wide instructor roster with performance tiers, certification tracking, and overdue-evaluation detection
- **Deep per-studio operations** — schedule intelligence with fill-rate heatmaps, instructor analytics with NLP review-mention detection, sales and inventory tracking with PDF export, a maintenance tracker, and a franchise pipeline kanban with stall detection
- **Printable weekly digest** — one-click network performance report with an on-demand streaming AI executive summary

<img width="1469" height="801" alt="Network overview" src="https://github.com/user-attachments/assets/7c651ba2-fa20-411a-9473-120aae90191d" />

<img width="1467" height="802" alt="Studio detail" src="https://github.com/user-attachments/assets/8e9c9e38-8064-45a7-bc0e-07f27d3573d2" />

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| Styling | Tailwind CSS v4 · Recharts |
| Data | Prisma 7 · SQLite (better-sqlite3) · FTS5 full-text search |
| AI | Google Gemini 2.5 Flash (streaming via SSE) |
| Real-time | Server-Sent Events (`ReadableStream` + `EventSource`) |
| Map | react-simple-maps + us-atlas |

## Architecture Notes

Data fetching and business logic live in React Server Components and API routes; client components handle only browser concerns (interaction, charts, navigation state). A few deliberate decisions:

- **Real scoring model over faked numbers** — a seeded PRNG generates deterministic member features, then a genuine weighted sigmoid computes churn probabilities, so results are reproducible and the scoring logic is ML-shaped
- **Rule-based alerts over ML** — thresholds are explicit and human-auditable, giving ops teams full transparency into why an alert fired
- **SSE over WebSocket** — alerts are server-push only; SSE is simpler and needs no upgrade handshake
- **Separate `better-sqlite3` connection for FTS5** — Prisma can't express FTS5 `MATCH` queries, so search runs on a dedicated raw connection

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

# 3. (Optional) Enable AI features — free key at https://aistudio.google.com/apikey
echo "GEMINI_API_KEY=your_key_here" >> .env.local

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a `GEMINI_API_KEY`, all non-AI features work normally.

To generate the initial alert set after seeding, use the Scan button on the network overview, or:

```bash
curl -X POST http://localhost:3000/api/anomalies/generate
```

## Project Structure

```
dashboard/
├── prisma/                  schema + synthetic data seeding
├── src/
│   ├── app/
│   │   ├── page.tsx         network overview (home)
│   │   ├── alerts/          alert center (SSE live feed)
│   │   ├── churn/           network-wide retention intelligence
│   │   ├── compare/         side-by-side studio benchmarking
│   │   ├── instructors/     network-wide instructor IP roster
│   │   ├── digest/          printable weekly digest + AI summary
│   │   ├── pipeline/        franchise pipeline kanban
│   │   ├── hub/             studio knowledge hub
│   │   ├── api/             REST routes: alerts, churn, search, AI streaming
│   │   └── studios/[id]/    per-studio pages: classes, sales, operations,
│   │                        inventory, maintenance, retention, reviews, settings
│   ├── components/          GlobalSearch (⌘K), AlertsGrid, digest, retention
│   ├── lib/                 churn model, FTS5 index, schedule helpers
│   └── types/
└── public/
```

---

## Contact

Questions or feedback: [mrodr.contact@gmail.com](mailto:mrodr.contact@gmail.com)

*This is an independent demo project and is not officially affiliated with, endorsed by, or implemented at JETSET Pilates. All studio data is synthetically generated.*
