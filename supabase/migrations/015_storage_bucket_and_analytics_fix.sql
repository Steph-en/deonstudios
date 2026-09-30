-- ==============================================================================
-- MIGRATION 015: SUPABASE STORAGE BUCKET RLS & ANALYTICS FIX
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- 
-- Fixes:
-- 1. "Upload failed: new row violates row-level security policy" on portfolio-media bucket
-- 2. "GET /rest/v1/analytics?order=created_at.desc 400 Bad Request"
-- 3. Ensures complete RLS access for CMS media upload, product shots, portfolio, and projects.

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

-- Enable RLS on storage.objects (if not already enabled)
alter table if exists storage.objects enable row level security;

-- Drop any existing conflicting policies on storage.objects for portfolio-media
drop policy if exists "Public Access to Portfolio Media" on storage.objects;
drop policy if exists "Authenticated Upload to Portfolio Media" on storage.objects;
drop policy if exists "Authenticated Update to Portfolio Media" on storage.objects;
drop policy if exists "Authenticated Delete from Portfolio Media" on storage.objects;
drop policy if exists "Allow Public Select Portfolio Media" on storage.objects;
drop policy if exists "Allow Public Upload Portfolio Media" on storage.objects;
drop policy if exists "Allow Public Update Portfolio Media" on storage.objects;
drop policy if exists "Allow Public Delete Portfolio Media" on storage.objects;
drop policy if exists "Allow All Select Portfolio Media" on storage.objects;
drop policy if exists "Allow All Upload Portfolio Media" on storage.objects;
drop policy if exists "Allow All Update Portfolio Media" on storage.objects;
drop policy if exists "Allow All Delete Portfolio Media" on storage.objects;

-- Create comprehensive Storage Policies allowing CMS uploads and public views:
-- 1. READ / DOWNLOAD: Anyone can view and download public portfolio media
create policy "Allow All Select Portfolio Media"
  on storage.objects for select
  to public
  using (bucket_id = 'portfolio-media');

-- 2. UPLOAD / INSERT: Allow CMS users to upload images and videos
create policy "Allow All Upload Portfolio Media"
  on storage.objects for insert
  to public
  with check (bucket_id = 'portfolio-media');

-- 3. UPDATE: Allow CMS users to update existing media files
create policy "Allow All Update Portfolio Media"
  on storage.objects for update
  to public
  using (bucket_id = 'portfolio-media');

-- 4. DELETE: Allow CMS users to delete media files
create policy "Allow All Delete Portfolio Media"
  on storage.objects for delete
  to public
  using (bucket_id = 'portfolio-media');

-- ==============================================================================
-- 2. FIX ANALYTICS TABLE (created_at column & RLS)
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
