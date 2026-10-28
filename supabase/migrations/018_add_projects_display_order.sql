-- ==============================================================================
-- MIGRATION 018: ADD projects.display_order
-- ==============================================================================
-- Run in Supabase Dashboard -> SQL Editor.
--
-- Fixes:  GET /rest/v1/projects?...order=display_order.asc...  ->  400
--         {"code":"42703","message":"column projects.display_order does not exist"}
--
-- The app orders and drag-reorders projects by this column, but the original
-- projects table (migration 003) never had it. Safe to run more than once.

alter table public.projects
  add column if not exists display_order integer not null default 0;

-- Preserve the current "newest first" order for existing rows:
-- newest project -> 1, next -> 2, ... (only touches rows still at the default 0).
with ranked as (
  select id, row_number() over (order by created_at desc) as rn
  from public.projects
  where display_order = 0
)
update public.projects p
set display_order = ranked.rn
from ranked
where p.id = ranked.id;

create index if not exists idx_projects_display_order
  on public.projects (display_order);

-- Make PostgREST pick up the new column immediately.
notify pgrst, 'reload schema';
