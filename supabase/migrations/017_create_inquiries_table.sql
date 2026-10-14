-- ==============================================================================
-- 017: CREATE INQUIRIES TABLE & POLICIES
-- ==============================================================================

create table if not exists public.inquiries (
  id text primary key,
  name text not null,
  email text not null,
  phone text,
  project_type text,
  message text not null,
  destination_email text,
  status text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.inquiries enable row level security;

-- Policies:
-- 1. Anyone (public anon & authenticated) can submit a contact inquiry
create policy "Anyone can insert inquiries"
  on public.inquiries
  for insert
  with check (true);

-- 2. Staff and Admins can view all inquiries
create policy "Staff and Admins can view inquiries"
  on public.inquiries
  for select
  using (
    auth.role() = 'authenticated'
  );

-- 3. Staff and Admins can update inquiries (e.g. mark as read)
create policy "Staff and Admins can update inquiries"
  on public.inquiries
  for update
  using (
    auth.role() = 'authenticated'
  );

-- 4. Staff and Admins can delete inquiries
create policy "Staff and Admins can delete inquiries"
  on public.inquiries
  for delete
  using (
    auth.role() = 'authenticated'
  );

-- Index for ordering by creation time
create index if not exists idx_inquiries_created_at on public.inquiries(created_at desc);
create index if not exists idx_inquiries_status on public.inquiries(status);
