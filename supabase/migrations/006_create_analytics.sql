-- Migration 006: Analytics Table
create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  country text,
  device text check (device in ('mobile', 'tablet', 'desktop')),
  traffic_source text,
  page_url text,
  user_session_id text,
  viewed_at timestamptz not null default now()
);
