-- ============================================================
-- SMJ Production Logger — Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables
-- ============================================================

-- Production logs (one row per job logged per shift)
create table if not exists production_logs (
  id               uuid primary key default gen_random_uuid(),
  job_num          text not null,
  job_description  text,
  brand            text,
  shift            text not null check (shift in ('day', 'night')),
  shift_date       date not null,
  line             text not null,
  cases_produced   integer not null check (cases_produced >= 0),
  cases_rejected   integer not null default 0 check (cases_rejected >= 0),
  notes            text,
  supervisor_name  text,
  submitted_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- Downtime events
create table if not exists downtime_events (
  id               uuid primary key default gen_random_uuid(),
  shift            text not null check (shift in ('day', 'night')),
  shift_date       date not null,
  line             text not null,
  category         text not null,
  start_time       text not null,   -- stored as HH:MM string
  end_time         text not null,
  duration_minutes integer,
  description      text,
  supervisor_name  text,
  logged_at        timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- Shift reports (one row per submitted shift report)
create table if not exists shift_reports (
  id                      uuid primary key default gen_random_uuid(),
  shift                   text not null check (shift in ('day', 'night')),
  shift_date              date not null,
  line                    text not null,
  supervisor_name         text,
  total_cases_produced    integer not null default 0,
  total_cases_rejected    integer not null default 0,
  total_downtime_minutes  integer not null default 0,
  production_logs         jsonb,   -- snapshot of all log entries
  downtime_events         jsonb,   -- snapshot of all downtime entries
  submitted_at            timestamptz not null default now(),
  created_at              timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- Enable RLS but allow anon INSERT (supervisors are not authed)
-- For a production deployment, consider adding JWT auth.
-- ============================================================

alter table production_logs enable row level security;
alter table downtime_events enable row level security;
alter table shift_reports enable row level security;

-- Allow anonymous inserts (app runs without auth)
create policy "anon can insert production_logs"
  on production_logs for insert to anon with check (true);

create policy "anon can insert downtime_events"
  on downtime_events for insert to anon with check (true);

create policy "anon can insert shift_reports"
  on shift_reports for insert to anon with check (true);

-- Allow anonymous reads (for summary / history views)
create policy "anon can read production_logs"
  on production_logs for select to anon using (true);

create policy "anon can read downtime_events"
  on downtime_events for select to anon using (true);

create policy "anon can read shift_reports"
  on shift_reports for select to anon using (true);

-- ============================================================
-- Indexes for Power BI / reporting queries
-- ============================================================

create index if not exists idx_production_logs_shift_date
  on production_logs (shift_date, shift, line);

create index if not exists idx_downtime_events_shift_date
  on downtime_events (shift_date, shift, line);

create index if not exists idx_shift_reports_shift_date
  on shift_reports (shift_date, shift);
