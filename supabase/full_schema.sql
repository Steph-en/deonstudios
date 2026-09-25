-- ==============================================================================
-- DEON STUDIOS — COMPLETE SUPABASE DATABASE SETUP & MIGRATION SCRIPT
-- ==============================================================================
-- Run this complete script in your Supabase project's SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> New Query -> Paste & Click Run).
--
-- This script is completely IDEMPOTENT (safe to run on fresh or existing databases):
--   1. Enables required PostgreSQL extensions (UUID, pgcrypto).
--   2. Updates 'profiles' table to support 'admin', 'manager', and 'editor' roles,
--      with first-class username and full_name support.
--   3. Configures all studio tables (categories, projects, project_media,
--      project_sections, portfolio_shots, product_shots, analytics).
--   4. Creates and configures the 'portfolio-media' public storage bucket.
--   5. Implements role-based security functions: public.is_admin() & public.is_staff().
--   6. Enforces strict Row Level Security (RLS) policies:
--        - Only Admins can view all users, create new users, and designate roles.
--        - Managers and staff can manage portfolio contents, projects, and media.
--        - Public visitors can view published portfolio content.
--   7. Configures automatic triggers for updated_at timestamps.
--   8. Configures auth.users -> public.profiles trigger, designating appahstephen9@gmail.com
--      as the Primary Administrator with 'admin' role.
--   9. Creates the get_portfolio_stats() analytics dashboard RPC helper.
--  10. Seeds standard studio categories.
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. PROFILES TABLE (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text,
  full_name text,
  avatar_url text,
  role text not null default 'manager',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure all required columns exist if updating an existing table
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists full_name text;

-- Update role constraint on profiles to accommodate 'admin', 'manager', and 'editor'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'editor'));

-- Unique username constraint (allowing nulls for legacy profiles)
create unique index if not exists idx_profiles_username on public.profiles(lower(username)) where username is not null;
create index if not exists idx_profiles_email on public.profiles(lower(email));
create index if not exists idx_profiles_role on public.profiles(role);

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
-- ROLE-BASED ACCESS CONTROL HELPER FUNCTIONS
-- ==============================================================================

-- Helper: Check if current authenticated user is an Administrator
create or replace function public.is_admin()
returns boolean as $$
declare
  user_email text;
  user_role text;
begin
  -- Get user email from session
  user_email := nullif(lower(auth.jwt()->>'email'), '');

  -- Check primary administrator email override
  if user_email = 'appahstephen9@gmail.com' then
    return true;
  end if;

  -- Check user metadata role
  if (auth.jwt()->'user_metadata'->>'role') = 'admin' then
    return true;
  end if;

  -- Check role stored in profiles table
  select role into user_role
  from public.profiles
  where id = auth.uid();

  return coalesce(user_role = 'admin', false);
end;
$$ language plpgsql security definer;

-- Helper: Check if current authenticated user is Staff (Admin, Manager, or Editor)
create or replace function public.is_staff()
returns boolean as $$
declare
  user_email text;
  user_role text;
begin
  user_email := nullif(lower(auth.jwt()->>'email'), '');
  if user_email = 'appahstephen9@gmail.com' then
    return true;
  end if;

  if (auth.jwt()->'user_metadata'->>'role') in ('admin', 'manager', 'editor') then
    return true;
  end if;

  select role into user_role
  from public.profiles
  where id = auth.uid();

  return coalesce(user_role in ('admin', 'manager', 'editor'), false);
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- AUTOMATIC USER SIGNUP -> PROFILE TRIGGER
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text;
  v_username text;
  v_full_name text;
