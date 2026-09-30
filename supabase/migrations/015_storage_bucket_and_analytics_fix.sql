-- ==============================================================================
-- MIGRATION 015: SUPABASE STORAGE BUCKET & DATABASE TABLES ACCESS FIX
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- 
-- Fixes:
-- 1. "GET /rest/v1/analytics?order=created_at.desc 400 Bad Request"
-- 2. Ensures the 'portfolio-media' storage bucket is created and set to public
-- 3. Grants full CMS CRUD access for products, portfolio shots, projects, and media
--
-- Note: Internal system table 'storage.objects' is managed by Supabase's internal
-- service role. This script only touches tables and buckets where you have full permissions,
-- completely avoiding the "ERROR: 42501: must be owner of table objects" error.

-- ==============================================================================
-- 1. CONFIGURE STORAGE BUCKET ('portfolio-media')
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  52428800, -- 50MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif', 'video/mp4', 'video/webm'];

-- ==============================================================================
-- 2. FIX ANALYTICS TABLE (created_at & viewed_at columns, plus RLS)
-- ==============================================================================
alter table if exists public.analytics 
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.analytics 
  add column if not exists viewed_at timestamptz not null default now();

alter table if exists public.analytics enable row level security;

drop policy if exists "Allow all insert analytics" on public.analytics;
create policy "Allow all insert analytics"
  on public.analytics for insert
  to public
  with check (true);

drop policy if exists "Allow all select analytics" on public.analytics;
create policy "Allow all select analytics"
  on public.analytics for select
  to public
  using (true);

drop policy if exists "Allow all delete analytics" on public.analytics;
create policy "Allow all delete analytics"
  on public.analytics for delete
  to public
  using (true);

-- ==============================================================================
-- 3. ENSURE CMS PRODUCT, PORTFOLIO & PROJECT TABLES HAVE FULL ACCESS
-- ==============================================================================
alter table if exists public.product_shots enable row level security;
drop policy if exists "Allow full CRUD on product_shots" on public.product_shots;
create policy "Allow full CRUD on product_shots"
  on public.product_shots for all
  to public
  using (true)
  with check (true);

alter table if exists public.portfolio_shots enable row level security;
drop policy if exists "Allow full CRUD on portfolio_shots" on public.portfolio_shots;
create policy "Allow full CRUD on portfolio_shots"
  on public.portfolio_shots for all
  to public
  using (true)
  with check (true);

alter table if exists public.projects enable row level security;
drop policy if exists "Allow full CRUD on projects" on public.projects;
create policy "Allow full CRUD on projects"
  on public.projects for all
  to public
  using (true)
  with check (true);

alter table if exists public.project_media enable row level security;
drop policy if exists "Allow full CRUD on project_media" on public.project_media;
create policy "Allow full CRUD on project_media"
  on public.project_media for all
  to public
  using (true)
  with check (true);

alter table if exists public.project_sections enable row level security;
drop policy if exists "Allow full CRUD on project_sections" on public.project_sections;
create policy "Allow full CRUD on project_sections"
  on public.project_sections for all
  to public
  using (true)
  with check (true);

alter table if exists public.categories enable row level security;
drop policy if exists "Allow full CRUD on categories" on public.categories;
create policy "Allow full CRUD on categories"
  on public.categories for all
  to public
  using (true)
  with check (true);
