-- ==============================================================================
-- MIGRATION 019: SECURE AUTH & ROW LEVEL SECURITY
-- ==============================================================================
-- Run in Supabase Dashboard -> SQL Editor. Runs in one transaction: if anything
-- fails, nothing is changed.
--
-- ROLLOUT ORDER (important - do not run this first):
--   1. Supabase -> Authentication -> Users: set a NEW strong password for
--      appahstephen9@gmail.com (migration 012 had set it to "admin123").
--   2. Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars (needed by /api/admin/users).
--   3. Deploy the new app code and confirm you can sign in with the real account.
--   4. Run THIS migration.
--   5. Supabase -> Authentication -> Providers/Sign In: turn OFF "Allow new users to sign up".
--
-- What this fixes
--   * Anyone on the internet could insert/update/delete all CMS content (policies
--     were "to public using (true)").
--   * Roles were trusted from user_metadata (editable by the user) and from a
--     hard-coded e-mail. Now the ONLY source of truth is public.profiles.role,
--     and clients cannot change it.
--   * handle_new_user() let anyone self-assign the admin role at sign-up. The
--     trigger is removed; profiles are created only by the server-side admin API.
--   * public.app_users stored plaintext passwords readable by anon. Table dropped.
--   * Compatibility views (portfolio/products/media) bypassed RLS. Dropped.
--   * Visitors' contact messages lived in site_settings.client_inquiries and were
--     publicly readable. They move to the protected public.inquiries table.
--   * Storage uploads were open to any logged-in user. Now staff only.
-- ==============================================================================

begin;

-- ------------------------------------------------------------------------------
-- 0. Bootstrap the owner as admin and refuse to continue if that leaves no admin
--    (prevents locking yourself out).
-- ------------------------------------------------------------------------------
insert into public.profiles (id, email, username, full_name, role)
select id, email, 'appahstephen9', 'Stephen Appah', 'admin'
from auth.users
where lower(email) = 'appahstephen9@gmail.com'
on conflict (id) do update set role = 'admin';

do $$
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    raise exception
      'No admin profile exists. Create appahstephen9@gmail.com in Authentication -> Users first, then re-run this migration.';
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- 1. Role helpers: based ONLY on public.profiles (never user_metadata / e-mail)
-- ------------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager', 'editor')
  );
$$;

create or replace function public.my_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Lets the login form accept a username: returns only the e-mail for a username.
create or replace function public.login_email_for(identifier text)
returns text
language sql stable security definer
set search_path = public
as $$
  select email from public.profiles
  where lower(username) = lower(trim(identifier))
  limit 1;
$$;
revoke all on function public.login_email_for(text) from public;
grant execute on function public.login_email_for(text) to anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. Remove the insecure legacy objects
-- ------------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop trigger if exists on_auth_user_deleted on auth.users;
drop function if exists public.handle_deleted_auth_user();
drop function if exists public.delete_user_by_admin(text, text);
drop table if exists public.app_users cascade;

do $$
declare v text;
begin
  foreach v in array array['portfolio', 'products', 'media'] loop
    if exists (select 1 from pg_views where schemaname = 'public' and viewname = v) then
      execute format('drop view public.%I', v);
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------------------------
-- 3. Move visitors' contact messages into the protected inquiries table
-- ------------------------------------------------------------------------------
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
create index if not exists idx_inquiries_created_at on public.inquiries(created_at desc);
create index if not exists idx_inquiries_status on public.inquiries(status);

do $$
begin
  if to_regclass('public.site_settings') is not null then
    insert into public.inquiries
      (id, name, email, phone, project_type, message, destination_email, status, created_at, updated_at)
    select
      coalesce(nullif(e->>'id', ''), 'inq-' || md5(e::text)),
      coalesce(nullif(e->>'name', ''), 'Unknown'),
      coalesce(e->>'email', ''),
      nullif(e->>'phone', ''),
      coalesce(e->>'projectType', e->>'project_type'),
      coalesce(e->>'message', ''),
      coalesce(e->>'destination_email', e->>'destination'),
      case when e->>'status' in ('unread', 'read', 'archived') then e->>'status' else 'unread' end,
      case when (e->>'created_at') ~ '^\d{4}-\d{2}-\d{2}' then (e->>'created_at')::timestamptz else now() end,
      now()
    from public.site_settings s, jsonb_array_elements(s.value) e
    where s.key = 'client_inquiries' and jsonb_typeof(s.value) = 'array'
    on conflict (id) do nothing;

    delete from public.site_settings where key = 'client_inquiries';
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- 4. Wipe every existing policy on the app's tables (and the media bucket), then
--    recreate a minimal, explicit set.
-- ------------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'categories', 'projects', 'project_media', 'project_sections',
                        'portfolio_shots', 'product_shots', 'analytics', 'site_settings', 'inquiries')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;

  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%portfolio-media%'
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.project_sections enable row level security;
alter table public.portfolio_shots enable row level security;
alter table public.product_shots enable row level security;
alter table public.analytics enable row level security;
alter table public.site_settings enable row level security;
alter table public.inquiries enable row level security;

