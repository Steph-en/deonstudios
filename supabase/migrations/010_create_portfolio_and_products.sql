-- Migration 010: Portfolio Shots and Product Shots Tables and Policies

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

-- Indexes
create index if not exists idx_portfolio_shots_status on public.portfolio_shots(status) where deleted_at is null;
create index if not exists idx_portfolio_shots_order on public.portfolio_shots(display_order);
create index if not exists idx_product_shots_status on public.product_shots(status) where deleted_at is null;
create index if not exists idx_product_shots_order on public.product_shots(display_order);

-- Enable RLS
alter table public.portfolio_shots enable row level security;
alter table public.product_shots enable row level security;

-- Policies for portfolio_shots
create policy "Public can view published portfolio shots"
  on public.portfolio_shots for select
  using (
    (status = 'published' and deleted_at is null)
    or
    auth.role() = 'authenticated'
  );

create policy "Authenticated users can insert portfolio shots"
  on public.portfolio_shots for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update portfolio shots"
  on public.portfolio_shots for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete portfolio shots"
  on public.portfolio_shots for delete
  to authenticated
  using (true);

-- Policies for product_shots
create policy "Public can view published product shots"
  on public.product_shots for select
  using (
    (status = 'published' and deleted_at is null)
    or
    auth.role() = 'authenticated'
  );

create policy "Authenticated users can insert product shots"
  on public.product_shots for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update product shots"
  on public.product_shots for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete product shots"
  on public.product_shots for delete
  to authenticated
  using (true);
