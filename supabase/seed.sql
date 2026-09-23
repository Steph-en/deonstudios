-- Supabase Seed Data for Deon Studios Portfolio CMS

-- 1. Insert Categories
insert into public.categories (id, name, slug, description, color, icon, display_order)
values
  ('11111111-1111-1111-1111-111111111111', 'Editorial', 'editorial', 'Magazine covers, cultural narratives, and visual stories', '#e5e5e5', 'book-open', 1),
  ('22222222-2222-2222-2222-222222222222', 'Fashion', 'fashion', 'High-fashion campaigns, lookbooks, and textile architecture', '#d4d4d4', 'sparkles', 2),
  ('33333333-3333-3333-3333-333333333333', 'Commercial', 'commercial', 'Brand advertising, product storytelling, and luxury objects', '#a3a3a3', 'briefcase', 3),
  ('44444444-4444-4444-4444-444444444444', 'Portraiture', 'portraiture', 'Intimate studio portraits, cultural icons, and human form', '#737373', 'camera', 4)
on conflict (slug) do nothing;

-- 2. Insert Projects
insert into public.projects (
  id,
  title,
  slug,
  category_id,
  client,
  year,
  role,
  description,
  long_description,
  status,
  featured,
  preview_image,
  preview_video,
  hero_image,
  hero_video,
  seo_title,
  seo_description,
  seo_keywords,
  published_at
) values
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Helmet of Heritage',
  'helmet-of-heritage',
  '11111111-1111-1111-1111-111111111111',
  'Guzangs Magazine',
  '2025',
  'Lead Photographer & Creative Director',
  'Cover feature for Guzangs Digital Issue 01 featuring NFL standout Jeremiah Owusu-Koramoah. An exploration of ancestral African lineage, warrior headpieces, and modern sportswear identity.',
  'An in-depth editorial campaign created in collaboration with Guzangs Magazine and NFL athlete Jeremiah Owusu-Koramoah. Shot between Cleveland and Accra, this visual suite bridges ancestral Akan brass sculpture with contemporary performance silhouettes.',
  'published',
  true,
  '/assets/gideon_boadi_portrait.png',
  '/videos/hero-desktop.mp4',
  '/assets/gideon_boadi_portrait.png',
  '/videos/hero-desktop.mp4',
  'Helmet of Heritage — Guzangs Magazine | Deon Studios',
  'Cover feature for Guzangs Digital Issue 01 featuring Jeremiah Owusu-Koramoah photographed by Gideon Boadi.',
  'Gideon Boadi, Jeremiah Owusu-Koramoah, Guzangs Magazine, African Fashion, Editorial Photography',
  now()
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Vlisco Modern Tapestry',
  'vlisco-modern-tapestry',
  '22222222-2222-2222-2222-222222222222',
  'Vlisco Netherlands & West Africa',
  '2025',
  'Creative Director & Cinematographer',
  'Global heritage textile campaign exploring fluid Wax Hollandais drapes against raw architectural concrete.',
  'A high-concept visual campaign reimagining traditional wax resist textiles through architectural draping, dramatic natural light falloff, and contemporary Accra silhouettes.',
  'published',
  true,
  '/assets/gideon_boadi_portrait.png',
  null,
  '/assets/gideon_boadi_portrait.png',
  null,
  'Vlisco Modern Tapestry — Global Campaign | Deon Studios',
  'Global heritage textile campaign exploring fluid Wax Hollandais drapes photographed by Gideon Boadi.',
  'Vlisco, Wax Hollandais, African Textile, Fashion Photography, Accra Studio',
  now()
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Daniel Duveprime Beauty',
  'daniel-duveprime-beauty',
  '44444444-4444-4444-4444-444444444444',
  'Duveprime Cosmetic Labs',
  '2024',
  'Photographer & Lighting Director',
  'Macro skin textures, melanin illumination, and sculptural cosmetic geometry shot on medium format digital.',
  'Shot with Hasselblad medium format and custom ring-light arrays to celebrate hyper-detailed melanin skin topography, metallic pigments, and tactile cosmetic textures.',
  'published',
  true,
  '/assets/gideon_boadi_portrait.png',
  null,
  '/assets/gideon_boadi_portrait.png',
  null,
  'Daniel Duveprime Beauty — Cosmetic Campaign | Deon Studios',
  'Macro skin textures and melanin illumination captured on medium format digital by Gideon Boadi.',
  'Beauty Photography, Macro Skin, Melanin, Cosmetic Advertising',
  now()
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Dazed Generation Pulse',
  'dazed-generation-pulse',
  '11111111-1111-1111-1111-111111111111',
  'Dazed Digital / Independent',
  '2025',
  'Director & Photographer',
  'Subcultural chronicle of West Africa emerging skate and sonic vanguard in Jamestown and Osu.',
  'An energetic portrait of the Jamestown skate community, sound selectors, and alternative youth culture pioneering new sonic frontiers in Accra.',
  'published',
  false,
  '/assets/gideon_boadi_portrait.png',
  null,
  '/assets/gideon_boadi_portrait.png',
  null,
  'Dazed Generation Pulse — Subcultural Chronicle | Deon Studios',
  'West Africa skate and sonic vanguard documented by Gideon Boadi.',
  'Dazed, Youth Culture, Accra Skate, Streetwear',
  now()
)
on conflict (slug) do nothing;

-- 3. Insert Case Study Sections
insert into public.project_sections (
  project_id,
  section_type,
  title,
  content,
  display_order
) values
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'overview',
  'Executive Creative Overview',
  'Commissioned by Guzangs Magazine for their inaugural digital cover series, Deon Studios was tasked with creating an indelible visual nexus connecting ancestral Akan warrior regalia with the elite physical presence of NFL linebacker Jeremiah Owusu-Koramoah.',
  1
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'challenge',
  'Visual & Spatial Challenge',
  'The brief required balancing historical reverence with avant-garde editorial punch. We had to avoid cliché folklore costumes, treating traditional ceremonial headwear as living sculpture rather than museum relics.',
  2
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'solution',
  'The Deon Studios Solution',
  'We utilized 4000W tungsten continuous lights through 12x12 diffusion scrims to sculpt the metallic sheen of the bronze helmet while maintaining deep, velvety shadow contours across the athlete facial structure.',
  3
),
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'results',
  'Cultural & Critical Impact',
  'The cover received over 4.2 million digital impressions across international design and sports media within 48 hours of launch, cited by Hypebeast, GQ, and OkayAfrica as one of the defining sports culture covers of 2025.',
  4
);

-- 4. Insert Initial Analytics
insert into public.analytics (project_id, country, device, traffic_source, page_url, user_session_id, viewed_at)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ghana', 'desktop', 'direct', '/#project-helmet-of-heritage', 'seed-session-1', now() - interval '5 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'United States', 'mobile', 'google', '/#project-helmet-of-heritage', 'seed-session-2', now() - interval '4 days'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'United Kingdom', 'desktop', 'instagram', '/#project-helmet-of-heritage', 'seed-session-3', now() - interval '3 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'France', 'mobile', 'direct', '/#project-vlisco-modern-tapestry', 'seed-session-4', now() - interval '2 days'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Nigeria', 'desktop', 'twitter', '/#project-daniel-duveprime-beauty', 'seed-session-5', now() - interval '1 day'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Germany', 'desktop', 'direct', '/#project-helmet-of-heritage', 'seed-session-6', now() - interval '2 hours')
on conflict do nothing;
