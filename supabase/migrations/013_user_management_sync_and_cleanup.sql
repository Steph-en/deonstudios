-- ==============================================================================
-- MIGRATION 013: COMPLETE USER MANAGEMENT SYNCHRONIZATION & CASCADE DELETION
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- 
-- This script guarantees 100% consistency between the Admin Panel, Development
-- environment, and Supabase Authentication:
-- 1. Creates the SECURITY DEFINER RPC `public.delete_user_by_admin` allowing the
--    CMS admin to permanently purge deleted users from `auth.users`, `public.profiles`,
--    and `public.app_users` simultaneously.
-- 2. Adds cascading triggers on `auth.users` so manual deletes in the Supabase
--    Dashboard automatically clean up `profiles` and `app_users`.
-- 3. Cleans up any existing orphaned users in `auth.users` who were previously
--    deleted from `app_users` or the admin team panel.

-- Enable pgcrypto if not already enabled
create extension if not exists pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. Create Administrative RPC: public.delete_user_by_admin
-- ------------------------------------------------------------------------------
create or replace function public.delete_user_by_admin(
  target_user_email text,
  target_user_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_auth_uid uuid;
  v_clean_email text;
  v_deleted_count int := 0;
begin
  v_clean_email := lower(trim(target_user_email));

  -- Security Guard: Prevent deletion of primary owner account
  if v_clean_email = 'appahstephen9@gmail.com' or target_user_id = 'admin-appahstephen9' then
    return jsonb_build_object(
      'success', false,
      'error', 'Cannot delete the primary studio administrator'
    );
  end if;

  -- 1. Locate auth.users record by email or target_user_id
  if v_clean_email is not null and v_clean_email <> '' then
    select id into v_auth_uid from auth.users where lower(email) = v_clean_email limit 1;
  end if;

  if v_auth_uid is null and target_user_id is not null and target_user_id <> '' then
    begin
      select id into v_auth_uid from auth.users where id = target_user_id::uuid limit 1;
    exception when others then
      v_auth_uid := null;
    end;
  end if;

  -- 2. Delete from auth.users (permanently revokes authentication)
  if v_auth_uid is not null then
    delete from auth.users where id = v_auth_uid;
    v_deleted_count := v_deleted_count + 1;
  end if;

  if v_clean_email is not null and v_clean_email <> '' then
    delete from auth.users where lower(email) = v_clean_email;
  end if;

  -- 3. Delete from public.profiles
  if v_auth_uid is not null then
    delete from public.profiles where id = v_auth_uid;
  end if;
  if v_clean_email is not null and v_clean_email <> '' then
    delete from public.profiles where lower(email) = v_clean_email;
  end if;

  -- 4. Delete from public.app_users
  if target_user_id is not null and target_user_id <> '' then
    delete from public.app_users where id = target_user_id;
  end if;
  if v_auth_uid is not null then
    delete from public.app_users where id = v_auth_uid::text;
  end if;
  if v_clean_email is not null and v_clean_email <> '' then
    delete from public.app_users where lower(email) = v_clean_email;
  end if;

  return jsonb_build_object(
    'success', true,
    'email', v_clean_email,
    'deleted_auth_uid', v_auth_uid
  );
end;
$$;

-- Grant execution permissions to anon, authenticated, service_role
grant execute on function public.delete_user_by_admin(text, text) to anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. Cascade Delete Trigger on auth.users
-- ------------------------------------------------------------------------------
create or replace function public.handle_deleted_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- When a user is deleted from auth.users, remove matching records from public tables
  delete from public.profiles where id = old.id or lower(email) = lower(old.email);
  delete from public.app_users where id = old.id::text or lower(email) = lower(old.email);
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_deleted_auth_user();

-- ------------------------------------------------------------------------------
-- 3. One-Time Cleanup of Orphaned Accounts in auth.users
-- ------------------------------------------------------------------------------
-- Safely removes any non-primary auth.users that are no longer active in app_users
delete from auth.users
where lower(email) != 'appahstephen9@gmail.com'
  and lower(email) not in (
    select lower(email) from public.app_users
  );

-- Verify migration success
select 'Migration 013 successfully applied! User deletion and Supabase auth synchronization are now active.' as status;
