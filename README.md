# SMJ Production Logger

A mobile-first Next.js app for shift supervisors at **S.M. Jaleel & Company** to log production quantities and downtime events against Epicor ERP jobs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Job data | Epicor ERP BAQ via OData |
| Hosting | Vercel |

---

## Features

- **Shift selection** — Day (07:00–19:00) or Night (19:00–07:00), auto-detected from current time
- **Job browser** — pulls open FG jobs from Epicor BAQ, searchable by job #, product, or brand
- **Production log** — cases produced, cases rejected, notes, per-job per-shift
- **Downtime logging** — categorised events (Mechanical, Utility failure, Quality hold, etc.) with duration calculation
- **Shift summary** — yield rate, totals, full breakdown before submission
- **Supabase write-back** — all data lands in PostgreSQL, ready for Power BI reporting

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── jobs/route.ts        # GET  → Epicor BAQ proxy
│   │   ├── logs/route.ts        # POST → Supabase production_logs
│   │   ├── downtime/route.ts    # POST → Supabase downtime_events
│   │   └── submit/route.ts      # POST → Supabase shift_reports
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                 # App shell + state
├── components/
│   ├── SMJLogo.tsx
│   ├── TopBar.tsx
│   ├── BottomTabBar.tsx
│   ├── ShiftSelector.tsx
│   ├── JobCard.tsx
│   ├── BottomSheet.tsx
│   ├── JobsTab.tsx
│   ├── LogEntryTab.tsx
│   ├── DowntimeTab.tsx
│   └── SummaryTab.tsx
├── lib/
│   ├── constants.ts             # Shifts, lines, downtime categories
│   ├── epicor.ts                # BAQ fetcher (server-side)
│   ├── supabase.ts              # Supabase client
│   └── utils.ts                 # cn() helper
└── types/
    └── index.ts                 # All TypeScript interfaces
supabase/
└── schema.sql                   # Run once in Supabase SQL Editor
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/smj-production-logger.git
cd smj-production-logger
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
# Supabase — get these from your Supabase project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Epicor OData endpoint (server-side only — never exposed to the browser)
NEXT_PUBLIC_EPICOR_BASE_URL=https://your-epicor/api/v2/odata/SMJ-02
EPICOR_API_KEY=your-epicor-api-key
```

> **Note:** If `EPICOR_API_KEY` is absent, the app automatically falls back to mock job data so you can develop and demo without Epicor access.

### 3. Set up Supabase tables

Open your Supabase project → SQL Editor → paste and run `supabase/schema.sql`.

This creates:
- `production_logs`
- `downtime_events`
- `shift_reports`

with RLS policies and indexes for reporting.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app is sized for mobile. Use browser DevTools device emulation (iPhone 14 Pro recommended).

---

## Deploy to Vercel

### Via Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### Via GitHub

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in the Vercel project settings (same keys as `.env.local`)
4. Deploy

---

## Epicor BAQ Setup

The app calls the BAQ named `OpenJobs` via OData. The BAQ should expose at minimum:

| Field | Source |
|---|---|
| `JobHead_JobNum` | JobHead |
| `JobHead_PartNum` | JobHead |
| `JobHead_PartDescription` | JobHead |
| `JobHead_ProdQty` | JobHead |
| `JobHead_ReqDueDate` | JobHead |
| `JobHead_JobReleased` | JobHead |
| `JobHead_JobHeld` | JobHead |
| `JobHead_JobClosed` | JobHead |
| `Part_ClassID` | Part |
| `Part_CommercialBrand` | Part |
| `Part_CommercialSize1` | Part |
| `Part_CommercialSize2` | Part |
| `Part_CommercialColor` | Part |

The API route at `src/app/api/jobs/route.ts` filters to `Part_ClassID eq 'FG'` and `JobHead_JobClosed eq false`. Adjust the OData `$filter` in `src/lib/epicor.ts` if your BAQ name or company code differs.

---

## Power BI Connectivity

All shift data writes to Supabase. Connect Power BI to Supabase via:

- **PostgREST REST API** (no gateway needed) — use the existing pattern from your SMJ warehouse
- Query `production_logs`, `downtime_events`, and `shift_reports` tables
- The `shift_date` column (date of shift start) joins cleanly to your Date dimension

Key measures to build:
- Cases produced by shift / line / brand / date
- Rejection rate %
- Total downtime minutes by category
- Shift completion rate

---

## Supabase Tables Quick Reference

### `production_logs`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| job_num | text | Epicor job number |
| job_description | text | |
| brand | text | Commercial brand |
| shift | text | `day` or `night` |
| shift_date | date | Date shift started |
| line | text | Production line |
| cases_produced | integer | |
| cases_rejected | integer | |
| notes | text | |
| supervisor_name | text | |
| submitted_at | timestamptz | |

### `downtime_events`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| shift | text | `day` or `night` |
| shift_date | date | |
| line | text | |
| category | text | Mechanical, Utility failure, etc. |
| start_time | text | HH:MM |
| end_time | text | HH:MM |
| duration_minutes | integer | Calculated |
| description | text | |
| supervisor_name | text | |

### `shift_reports`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| shift | text | |
| shift_date | date | |
| line | text | |
| supervisor_name | text | |
| total_cases_produced | integer | |
| total_cases_rejected | integer | |
| total_downtime_minutes | integer | |
| production_logs | jsonb | Full snapshot |
| downtime_events | jsonb | Full snapshot |
| submitted_at | timestamptz | |
