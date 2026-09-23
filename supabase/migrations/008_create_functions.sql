-- Migration 008: Database Helper Functions & Storage Setup

-- Updated_at timestamp trigger function
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
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

-- Analytics aggregation helper function for dashboard
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
  result json;
begin
  select count(*) into total_p from public.projects where deleted_at is null;
  select count(*) into published_p from public.projects where status = 'published' and deleted_at is null;
  select count(*) into draft_p from public.projects where status = 'draft' and deleted_at is null;
  select count(*) into archived_p from public.projects where status = 'archived' and deleted_at is null;
  select count(*) into total_c from public.categories;
  select count(*) into total_v from public.analytics;
  select count(distinct user_session_id) into unique_v from public.analytics;

  result := json_build_object(
    'totalProjects', total_p,
    'publishedProjects', published_p,
    'draftProjects', draft_p,
    'archivedProjects', archived_p,
    'totalCategories', total_c,
    'totalViews', total_v,
    'uniqueVisitors', unique_v
  );

  return result;
end;
$$ language plpgsql security definer;

-- Create Storage bucket 'portfolio-media' if storage schema is available
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;
