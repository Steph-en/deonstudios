-- Migration 007: Performance Indexes
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_category_id on public.projects(category_id);
create index if not exists idx_projects_featured on public.projects(featured);
create index if not exists idx_projects_created_at on public.projects(created_at desc);
create index if not exists idx_projects_deleted_at on public.projects(deleted_at);

create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_display_order on public.categories(display_order);

create index if not exists idx_project_media_project_id on public.project_media(project_id);
create index if not exists idx_project_media_display_order on public.project_media(display_order);

create index if not exists idx_project_sections_project_id on public.project_sections(project_id);
create index if not exists idx_project_sections_display_order on public.project_sections(display_order);

create index if not exists idx_analytics_project_id on public.analytics(project_id);
create index if not exists idx_analytics_viewed_at on public.analytics(viewed_at desc);
create index if not exists idx_analytics_session on public.analytics(user_session_id);
