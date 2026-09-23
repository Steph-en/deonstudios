-- Migration 004: Project Media Table
create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
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
