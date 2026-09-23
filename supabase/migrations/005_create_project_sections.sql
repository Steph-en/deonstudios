-- Migration 005: Project Sections Table (Case Study Builder)
create table if not exists public.project_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section_type text not null check (
    section_type in (
      'overview',
      'challenge',
      'research',
      'strategy',
      'wireframes',
      'design_system',
      'process',
      'solution',
      'results',
      'gallery',
      'video'
    )
  ),
  title text,
  content text,
  media_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