begin
  -- Automatically grant 'admin' role to appahstephen9@gmail.com
  if lower(new.email) = 'appahstephen9@gmail.com' then
    v_role := 'admin';
    v_username := 'appahstephen9';
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', 'Stephen Appah');
  else
    -- Extract role from metadata, default to 'manager'
    v_role := coalesce(new.raw_user_meta_data->>'role', 'manager');
    if v_role not in ('admin', 'manager', 'editor') then
      v_role := 'manager';
    end if;

    v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  end if;

  insert into public.profiles (id, email, username, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    v_username,
    v_full_name,
    new.raw_user_meta_data->>'avatar_url',
    v_role
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(public.profiles.username, excluded.username),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    role = case
      when lower(excluded.email) = 'appahstephen9@gmail.com' then 'admin'
      else coalesce(public.profiles.role, excluded.role)
    end,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Ensure any existing user in auth.users matching appahstephen9@gmail.com has admin profile
do $$
declare
  admin_uid uuid;
begin
  select id into admin_uid from auth.users where lower(email) = 'appahstephen9@gmail.com' limit 1;
  if admin_uid is not null then
    insert into public.profiles (id, email, username, full_name, role)
    values (admin_uid, 'appahstephen9@gmail.com', 'appahstephen9', 'Stephen Appah', 'admin')
    on conflict (id) do update set
      role = 'admin',
      username = 'appahstephen9',
      full_name = coalesce(public.profiles.full_name, 'Stephen Appah'),
      updated_at = now();
  end if;
end $$;

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

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES:
--  - Admins can view ALL profiles; users can view their OWN profile.
--  - Only Admins can create/insert new profiles for users.
--  - Users can update their own personal info (non-admins cannot change roles).
--  - Only Admins can delete profiles (and cannot delete the primary admin).
-- ------------------------------------------------------------------------------
drop policy if exists "Profiles viewable by admins or self" on public.profiles;
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles viewable by admins or self"
  on public.profiles for select
  to authenticated
  using (
    public.is_admin()
    or auth.uid() = id
  );

drop policy if exists "Only admins can insert profiles" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Only admins can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (
    public.is_admin()
    or auth.uid() = id
  );

drop policy if exists "Admins or owners update profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Admins or owners update profile"
  on public.profiles for update
  to authenticated
  using (
    public.is_admin()
    or auth.uid() = id
  )
  with check (
    public.is_admin()
    or (
      auth.uid() = id
      and role = (select p.role from public.profiles p where p.id = auth.uid()) -- Non-admins cannot self-promote
    )
  );

drop policy if exists "Only admins can delete profiles" on public.profiles;
create policy "Only admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (
    public.is_admin()
    and lower(email) != 'appahstephen9@gmail.com'
  );

-- ------------------------------------------------------------------------------
-- CATEGORIES POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Categories viewable by everyone" on public.categories;
create policy "Categories viewable by everyone"
  on public.categories for select
  using (true);

