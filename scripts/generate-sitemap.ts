import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = (
  process.env.CANONICAL_URL ||
  process.env.SITE_URL ||
  'https://gideonboadi.com'
).replace(/\/+$/, '');

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  'https://oorbvpnuivsyfxftlqwr.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';

interface ProjectEntry {
  id?: string;
  slug: string;
  title?: string;
  updated_at?: string;
  created_at?: string;
  hero_image?: string;
  preview_image?: string;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export async function generateSitemap(): Promise<{
  xml: string;
  projectCount: number;
  slugs: string[];
}> {
  const projectsMap = new Map<string, ProjectEntry>();
  const projectImagesMap = new Map<string, Array<{ url: string; title?: string }>>();

  // 1. Attempt to fetch live projects from Supabase
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: dbProjects, error: projErr } = await supabase
      .from('projects')
      .select('id, title, slug, status, preview_image, hero_image, updated_at, created_at')
      .eq('status', 'published');

    if (!projErr && Array.isArray(dbProjects)) {
      for (const p of dbProjects) {
        if (p.slug && typeof p.slug === 'string') {
          projectsMap.set(p.slug.trim(), {
            id: p.id,
            slug: p.slug.trim(),
            title: p.title || p.slug,
            updated_at: p.updated_at,
            created_at: p.created_at,
            hero_image: p.hero_image,
            preview_image: p.preview_image,
          });
        }
      }
    }

    // Attempt to fetch media for projects to enrich image sitemap
    const { data: mediaData, error: mediaErr } = await supabase
      .from('project_media')
      .select('project_id, media_url, alt_text');

    if (!mediaErr && Array.isArray(mediaData)) {
      for (const m of mediaData) {
        if (m.project_id && m.media_url) {
          const list = projectImagesMap.get(m.project_id) || [];
          list.push({ url: m.media_url, title: m.alt_text || undefined });
          projectImagesMap.set(m.project_id, list);
        }
      }
    }
  } catch (err) {
    console.warn('[Sitemap Generator] Note: Could not query Supabase directly:', err);
  }

  // 2. Fallback / supplement from data/db.json
  try {
    const dbJsonPath = path.resolve(rootDir, 'data', 'db.json');
    if (fs.existsSync(dbJsonPath)) {
      const raw = fs.readFileSync(dbJsonPath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.projects)) {
        for (const p of parsed.projects) {
          if (p.slug && !p.deleted_at && p.status === 'published' && !projectsMap.has(p.slug)) {
            projectsMap.set(p.slug, {
              id: p.id,
              slug: p.slug,
              title: p.title || p.slug,
              updated_at: p.updated_at,
              created_at: p.created_at,
              hero_image: p.hero_image,
              preview_image: p.preview_image,
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Sitemap Generator] Note: Could not read local db.json:', err);
  }

  // 3. Known project slugs safeguard (ensuring core projects are never omitted)
  const knownCoreSlugs: ProjectEntry[] = [
    { slug: 'daniel-diyepriye-beauty', title: 'Daniel Diyepriye Beauty' },
    { slug: 'shadraq-stone', title: 'Shadraq Stone' },
    { slug: 'puma', title: 'LISA / Puma' },
  ];

  for (const core of knownCoreSlugs) {
    if (!projectsMap.has(core.slug)) {
      projectsMap.set(core.slug, core);
    }
  }

  const projects = Array.from(projectsMap.values());
  const todayStr = formatDate();

  // 4. Construct Sitemaps XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // Root / Homepage
  xml += `  <!-- Main Landing Page -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}/</loc>\n`;
  xml += `    <lastmod>${todayStr}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n\n`;

  // About Page
  xml += `  <!-- About & Bio -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}/about</loc>\n`;
  xml += `    <lastmod>${todayStr}</lastmod>\n`;
  xml += `    <changefreq>monthly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n\n`;

  // Contact Page
  xml += `  <!-- Contact & Studio Booking -->\n`;
  xml += `  <url>\n`;
  xml += `    <loc>${BASE_URL}/contact</loc>\n`;
  xml += `    <lastmod>${todayStr}</lastmod>\n`;
  xml += `    <changefreq>monthly</changefreq>\n`;
  xml += `    <priority>0.8</priority>\n`;
  xml += `  </url>\n\n`;

  // Project slugs
  xml += `  <!-- Project Archive & Editorial Detail Pages -->\n`;
  for (const project of projects) {
    const lastmod = formatDate(project.updated_at || project.created_at);
    const projectUrl = `${BASE_URL}/project/${encodeURIComponent(project.slug)}`;

    xml += `  <url>\n`;
    xml += `    <loc>${projectUrl}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;

    // Add main project images for Google Image Search
    const images: Array<{ url: string; title?: string }> = [];
    if (project.preview_image) {
      images.push({ url: project.preview_image, title: project.title });
    }
    if (project.hero_image && project.hero_image !== project.preview_image) {
      images.push({ url: project.hero_image, title: project.title });
    }
    if (project.id && projectImagesMap.has(project.id)) {
      const gallery = projectImagesMap.get(project.id) || [];
      for (const g of gallery) {
        if (!images.some((i) => i.url === g.url)) {
          images.push(g);
        }
      }
    }

    for (const img of images.slice(0, 10)) {
      if (img.url && img.url.startsWith('http')) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(img.url)}</image:loc>\n`;
        if (img.title) {
          xml += `      <image:title>${escapeXml(img.title)}</image:title>\n`;
        }
        xml += `    </image:image>\n`;
      }
    }

    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  return {
    xml,
    projectCount: projects.length,
    slugs: projects.map((p) => p.slug),
  };
}

async function main() {
  console.log('[Sitemap] Generating sitemap.xml...');
  const { xml, projectCount, slugs } = await generateSitemap();

  const publicDir = path.resolve(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Write to public/sitemap.xml
  const publicSitemapPath = path.resolve(publicDir, 'sitemap.xml');
  fs.writeFileSync(publicSitemapPath, xml, 'utf-8');
  console.log(`[Sitemap] Written to ${publicSitemapPath}`);

  // 2. Write robots.txt to public/
  const robotsTxtContent = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/*

Sitemap: ${BASE_URL}/sitemap.xml
`;
  const publicRobotsPath = path.resolve(publicDir, 'robots.txt');
  fs.writeFileSync(publicRobotsPath, robotsTxtContent, 'utf-8');
  console.log(`[Sitemap] Written robots.txt to ${publicRobotsPath}`);

  // 3. Write directly to dist/sitemap.xml and dist/robots.txt if dist directory exists
  const distDir = path.resolve(rootDir, 'dist');
  if (fs.existsSync(distDir)) {
    const distSitemapPath = path.resolve(distDir, 'sitemap.xml');
    fs.writeFileSync(distSitemapPath, xml, 'utf-8');
    console.log(`[Sitemap] Output sitemap to ${distSitemapPath}`);

    const distRobotsPath = path.resolve(distDir, 'robots.txt');
    fs.writeFileSync(distRobotsPath, robotsTxtContent, 'utf-8');
    console.log(`[Sitemap] Output robots.txt to ${distRobotsPath}`);
  }

  console.log(`[Sitemap] Successfully indexed ${projectCount} projects with slugs:`);
  console.log(slugs.map((s) => `  • /project/${s}`).join('\n'));
}

// Execute if run as script
if (process.argv[1] && process.argv[1].endsWith('generate-sitemap.ts')) {
  main().catch((err) => {
    console.error('[Sitemap] Generation failed:', err);
    process.exit(1);
  });
}
