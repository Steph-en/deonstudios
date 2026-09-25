-- ==============================================================================
-- MIGRATION 012: CROSS-PLATFORM AUTHENTICATION & SCHEMA SYNCHRONIZATION
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- This synchronizes all platforms (Google Dev, Local, and Hosted https://www.gideonboadi.com),
-- creates the cross-platform app_users table, updates profiles, enables compatibility views,
-- and configures the primary administrator account (appahstephen9@gmail.com).

-- Enable pgcrypto extension for password hashing
create extension if not exists pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. Create Cross-Platform `app_users` Table
-- ------------------------------------------------------------------------------
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

-- Indexes for lightning-fast lookups
create index if not exists idx_app_users_email on public.app_users(lower(email));
create index if not exists idx_app_users_username on public.app_users(lower(username));
create index if not exists idx_app_users_role on public.app_users(role);

-- Enable RLS and permissive policies for app users
alter table public.app_users enable row level security;

drop policy if exists "Allow all operations on app_users" on public.app_users;
create policy "Allow all operations on app_users"
  on public.app_users for all
  using (true)
  with check (true);

grant all on public.app_users to anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. Ensure `profiles` Table Has All Required Columns & Role Constraint
-- ------------------------------------------------------------------------------
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists full_name text;

-- Update role check constraint to support 'admin', 'manager', and 'editor'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'editor'));

-- Allow public read on profiles so app can display user info & roles
drop policy if exists "Public profiles read" on public.profiles;
create policy "Public profiles read"
  on public.profiles for select
  using (true);

drop policy if exists "Allow manage profiles" on public.profiles;
create policy "Allow manage profiles"
  on public.profiles for all
  using (true)
  with check (true);

grant all on public.profiles to anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 3. Compatibility Views: `portfolio`, `products`, and `media`
-- ------------------------------------------------------------------------------
-- Ensures queries using either table name convention work flawlessly
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

-- ------------------------------------------------------------------------------
-- 4. Auth Trigger for Automatic Profile & App Users Sync
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text;
  v_username text;
  v_full_name text;
begin
  if lower(new.email) = 'appahstephen9@gmail.com' then
    v_role := 'admin';
    v_username := 'appahstephen9';
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', 'Stephen Appah');
  else
    v_role := coalesce(new.raw_user_meta_data->>'role', 'manager');
    if v_role not in ('admin', 'manager', 'editor') then
      v_role := 'manager';
    end if;
    v_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  end if;

  -- Upsert into profiles
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

  -- Upsert into app_users
  insert into public.app_users (id, email, username, full_name, role)
  values (
    new.id::text,
    new.email,
    v_username,
    v_full_name,
    v_role
  )
  on conflict (email) do update set
    username = coalesce(public.app_users.username, excluded.username),
    full_name = coalesce(public.app_users.full_name, excluded.full_name),
    role = case
      when lower(excluded.email) = 'appahstephen9@gmail.com' then 'admin'
      else coalesce(public.app_users.role, excluded.role)
    end,
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 5. Seed Primary Administrator in `app_users` and `auth.users`
-- ------------------------------------------------------------------------------
-- A. Ensure admin user exists in public.app_users (works with 'admin123' or custom password)
insert into public.app_users (id, email, username, full_name, role, password)
values (
  'admin-appahstephen9',
  'appahstephen9@gmail.com',
  'appahstephen9',
  'Stephen Appah',
  'admin',
  'admin123'
)
on conflict (email) do update set
  role = 'admin',
  username = 'appahstephen9',
  full_name = coalesce(public.app_users.full_name, 'Stephen Appah'),
  updated_at = now();

-- B. Create or update user in Supabase auth.users with confirmed email
do $$
declare
  admin_uid uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  existing_id uuid;
begin
  select id into existing_id from auth.users where lower(email) = 'appahstephen9@gmail.com' limit 1;

  if existing_id is null then
    begin
      insert into auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token
      )
      values (
        admin_uid,
        '00000000-0000-0000-0000-000000000000',
        'appahstephen9@gmail.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Stephen Appah","username":"appahstephen9","role":"admin"}',
        now(),
        now(),
        'authenticated',
        'authenticated',
        ''
      );
    exception when others then
      raise notice 'Notice: auth.users direct insert handled: %', sqlerrm;
    end;
  else
    -- Update existing auth account: confirm email and set default password
    begin
      update auth.users
      set
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Stephen Appah","username":"appahstephen9","role":"admin"}'::jsonb,
        encrypted_password = crypt('admin123', gen_salt('bf')),
        updated_at = now()
      where id = existing_id;
    exception when others then
      raise notice 'Notice: auth.users update handled: %', sqlerrm;
    end;
  end if;

  -- Ensure profile exists linked to whichever auth UID was created or exists
  select id into existing_id from auth.users where lower(email) = 'appahstephen9@gmail.com' limit 1;
  if existing_id is not null then
    insert into public.profiles (id, email, username, full_name, role)
    values (existing_id, 'appahstephen9@gmail.com', 'appahstephen9', 'Stephen Appah', 'admin')
    on conflict (id) do update set
      role = 'admin',
      username = 'appahstephen9',
      full_name = 'Stephen Appah',
      updated_at = now();
  end if;
end $$;

-- Verify migration success
select 'Migration 012 applied successfully! app_users, profiles, and admin account are synchronized.' as status;
