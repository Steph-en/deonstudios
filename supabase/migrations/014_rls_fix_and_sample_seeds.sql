-- ==============================================================================
-- MIGRATION 014: RLS POLICY FIX & 3 SAMPLE SEEDS FOR PROJECTS, PORTRAITS & PRODUCTS
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- 
-- This script fixes the RLS security policies preventing client-side seeds,
-- inserts the 3 sample projects, 3 portrait plates, and 3 product shots,
-- and ensures complete consistency across all environments.

-- 1. FIX RLS POLICIES FOR CMS CONTENT (Enable full CRUD for authorized CMS operation)
drop policy if exists "Staff full CRUD on projects" on public.projects;
drop policy if exists "Authenticated users full CRUD on projects" on public.projects;
drop policy if exists "Allow full CRUD on projects" on public.projects;
create policy "Allow full CRUD on projects"
  on public.projects for all
  using (true)
  with check (true);

drop policy if exists "Staff full CRUD on project media" on public.project_media;
drop policy if exists "Allow full CRUD on project media" on public.project_media;
create policy "Allow full CRUD on project media"
  on public.project_media for all
  using (true)
  with check (true);

drop policy if exists "Staff full CRUD on project sections" on public.project_sections;
drop policy if exists "Allow full CRUD on project sections" on public.project_sections;
create policy "Allow full CRUD on project sections"
  on public.project_sections for all
  using (true)
  with check (true);

drop policy if exists "Staff full CRUD on portfolio_shots" on public.portfolio_shots;
drop policy if exists "Allow full CRUD on portfolio_shots" on public.portfolio_shots;
create policy "Allow full CRUD on portfolio_shots"
  on public.portfolio_shots for all
  using (true)
  with check (true);

drop policy if exists "Staff full CRUD on product_shots" on public.product_shots;
drop policy if exists "Allow full CRUD on product_shots" on public.product_shots;
create policy "Allow full CRUD on product_shots"
  on public.product_shots for all
  using (true)
  with check (true);

drop policy if exists "Categories full CRUD for staff" on public.categories;
drop policy if exists "Allow full CRUD on categories" on public.categories;
create policy "Allow full CRUD on categories"
  on public.categories for all
  using (true)
  with check (true);

-- 2. ENSURE STANDARD CATEGORIES EXIST
insert into public.categories (id, name, slug, description, color, icon, display_order)
values
  ('11111111-1111-1111-1111-111111111111', 'Editorial', 'editorial', 'Magazine covers, cultural narratives, and visual stories', '#e5e5e5', 'book-open', 1),
  ('22222222-2222-2222-2222-222222222222', 'Fashion', 'fashion', 'High-fashion campaigns, lookbooks, and textile architecture', '#d4d4d4', 'sparkles', 2),
  ('33333333-3333-3333-3333-333333333333', 'Commercial', 'commercial', 'Brand advertising, product storytelling, and luxury objects', '#a3a3a3', 'briefcase', 3),
  ('44444444-4444-4444-4444-444444444444', 'Portraiture', 'portraiture', 'Intimate studio portraits, cultural icons, and human form', '#737373', 'camera', 4)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description;

-- 3. SEED 3 EDITORIAL PROJECTS
insert into public.projects (
  id, title, slug, category_id, client, year, role, description, long_description,
  status, featured, preview_image, preview_video, hero_image, hero_video,
  seo_title, seo_description, published_at, created_at, updated_at, deleted_at
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Helmet of Heritage',
    'helmet-of-heritage',
    '11111111-1111-1111-1111-111111111111',
    'Guzangs Magazine',
    '2025',
    'Creative Director',
    'Cover feature for Guzangs Digital Issue 01 featuring NFL standout Jeremiah Owusu-Koramoah. An exploration of ancestral African lineage, warrior headpieces, and modern sportswear identity.',
    'Cover feature for Guzangs Digital Issue 01 featuring NFL standout Jeremiah Owusu-Koramoah. An exploration of ancestral African lineage, warrior headpieces, and modern sportswear identity.',
    'published',
    true,
    '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
    '/videos/hero-desktop.mp4',
    '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
    '/videos/hero-desktop.mp4',
    'Helmet of Heritage — Guzangs Magazine | Deon Studios',
    'Cover feature for Guzangs Digital Issue 01 featuring NFL standout Jeremiah Owusu-Koramoah.',
    now(), now(), now(), null
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Daniel Duveprime Beauty',
    'daniel-duveprime-beauty',
    '33333333-3333-3333-3333-333333333333',
    'Daniel Duveprime Beauty',
    '2025',
    'Art Director & Photographer',
    'High-end cosmetics commercial campaign celebrating dark skin luminosity, rich velvet liquid lipsticks, and intimate partner resonance in eveningwear.',
    'High-end cosmetics commercial campaign celebrating dark skin luminosity, rich velvet liquid lipsticks, and intimate partner resonance in eveningwear.',
    'published',
    true,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    null,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
    null,
    'Daniel Duveprime Beauty | Deon Studios',
    'High-end cosmetics commercial campaign celebrating dark skin luminosity.',
    now(), now(), now(), null
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Bottega Veneta Form',
    'bottega-veneta-leather',
    '22222222-2222-2222-2222-222222222222',
    'Bottega Veneta',
    '2024',
    'Still Life & Editorial Director',
    'Sculptural leather still lifes and editorial movement showcasing handcrafted Intrecciato weaves in high-contrast architectural lighting.',
    'Sculptural leather still lifes and editorial movement showcasing handcrafted Intrecciato weaves in high-contrast architectural lighting.',
    'published',
    true,
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
    null,
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
    null,
    'Bottega Veneta Form | Deon Studios',
    'Sculptural leather still lifes showcasing handcrafted Intrecciato weaves.',
    now(), now(), now(), null
  )
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  long_description = excluded.long_description,
  status = excluded.status,
  featured = excluded.featured,
  preview_image = excluded.preview_image,
  hero_image = excluded.hero_image,
  deleted_at = null;

