-- Migration 009: Row Level Security (RLS) and Storage Policies

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.project_sections enable row level security;
alter table public.analytics enable row level security;

-- 1. Profiles Policies
create policy "Public can view admin/editor profile info"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 2. Categories Policies
create policy "Public can view all categories"
  on public.categories for select
  using (true);

create policy "Authenticated users can create categories"
  on public.categories for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update categories"
  on public.categories for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete categories"
  on public.categories for delete
  to authenticated
  using (true);

-- 3. Projects Policies
create policy "Public can view published active projects"
  on public.projects for select
  using (
    (status = 'published' and deleted_at is null)
    or
    auth.role() = 'authenticated'
  );

create policy "Authenticated users can insert projects"
  on public.projects for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update projects"
  on public.projects for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete projects"
  on public.projects for delete
  to authenticated
  using (true);

-- 4. Project Media Policies
create policy "Public can view media of published projects"
  on public.project_media for select
  using (
    project_id in (
      select id from public.projects
      where (status = 'published' and deleted_at is null)
    )
    or
    auth.role() = 'authenticated'
  );

create policy "Authenticated users can insert project media"
  on public.project_media for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update project media"
  on public.project_media for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete project media"
  on public.project_media for delete
  to authenticated
  using (true);

-- 5. Project Sections Policies
create policy "Public can view sections of published projects"
  on public.project_sections for select
  using (
    project_id in (
      select id from public.projects
      where (status = 'published' and deleted_at is null)
    )
    or
    auth.role() = 'authenticated'
  );

create policy "Authenticated users can insert project sections"
  on public.project_sections for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update project sections"
  on public.project_sections for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete project sections"
  on public.project_sections for delete
  to authenticated
  using (true);

-- 6. Analytics Policies
create policy "Anyone can insert analytics view events"
  on public.analytics for insert
  with check (true);

create policy "Only authenticated users can view analytics"
  on public.analytics for select
  to authenticated
  using (true);

-- 7. Storage Policies for portfolio-media bucket
create policy "Public Access to Portfolio Media"
  on storage.objects for select
  using (bucket_id = 'portfolio-media');

create policy "Authenticated Upload to Portfolio Media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-media');

create policy "Authenticated Update to Portfolio Media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio-media');

create policy "Authenticated Delete from Portfolio Media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-media');
