-- ==============================================================================
-- MIGRATION 011: MANAGER ROLE & USER MANAGEMENT ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Run this in Supabase SQL Editor to apply the latest user role changes and RLS policies.

-- 1. Ensure username and columns exist in profiles
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'username') then
    alter table public.profiles add column username text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'avatar_url') then
    alter table public.profiles add column avatar_url text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name') then
    alter table public.profiles add column full_name text;
  end if;
end $$;

-- 2. Update role constraint to allow ('admin', 'manager', 'editor')
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'manager', 'editor'));

-- Unique username index
create unique index if not exists idx_profiles_username on public.profiles(lower(username)) where username is not null;
create index if not exists idx_profiles_email on public.profiles(lower(email));
create index if not exists idx_profiles_role on public.profiles(role);

-- 3. Update / create helper functions for RLS
create or replace function public.is_admin()
returns boolean as $$
declare
  user_email text;
  user_role text;
begin
  user_email := nullif(lower(auth.jwt()->>'email'), '');

  if user_email = 'appahstephen9@gmail.com' then
    return true;
  end if;

  if (auth.jwt()->'user_metadata'->>'role') = 'admin' then
    return true;
  end if;

  select role into user_role
  from public.profiles
  where id = auth.uid();

  return coalesce(user_role = 'admin', false);
end;
$$ language plpgsql security definer;

create or replace function public.is_staff()
returns boolean as $$
declare
  user_email text;
  user_role text;
begin
  user_email := nullif(lower(auth.jwt()->>'email'), '');
  if user_email = 'appahstephen9@gmail.com' then
    return true;
  end if;

  if (auth.jwt()->'user_metadata'->>'role') in ('admin', 'manager', 'editor') then
    return true;
  end if;

  select role into user_role
  from public.profiles
  where id = auth.uid();

  return coalesce(user_role in ('admin', 'manager', 'editor'), false);
end;
$$ language plpgsql security definer;

-- 4. Update handle_new_user() trigger for admin & manager roles
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

  return new;
end;
$$ language plpgsql security definer;

-- 5. Designate appahstephen9@gmail.com as Admin if user already in auth.users
do $$
declare
  admin_uid uuid;
begin
  select id into admin_uid from auth.users where lower(email) = 'appahstephen9@gmail.com' limit 1;
  if admin_uid is not null then
    insert into public.profiles (id, email, username, full_name, role)
    values (admin_uid, 'appahstephen9@gmail.com', 'appahstephen9', 'Stephen Appah', 'admin')
    on conflict (id) do update set
      role = 'admin',
      username = 'appahstephen9',
      full_name = coalesce(public.profiles.full_name, 'Stephen Appah'),
      updated_at = now();
  end if;
end $$;

-- 6. Apply Profiles RLS policies
drop policy if exists "Profiles viewable by admins or self" on public.profiles;
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles viewable by admins or self"
  on public.profiles for select
  to authenticated
  using (
    public.is_admin()
    or auth.uid() = id
  );

drop policy if exists "Only admins can insert profiles" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Only admins can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (
    public.is_admin()
    or auth.uid() = id
  );

drop policy if exists "Admins or owners update profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Admins or owners update profile"
  on public.profiles for update
  to authenticated
  using (
    public.is_admin()
    or auth.uid() = id
  )
  with check (
    public.is_admin()
    or (
      auth.uid() = id
      and role = (select p.role from public.profiles p where p.id = auth.uid())
    )
  );

drop policy if exists "Only admins can delete profiles" on public.profiles;
create policy "Only admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (
    public.is_admin()
    and lower(email) != 'appahstephen9@gmail.com'
  );