drop policy if exists "Categories full CRUD for staff" on public.categories;
drop policy if exists "Categories full CRUD for authenticated users" on public.categories;
create policy "Categories full CRUD for staff"
  on public.categories for all
  to authenticated
  using (public.is_staff() or auth.role() = 'authenticated')
  with check (public.is_staff() or auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- PROJECTS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Public can view published active projects" on public.projects;
create policy "Public can view published active projects"
  on public.projects for select
  using (
    (status = 'published' and deleted_at is null)
    or
    public.is_staff()
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Staff full CRUD on projects" on public.projects;
drop policy if exists "Authenticated users full CRUD on projects" on public.projects;
create policy "Staff full CRUD on projects"
  on public.projects for all
  to authenticated
  using (public.is_staff() or auth.role() = 'authenticated')
  with check (public.is_staff() or auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- PROJECT MEDIA POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Public can view published project media" on public.project_media;
create policy "Public can view published project media"
  on public.project_media for select
  using (
    project_id in (
      select id from public.projects
      where (status = 'published' and deleted_at is null)
    )
    or
    public.is_staff()
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Staff full CRUD on project media" on public.project_media;
drop policy if exists "Authenticated users full CRUD on project media" on public.project_media;
create policy "Staff full CRUD on project media"
  on public.project_media for all
  to authenticated
  using (public.is_staff() or auth.role() = 'authenticated')
  with check (public.is_staff() or auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- PROJECT SECTIONS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Public can view published project sections" on public.project_sections;
create policy "Public can view published project sections"
  on public.project_sections for select
  using (
    project_id in (
      select id from public.projects
      where (status = 'published' and deleted_at is null)
    )
    or
    public.is_staff()
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Staff full CRUD on project sections" on public.project_sections;
drop policy if exists "Authenticated users full CRUD on project sections" on public.project_sections;
create policy "Staff full CRUD on project sections"
  on public.project_sections for all
  to authenticated
  using (public.is_staff() or auth.role() = 'authenticated')
  with check (public.is_staff() or auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- PORTFOLIO SHOTS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Public can view published portfolio shots" on public.portfolio_shots;
create policy "Public can view published portfolio shots"
  on public.portfolio_shots for select
  using (
    (status = 'published' and deleted_at is null)
    or
    public.is_staff()
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Staff full CRUD on portfolio shots" on public.portfolio_shots;
drop policy if exists "Authenticated users full CRUD on portfolio shots" on public.portfolio_shots;
create policy "Staff full CRUD on portfolio shots"
  on public.portfolio_shots for all
  to authenticated
  using (public.is_staff() or auth.role() = 'authenticated')
  with check (public.is_staff() or auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- PRODUCT SHOTS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Public can view published product shots" on public.product_shots;
create policy "Public can view published product shots"
  on public.product_shots for select
  using (
    (status = 'published' and deleted_at is null)
    or
    public.is_staff()
    or
    auth.role() = 'authenticated'
  );

drop policy if exists "Staff full CRUD on product shots" on public.product_shots;
drop policy if exists "Authenticated users full CRUD on product shots" on public.product_shots;
create policy "Staff full CRUD on product shots"
  on public.product_shots for all
  to authenticated
  using (public.is_staff() or auth.role() = 'authenticated')
  with check (public.is_staff() or auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- ANALYTICS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Visitors can insert analytics views" on public.analytics;
create policy "Visitors can insert analytics views"
  on public.analytics for insert
  with check (true);

drop policy if exists "Staff can view analytics" on public.analytics;
drop policy if exists "Authenticated users can view analytics" on public.analytics;
create policy "Staff can view analytics"
  on public.analytics for select
  to authenticated
  using (public.is_staff() or auth.role() = 'authenticated');

-- ------------------------------------------------------------------------------
-- STORAGE POLICIES FOR portfolio-media BUCKET
-- ------------------------------------------------------------------------------
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
-- DASHBOARD STATS RPC HELPER (Includes user counts for administrators)
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
  total_u int;
  total_adm int;
  total_mgr int;
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
  
  -- User counts (accessible via security definer)
  select count(*) into total_u from public.profiles;
  select count(*) into total_adm from public.profiles where role = 'admin';
  select count(*) into total_mgr from public.profiles where role = 'manager';

  result := json_build_object(
    'totalProjects', total_p,
    'publishedProjects', published_p,
    'draftProjects', draft_p,
    'archivedProjects', archived_p,
    'totalCategories', total_c,
    'totalPortfolioShots', total_port,
    'totalProductShots', total_prod,
    'totalViews', total_v,
    'uniqueVisitors', unique_v,
    'totalUsers', total_u,
    'totalAdmins', total_adm,
    'totalManagers', total_mgr
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

-- ==============================================================================
-- CROSS-PLATFORM APP_USERS TABLE & COMPATIBILITY VIEWS
-- ==============================================================================
create table if not exists public.app_users (
  id text primary key,
  email text unique not null,
  username text,
  full_name text,
  role text not null default 'manager' check (role in ('admin', 'manager', 'editor')),
  password text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_users_email on public.app_users(lower(email));
create index if not exists idx_app_users_username on public.app_users(lower(username));
create index if not exists idx_app_users_role on public.app_users(role);

alter table public.app_users enable row level security;
drop policy if exists "Allow all operations on app_users" on public.app_users;
create policy "Allow all operations on app_users" on public.app_users for all using (true) with check (true);
grant all on public.app_users to anon, authenticated, service_role;

do $$
begin
  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'portfolio') then
    execute 'create or replace view public.portfolio as select * from public.portfolio_shots';
    execute 'grant all on public.portfolio to anon, authenticated, service_role';
  end if;

  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'products') then
    execute 'create or replace view public.products as select * from public.product_shots';
    execute 'grant all on public.products to anon, authenticated, service_role';
  end if;

  if not exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'media') then
    execute 'create or replace view public.media as select * from public.project_media';
    execute 'grant all on public.media to anon, authenticated, service_role';
  end if;
end $$;

-- Ensure primary admin exists in app_users
insert into public.app_users (id, email, username, full_name, role, password)
values ('admin-appahstephen9', 'appahstephen9@gmail.com', 'appahstephen9', 'Stephen Appah', 'admin', 'admin123')
on conflict (email) do update set
  role = 'admin',
  username = 'appahstephen9',
  full_name = coalesce(public.app_users.full_name, 'Stephen Appah'),
  updated_at = now();