-- 4a. profiles: users read/update themselves (but never their own role); admins
--     read/update everyone. INSERT/DELETE only via the service role (admin API).
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles: update own (not role) or admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and role = public.my_role())
  );

-- 4b. Public site content: visitors see published rows; staff manage everything.
create policy "categories: public read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories: staff write" on public.categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "projects: public read published" on public.projects
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
create policy "projects: staff all" on public.projects
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "project_media: public read of published projects" on public.project_media
  for select to anon, authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_media.project_id and p.status = 'published' and p.deleted_at is null
  ));
create policy "project_media: staff all" on public.project_media
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "project_sections: public read of published projects" on public.project_sections
  for select to anon, authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_sections.project_id and p.status = 'published' and p.deleted_at is null
  ));
create policy "project_sections: staff all" on public.project_sections
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "portfolio_shots: public read published" on public.portfolio_shots
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
create policy "portfolio_shots: staff all" on public.portfolio_shots
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "product_shots: public read published" on public.product_shots
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
create policy "product_shots: staff all" on public.product_shots
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- 4c. Site settings (hero/about copy): public read, staff write.
create policy "site_settings: public read" on public.site_settings
  for select to anon, authenticated using (key <> 'client_inquiries');
create policy "site_settings: staff all" on public.site_settings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- 4d. Analytics: anyone can record a page view; only staff can read or change.
create policy "analytics: anyone can record" on public.analytics
  for insert to anon, authenticated with check (true);
create policy "analytics: staff read" on public.analytics
  for select to authenticated using (public.is_staff());
create policy "analytics: staff delete" on public.analytics
  for delete to authenticated using (public.is_staff());

-- 4e. Inquiries: visitors can submit (size-limited, always 'unread'); only staff read.
create policy "inquiries: anyone can submit" on public.inquiries
  for insert to anon, authenticated
  with check (
    status = 'unread'
    and char_length(name) between 1 and 200
    and char_length(email) between 3 and 320
    and char_length(message) between 1 and 5000
    and char_length(coalesce(phone, '')) <= 50
    and char_length(coalesce(project_type, '')) <= 200
  );
create policy "inquiries: staff read" on public.inquiries
  for select to authenticated using (public.is_staff());
create policy "inquiries: staff update" on public.inquiries
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "inquiries: staff delete" on public.inquiries
  for delete to authenticated using (public.is_staff());

-- 4f. Storage bucket: files are served publicly by URL; only staff may list/change.
create policy "portfolio-media: staff list" on storage.objects
  for select to authenticated using (bucket_id = 'portfolio-media' and public.is_staff());
create policy "portfolio-media: staff upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'portfolio-media' and public.is_staff());
create policy "portfolio-media: staff update" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-media' and public.is_staff())
  with check (bucket_id = 'portfolio-media' and public.is_staff());
create policy "portfolio-media: staff delete" on storage.objects
  for delete to authenticated using (bucket_id = 'portfolio-media' and public.is_staff());

-- ------------------------------------------------------------------------------
-- 5. Table privileges: defence in depth on top of RLS (anon gets the minimum)
-- ------------------------------------------------------------------------------
revoke all on public.profiles from anon;
revoke all on public.inquiries from anon;
grant insert on public.inquiries to anon;
revoke all on public.analytics from anon;
grant insert on public.analytics to anon;
revoke all on public.site_settings from anon;
grant select on public.site_settings to anon;
revoke insert, update, delete, truncate, references, trigger
  on public.categories, public.projects, public.project_media, public.project_sections,
     public.portfolio_shots, public.product_shots
  from anon;

notify pgrst, 'reload schema';

commit;

select 'Migration 019 applied: roles now come from public.profiles only; anonymous writes are closed.' as status;