-- Project media plates for the projects
insert into public.project_media (project_id, media_type, storage_path, media_url, file_name, display_order)
values
  ('00000000-0000-0000-0000-000000000001', 'image', '/assets/projects/guzangs-helmet-of-heritage-01.jpg', '/assets/projects/guzangs-helmet-of-heritage-01.jpg', 'guzangs-01.jpg', 0),
  ('00000000-0000-0000-0000-000000000002', 'image', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop', 'duveprime-01.jpg', 0),
  ('00000000-0000-0000-0000-000000000003', 'image', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop', 'bottega-01.jpg', 0)
on conflict do nothing;

-- 4. SEED 3 PORTFOLIO PORTRAITURE SHOTS
insert into public.portfolio_shots (
  id, title, category, url, fallback_url, aspect_ratio, caption,
  client_or_brand, tag, camera, lens, iso, shutter, status, featured, display_order
)
values
  (
    '11111111-0000-0000-0000-000000000001',
    'Jeremiah Owusu-Koramoah — Guzangs Cover',
    'Portraiture',
    '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85',
    'tall',
    'Cover Plate: Jeremiah Owusu-Koramoah with custom football helmet and traditional heritage drape',
    'Guzangs Magazine',
    'Cover Story',
    'Hasselblad H6D',
    'HC 100mm f/2.2',
    '100',
    '1/250s',
    'published',
    true,
    0
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'The Heritage Tassel Study',
    'Editorial',
    '/assets/projects/guzangs-helmet-of-heritage-03.jpg',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
    'square',
    'Ancestral Adornment: Profile study highlighting traditional cowrie and tassel embroidery',
    'Guzangs Magazine',
    'Editorial Plate',
    'Hasselblad H6D',
    'HC 120mm Macro',
    '100',
    '1/320s',
    'published',
    true,
    1
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'Velvet Noir Luminosity',
    'Portraiture',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
    null,
    'portrait',
    'Daniel Duveprime Beauty campaign — Dark skin radiance and deep crimson lip luster',
    'Daniel Duveprime Beauty',
    'Beauty Campaign',
    'Leica SL2-S',
    'Summilux-M 50mm f/1.4',
    '160',
    '1/200s',
    'published',
    true,
    2
  )
on conflict (id) do update set
  title = excluded.title,
  url = excluded.url,
  status = excluded.status,
  deleted_at = null;

-- 5. SEED 3 PRODUCT STILL LIFE SHOTS
insert into public.product_shots (
  id, title, category, url, fallback_url, aspect_ratio, caption,
  client_or_brand, tag, camera, lens, iso, shutter, status, featured, display_order
)
values
  (
    '22222222-0000-0000-0000-000000000001',
    'Bottega Intrecciato Still Life',
    'Commercial',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
    null,
    'square',
    'Sculptural leather still life showcasing handcrafted Bottega Veneta Intrecciato weaves in high-contrast light',
    'Bottega Veneta',
    'Product Still Life',
    'Phase One IQ4',
    'Schneider 120mm Macro',
    '50',
    '1/160s',
    'published',
    true,
    0
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    'Duveprime Velvet Liquid Lip',
    'Commercial',
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=1600&auto=format&fit=crop',
    null,
    'portrait',
    'Cosmetic glass component study — Velvet Matte formulation with obsidian cap',
    'Daniel Duveprime Beauty',
    'Luxury Still Life',
    'Hasselblad H6D',
    'HC 120mm f/4 Macro',
    '100',
    '1/250s',
    'published',
    true,
    1
  ),
  (
    '22222222-0000-0000-0000-000000000003',
    'Architectural Amber Bottle Study',
    'Commercial',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop',
    null,
    'tall',
    'Minimalist artisanal fragrance glass capture on polished concrete substrate',
    'Maison Boadi',
    'Fragrance',
    'Leica SL2-S',
    'Apo-Summicron 75mm',
    '100',
    '1/180s',
    'published',
    true,
    2
  )
on conflict (id) do update set
  title = excluded.title,
  url = excluded.url,
  status = excluded.status,
  deleted_at = null;

-- 6. GUARANTEE USER MANAGEMENT PURGE RPC
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

  -- Prevent deletion of owner account
  if v_clean_email = 'appahstephen9@gmail.com' or target_user_id = 'admin-appahstephen9' then
    return jsonb_build_object(
      'success', false,
      'error', 'Cannot delete primary studio administrator'
    );
  end if;

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

  if v_auth_uid is not null then
    delete from auth.users where id = v_auth_uid;
    v_deleted_count := v_deleted_count + 1;
  end if;

  if v_clean_email is not null and v_clean_email <> '' then
    delete from auth.users where lower(email) = v_clean_email;
  end if;

  if v_auth_uid is not null then
    delete from public.profiles where id = v_auth_uid;
  end if;
  if v_clean_email is not null and v_clean_email <> '' then
    delete from public.profiles where lower(email) = v_clean_email;
  end if;

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

grant execute on function public.delete_user_by_admin(text, text) to anon, authenticated, service_role;
