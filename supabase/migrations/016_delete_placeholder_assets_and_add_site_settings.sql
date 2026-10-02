-- ==============================================================================
-- MIGRATION 016: REMOVE PLACEHOLDER SEEDS & CONFIGURE DYNAMIC SITE SETTINGS
-- ==============================================================================
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- 
-- 1. Cleans out all sample placeholder projects, portfolio shots, and product shots
-- 2. Deletes any un-uploaded stock assets / Unsplash images
-- 3. Creates the site_settings table for dynamic Hero & About management in the CMS

-- 1. DELETE PLACEHOLDER PROJECT MEDIA & SECTIONS
DELETE FROM public.project_media
WHERE project_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
OR media_url LIKE '%unsplash%'
OR media_url LIKE '%/assets/projects/%'
OR storage_path LIKE '%/assets/projects/%'
OR storage_path LIKE '%unsplash%';

DELETE FROM public.project_sections
WHERE project_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- 2. DELETE PLACEHOLDER PROJECTS
DELETE FROM public.projects
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
)
OR slug IN ('helmet-of-heritage', 'daniel-duveprime-beauty', 'bottega-veneta-leather')
OR preview_image LIKE '%unsplash%'
OR preview_image LIKE '%/assets/projects/%'
OR hero_image LIKE '%unsplash%'
OR hero_image LIKE '%/assets/projects/%';

-- 3. DELETE PLACEHOLDER PORTFOLIO SHOTS
DELETE FROM public.portfolio_shots
WHERE id IN (
  '11111111-0000-0000-0000-000000000001',
  '11111111-0000-0000-0000-000000000002',
  '11111111-0000-0000-0000-000000000003'
)
OR url LIKE '%unsplash%'
OR url LIKE '%/assets/projects/%'
OR fallback_url LIKE '%unsplash%'
OR fallback_url LIKE '%/assets/projects/%';

-- 4. DELETE PLACEHOLDER PRODUCT SHOTS
DELETE FROM public.product_shots
WHERE id IN (
  '22222222-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000003'
)
OR url LIKE '%unsplash%'
OR url LIKE '%/assets/projects/%'
OR fallback_url LIKE '%unsplash%'
OR fallback_url LIKE '%/assets/projects/%';

-- 5. CREATE SITE SETTINGS TABLE (FOR DYNAMIC HERO & ABOUT SECTIONS IN CMS)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read site_settings" ON public.site_settings;
CREATE POLICY "Allow public read site_settings"
  ON public.site_settings FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow all write site_settings" ON public.site_settings;
CREATE POLICY "Allow all write site_settings"
  ON public.site_settings FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
