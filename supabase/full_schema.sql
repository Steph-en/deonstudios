-- ==============================================================================
-- DEON STUDIOS — COMPLETE SUPABASE DATABASE SETUP SCRIPT
-- ==============================================================================
-- Run this complete script in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New Query -> Run).
-- It will:
--   1. Enable UUID extensions
--   2. Create all required tables (profiles, categories, projects, project_media, 
--      project_sections, portfolio_shots, product_shots, analytics)
--   3. Configure indexes for ultra-fast query performance
--   4. Set up auto-updating timestamps (updated_at)
--   5. Connect user authentication to profiles automatically
--   6. Create the 'portfolio-media' public storage bucket for image and video uploads
--   7. Configure Row Level Security (RLS) policies for full CRUD and public visitor read
--   8. Create the get_portfolio_stats() analytics dashboard helper
--   9. Seed standard studio categories
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. PROFILES TABLE (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. CATEGORIES TABLE
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  color text default '#d4d4d4',
  icon text default 'tag',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. PROJECTS TABLE
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  client text,
  year text,
  role text,
  description text not null,
  long_description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  preview_image text,
  preview_video text,
  hero_image text,
  hero_video text,
  og_image text,
  seo_title text,
  seo_description text,
  seo_keywords text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 5. PROJECT MEDIA TABLE (Gallery items)
create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  storage_path text not null,
  media_url text not null,
  thumbnail_path text,
  thumbnail_url text,
  file_name text,
  file_size bigint,
  mime_type text,
  width integer,
  height integer,
  alt_text text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 6. PROJECT SECTIONS TABLE (Case study editorial narrative)
create table if not exists public.project_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section_type text not null default 'overview' check (
    section_type in (
      'overview', 'challenge', 'research', 'strategy', 
      'wireframes', 'design_system', 'process', 'solution', 
      'results', 'gallery', 'video'
    )
  ),
  title text,
  content text,
  media_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. PORTFOLIO SHOTS TABLE (Masonry Portraits & Editorial Plates)
create table if not exists public.portfolio_shots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  url text not null,
  fallback_url text,
  aspect_ratio text not null default 'portrait' check (aspect_ratio in ('portrait', 'landscape', 'tall', 'square', 'wide')),
  caption text,
  client_or_brand text,
  tag text,
  camera text,
  lens text,
  iso text,
  shutter text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 8. PRODUCT SHOTS TABLE (Commercial Still Life & Objects)
create table if not exists public.product_shots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  url text not null,
  fallback_url text,
  aspect_ratio text not null default 'portrait' check (aspect_ratio in ('portrait', 'landscape', 'tall', 'square', 'wide')),
  caption text,
  client_or_brand text,
  tag text,
  camera text,
  lens text,
  iso text,
  shutter text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 9. ANALYTICS TABLE (Visitor Metrics)
create table if not exists public.analytics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  country text,
  device text check (device is null or device in ('mobile', 'tablet', 'desktop')),
  traffic_source text,
  page_url text,
  user_session_id text,
  viewed_at timestamptz not null default now()
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY SPEED
-- ==============================================================================
create index if not exists idx_projects_status on public.projects(status) where deleted_at is null;
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_category on public.projects(category_id);
create index if not exists idx_project_media_project on public.project_media(project_id);
create index if not exists idx_project_media_order on public.project_media(display_order);
create index if not exists idx_project_sections_project on public.project_sections(project_id);
create index if not exists idx_project_sections_order on public.project_sections(display_order);
create index if not exists idx_portfolio_shots_status on public.portfolio_shots(status) where deleted_at is null;
create index if not exists idx_portfolio_shots_order on public.portfolio_shots(display_order);
create index if not exists idx_product_shots_status on public.product_shots(status) where deleted_at is null;
create index if not exists idx_product_shots_order on public.product_shots(display_order);
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_analytics_session on public.analytics(user_session_id);
create index if not exists idx_analytics_viewed on public.analytics(viewed_at);

-- ==============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER
-- ==============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_project_sections_updated_at on public.project_sections;
create trigger set_project_sections_updated_at
  before update on public.project_sections
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_portfolio_shots_updated_at on public.portfolio_shots;
create trigger set_portfolio_shots_updated_at
  before update on public.portfolio_shots
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_product_shots_updated_at on public.product_shots;
create trigger set_product_shots_updated_at
  before update on public.product_shots
  for each row execute procedure public.set_updated_at();

-- ==============================================================================
-- AUTOMATIC USER SIGNUP -> PROFILE TRIGGER
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- STORAGE BUCKET: portfolio-media
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  157286400, -- 150MB max file size
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 157286400;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.project_sections enable row level security;
alter table public.portfolio_shots enable row level security;
alter table public.product_shots enable row level security;
alter table public.analytics enable row level security;

-- Profiles Policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Categories Policies
drop policy if exists "Categories viewable by everyone" on public.categories;
create policy "Categories viewable by everyone"
  on public.categories for select
  using (true);

drop policy if exists "Categories full CRUD for authenticated users" on public.categories;
create policy "Categories full CRUD for authenticated users"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

-- Projects Policies
drop policy if exists "Public can view published active projects" on public.projects;
create policy "Public can view published active projects"
  on public.projects for select
  using (
    (status = 'published' and deleted_at is null)
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users full CRUD on projects" on public.projects;
create policy "Authenticated users full CRUD on projects"
  on public.projects for all
  to authenticated
  using (true)
  with check (true);

-- Project Media Policies
drop policy if exists "Public can view published project media" on public.project_media;
create policy "Public can view published project media"
  on public.project_media for select
  using (
    project_id in (
      select id from public.projects
      where (status = 'published' and deleted_at is null)
    )
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users full CRUD on project media" on public.project_media;
create policy "Authenticated users full CRUD on project media"
  on public.project_media for all
  to authenticated
  using (true)
  with check (true);

-- Project Sections Policies
drop policy if exists "Public can view published project sections" on public.project_sections;
create policy "Public can view published project sections"
  on public.project_sections for select
  using (
    project_id in (
      select id from public.projects
      where (status = 'published' and deleted_at is null)
    )
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users full CRUD on project sections" on public.project_sections;
create policy "Authenticated users full CRUD on project sections"
  on public.project_sections for all
  to authenticated
  using (true)
  with check (true);

-- Portfolio Shots Policies
drop policy if exists "Public can view published portfolio shots" on public.portfolio_shots;
create policy "Public can view published portfolio shots"
  on public.portfolio_shots for select
  using (
    (status = 'published' and deleted_at is null)
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users full CRUD on portfolio shots" on public.portfolio_shots;
create policy "Authenticated users full CRUD on portfolio shots"
  on public.portfolio_shots for all
  to authenticated
  using (true)
  with check (true);

-- Product Shots Policies
drop policy if exists "Public can view published product shots" on public.product_shots;
create policy "Public can view published product shots"
  on public.product_shots for select
  using (
    (status = 'published' and deleted_at is null)
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated users full CRUD on product shots" on public.product_shots;
create policy "Authenticated users full CRUD on product shots"
  on public.product_shots for all
  to authenticated
  using (true)
  with check (true);

-- Analytics Policies
drop policy if exists "Visitors can insert analytics views" on public.analytics;
create policy "Visitors can insert analytics views"
  on public.analytics for insert
  with check (true);

drop policy if exists "Authenticated users can view analytics" on public.analytics;
create policy "Authenticated users can view analytics"
  on public.analytics for select
  to authenticated
  using (true);

-- Storage Policies for portfolio-media bucket
drop policy if exists "Public Access to Portfolio Media" on storage.objects;
create policy "Public Access to Portfolio Media"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

drop policy if exists "Authenticated Upload to Portfolio Media" on storage.objects;
create policy "Authenticated Upload to Portfolio Media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-media');

drop policy if exists "Authenticated Update to Portfolio Media" on storage.objects;
create policy "Authenticated Update to Portfolio Media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio-media');

drop policy if exists "Authenticated Delete from Portfolio Media" on storage.objects;
create policy "Authenticated Delete from Portfolio Media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-media');

-- ==============================================================================
-- DASHBOARD STATS RPC HELPER
-- ==============================================================================
create or replace function public.get_portfolio_stats()
returns json as $$
declare
  total_p int;
  published_p int;
  draft_p int;
  archived_p int;
  total_c int;
  total_v int;
  unique_v int;
  total_port int;
  total_prod int;
  result json;
begin
  select count(*) into total_p from public.projects where deleted_at is null;
  select count(*) into published_p from public.projects where status = 'published' and deleted_at is null;
  select count(*) into draft_p from public.projects where status = 'draft' and deleted_at is null;
  select count(*) into archived_p from public.projects where status = 'archived' and deleted_at is null;
  select count(*) into total_c from public.categories;
  select count(*) into total_port from public.portfolio_shots where deleted_at is null;
  select count(*) into total_prod from public.product_shots where deleted_at is null;
  select count(*) into total_v from public.analytics;
  select count(distinct user_session_id) into unique_v from public.analytics;

  result := json_build_object(
    'totalProjects', total_p,
    'publishedProjects', published_p,
    'draftProjects', draft_p,
    'archivedProjects', archived_p,
    'totalCategories', total_c,
    'totalPortfolioShots', total_port,
    'totalProductShots', total_prod,
    'totalViews', total_v,
    'uniqueVisitors', unique_v
  );

  return result;
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- INITIAL TAXONOMY SEED DATA
-- ==============================================================================
insert into public.categories (id, name, slug, description, color, icon, display_order)
values
  ('11111111-1111-1111-1111-111111111111', 'Editorial', 'editorial', 'Magazine covers, cultural narratives, and visual stories', '#e5e5e5', 'book-open', 1),
  ('22222222-2222-2222-2222-222222222222', 'Fashion', 'fashion', 'High-fashion campaigns, lookbooks, and textile architecture', '#d4d4d4', 'sparkles', 2),
  ('33333333-3333-3333-3333-333333333333', 'Commercial', 'commercial', 'Brand advertising, product storytelling, and luxury objects', '#a3a3a3', 'briefcase', 3),
  ('44444444-4444-4444-4444-444444444444', 'Portraiture', 'portraiture', 'Intimate studio portraits, cultural icons, and human form', '#737373', 'camera', 4)
on conflict (slug) do nothing;
