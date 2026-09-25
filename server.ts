import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  projects: any[];
  portfolio: any[];
  products: any[];
  categories: any[];
  media: any[];
  deleted_keys: string[];
  users: any[];
  config: {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
    siteUrl?: string;
  };
}

// Default initial data seeded once
function getInitialDatabase(): DatabaseSchema {
  return {
    categories: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Editorial',
        slug: 'editorial',
        description: 'Magazine covers, cultural narratives, and visual stories',
        color: '#e5e5e5',
        icon: 'book-open',
        display_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Fashion',
        slug: 'fashion',
        description: 'High-fashion campaigns, lookbooks, and textile architecture',
        color: '#d4d4d4',
        icon: 'sparkles',
        display_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Commercial',
        slug: 'commercial',
        description: 'Brand advertising, product storytelling, and luxury objects',
        color: '#a3a3a3',
        icon: 'briefcase',
        display_order: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Portraiture',
        slug: 'portraiture',
        description: 'Intimate studio portraits, cultural icons, and human form',
        color: '#737373',
        icon: 'camera',
        display_order: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Helmet of Heritage',
        slug: 'helmet-of-heritage',
        category_id: '11111111-1111-1111-1111-111111111111',
        client: 'Guzangs Magazine',
        year: '2025',
        role: 'Creative Director',
        description: 'Cover feature for Guzangs Digital Issue 01 featuring NFL standout Jeremiah Owusu-Koramoah. An exploration of ancestral African lineage, warrior headpieces, and modern sportswear identity.',
        long_description: 'Cover feature for Guzangs Digital Issue 01 featuring NFL standout Jeremiah Owusu-Koramoah. An exploration of ancestral African lineage, warrior headpieces, and modern sportswear identity.',
        status: 'published',
        featured: true,
        preview_image: '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
        preview_video: '/videos/hero-desktop.mp4',
        hero_image: '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
        hero_video: '/videos/hero-desktop.mp4',
        og_image: '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
        seo_title: 'Helmet of Heritage — Guzangs Magazine | Deon Studios',
        seo_description: 'Cover feature for Guzangs Digital Issue 01 featuring NFL standout Jeremiah Owusu-Koramoah.',
        seo_keywords: 'Gideon Boadi, Guzangs Magazine, Editorial, Photography',
        published_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        category: {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Editorial',
          slug: 'editorial',
          description: null,
          color: '#e5e5e5',
          icon: 'book-open',
          display_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        media: [
          {
            id: 'media-helmet-of-heritage-0',
            project_id: 'proj-1',
            media_type: 'image',
            storage_path: '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
            media_url: '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
            thumbnail_path: '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
            thumbnail_url: '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
            file_name: 'helmet-of-heritage-0.jpg',
            file_size: null,
            mime_type: 'image/jpeg',
            width: 1200,
            height: 1600,
            alt_text: 'Cover Plate: Jeremiah Owusu-Koramoah with custom football helmet and traditional heritage drape',
            display_order: 0,
            created_at: new Date().toISOString(),
          },
          {
            id: 'media-helmet-of-heritage-1',
            project_id: 'proj-1',
            media_type: 'image',
            storage_path: '/assets/projects/guzangs-helmet-of-heritage-02.jpg',
            media_url: '/assets/projects/guzangs-helmet-of-heritage-02.jpg',
            thumbnail_path: '/assets/projects/guzangs-helmet-of-heritage-02.jpg',
            thumbnail_url: '/assets/projects/guzangs-helmet-of-heritage-02.jpg',
            file_name: 'helmet-of-heritage-1.jpg',
            file_size: null,
            mime_type: 'image/jpeg',
            width: 1200,
            height: 1600,
            alt_text: 'Warehouse Study: Green parachute trousers and knit cap framed against rustic crates',
            display_order: 1,
            created_at: new Date().toISOString(),
          },
          {
            id: 'media-helmet-of-heritage-2',
            project_id: 'proj-1',
            media_type: 'image',
            storage_path: '/assets/projects/guzangs-helmet-of-heritage-03.jpg',
            media_url: '/assets/projects/guzangs-helmet-of-heritage-03.jpg',
            thumbnail_path: '/assets/projects/guzangs-helmet-of-heritage-03.jpg',
            thumbnail_url: '/assets/projects/guzangs-helmet-of-heritage-03.jpg',
            file_name: 'helmet-of-heritage-2.jpg',
            file_size: null,
            mime_type: 'image/jpeg',
            width: 1200,
            height: 1600,
            alt_text: 'Ancestral Adornment: Profile study highlighting traditional cowrie embroidery',
            display_order: 2,
            created_at: new Date().toISOString(),
          },
        ],
        sections: [
          {
            id: 'sec-helmet-of-heritage-1',
            project_id: 'proj-1',
            title: 'Concept & Narrative',
            content: 'An exploration of ancestral African lineage, warrior headpieces, and modern sportswear identity.',
            display_order: 0,
            created_at: new Date().toISOString(),
          },
        ],
        viewsCount: 520,
      },
      {
        id: 'proj-2',
        title: 'Daniel Duveprime Beauty',
        slug: 'daniel-duveprime-beauty',
        category_id: '33333333-3333-3333-3333-333333333333',
        client: 'Daniel Duveprime Beauty',
        year: '2025',
        role: 'Art Director & Photographer',
        description: 'High-end cosmetics commercial campaign celebrating dark skin luminosity, rich velvet liquid lipsticks, and intimate partner resonance in eveningwear.',
        long_description: 'High-end cosmetics commercial campaign celebrating dark skin luminosity, rich velvet liquid lipsticks, and intimate partner resonance in eveningwear.',
        status: 'published',
        featured: true,
        preview_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
        preview_video: null,
        hero_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
        hero_video: null,
        og_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
        seo_title: 'Daniel Duveprime Beauty | Deon Studios',
        seo_description: 'High-end cosmetics commercial campaign celebrating dark skin luminosity.',
        seo_keywords: 'Cosmetics, Beauty, Gideon Boadi, Luxury Beauty',
        published_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        category: {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Commercial',
          slug: 'commercial',
          description: null,
          color: '#a3a3a3',
          icon: 'briefcase',
          display_order: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        media: [
          {
            id: 'media-duveprime-0',
            project_id: 'proj-2',
            media_type: 'image',
            storage_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
            media_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
            thumbnail_path: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
            thumbnail_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
            file_name: 'duveprime-campaign-hero.jpg',
            file_size: null,
            mime_type: 'image/jpeg',
            width: 1200,
            height: 1600,
            alt_text: 'Duveprime Velvet Lip campaign portrait',
            display_order: 0,
            created_at: new Date().toISOString(),
          },
        ],
        sections: [],
        viewsCount: 410,
      },
      {
        id: 'proj-3',
        title: 'Bottega Veneta Form',
        slug: 'bottega-veneta-leather',
        category_id: '22222222-2222-2222-2222-222222222222',
        client: 'Bottega Veneta',
        year: '2024',
        role: 'Still Life & Editorial Director',
        description: 'Sculptural leather still lifes and editorial movement showcasing handcrafted Intrecciato weaves in high-contrast architectural lighting.',
        long_description: 'Sculptural leather still lifes and editorial movement showcasing handcrafted Intrecciato weaves in high-contrast architectural lighting.',
        status: 'published',
        featured: true,
        preview_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
        preview_video: null,
        hero_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
        hero_video: null,
        og_image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
        seo_title: 'Bottega Veneta Form | Deon Studios',
        seo_description: 'Sculptural leather still lifes showcasing handcrafted Intrecciato weaves.',
        seo_keywords: 'Bottega Veneta, Luxury Leather, Gideon Boadi',
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        category: {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Fashion',
          slug: 'fashion',
          description: null,
          color: '#d4d4d4',
          icon: 'sparkles',
          display_order: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        media: [
          {
            id: 'media-bottega-0',
            project_id: 'proj-3',
            media_type: 'image',
            storage_path: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
            media_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
            thumbnail_path: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
            thumbnail_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
            file_name: 'bottega-editorial-lead.jpg',
            file_size: null,
            mime_type: 'image/jpeg',
            width: 1200,
            height: 1600,
            alt_text: 'Bottega Veneta Intrecciato still life study',
            display_order: 0,
            created_at: new Date().toISOString(),
          },
        ],
        sections: [],
        viewsCount: 380,
      },
    ],
    portfolio: [
      {
        id: 'port-1',
        title: 'Jeremiah Owusu-Koramoah — Guzangs Cover',
        category: 'Portraiture',
        url: '/assets/projects/guzangs-helmet-of-heritage-01.jpg',
        fallback_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85',
        aspect_ratio: 'tall',
        caption: 'Cover Plate: Jeremiah Owusu-Koramoah with custom football helmet and traditional heritage drape',
        client_or_brand: 'Guzangs Magazine',
        tag: 'Cover Story',
        camera: 'Hasselblad H6D',
        lens: 'HC 100mm f/2.2',
        iso: '100',
        shutter: '1/250s',
        status: 'published',
        featured: true,
        display_order: 0,
        created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
      {
        id: 'port-2',
        title: 'The Heritage Tassel Study',
        category: 'Editorial',
        url: '/assets/projects/guzangs-helmet-of-heritage-03.jpg',
        fallback_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
        aspect_ratio: 'square',
        caption: 'Ancestral Adornment: Profile study highlighting traditional cowrie and tassel embroidery',
        client_or_brand: 'Guzangs Magazine',
        tag: 'Editorial Plate',
        camera: 'Hasselblad H6D',
        lens: 'HC 120mm Macro',
        iso: '100',
        shutter: '1/320s',
        status: 'published',
        featured: true,
        display_order: 1,
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
      {
        id: 'port-3',
        title: 'Velvet Noir Luminosity',
        category: 'Portraiture',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
        fallback_url: null,
        aspect_ratio: 'portrait',
        caption: 'Daniel Duveprime Beauty campaign — Dark skin radiance and deep crimson lip luster',
        client_or_brand: 'Daniel Duveprime Beauty',
        tag: 'Beauty Campaign',
        camera: 'Leica SL2-S',
        lens: 'Summilux-M 50mm f/1.4',
        iso: '160',
        shutter: '1/200s',
        status: 'published',
        featured: true,
        display_order: 2,
        created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
    ],
    products: [
      {
        id: 'prod-1',
        title: 'Bottega Intrecciato Still Life',
        category: 'Commercial',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
        fallback_url: null,
        aspect_ratio: 'square',
        caption: 'Sculptural leather still life showcasing handcrafted Bottega Veneta Intrecciato weaves in high-contrast light',
        client_or_brand: 'Bottega Veneta',
        tag: 'Product Still Life',
        camera: 'Phase One IQ4',
        lens: 'Schneider 120mm Macro',
        iso: '50',
        shutter: '1/160s',
        status: 'published',
        featured: true,
        display_order: 0,
        created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
      {
        id: 'prod-2',
        title: 'Duveprime Velvet Liquid Lip',
        category: 'Commercial',
        url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=1600&auto=format&fit=crop',
        fallback_url: null,
        aspect_ratio: 'portrait',
        caption: 'Cosmetic glass component study — Velvet Matte formulation with obsidian cap',
        client_or_brand: 'Daniel Duveprime Beauty',
        tag: 'Luxury Still Life',
        camera: 'Hasselblad H6D',
        lens: 'HC 120mm f/4 Macro',
        iso: '100',
        shutter: '1/250s',
        status: 'published',
        featured: true,
        display_order: 1,
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
      {
        id: 'prod-3',
        title: 'Architectural Amber Bottle Study',
        category: 'Commercial',
        url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop',
        fallback_url: null,
        aspect_ratio: 'tall',
        caption: 'Minimalist artisanal fragrance glass capture on polished concrete substrate',
        client_or_brand: 'Maison Boadi',
        tag: 'Fragrance',
        camera: 'Leica SL2-S',
        lens: 'Apo-Summicron 75mm',
        iso: '100',
        shutter: '1/180s',
        status: 'published',
        featured: true,
        display_order: 2,
        created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      },
    ],
    // Clean media: starts with NO zombie sample placeholders
    media: [],
    deleted_keys: [],
    users: [
      {
        id: 'admin-appahstephen9',
        email: 'appahstephen9@gmail.com',
        username: 'appahstephen9',
        full_name: 'Stephen Appah',
        role: 'admin',
        created_at: new Date().toISOString(),
      },
    ],
    config: {
      supabaseUrl: process.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
      siteUrl: process.env.VITE_SITE_URL || '',
    },
  };
}

// In-memory cache + disk persistence
let db: DatabaseSchema;

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...getInitialDatabase(),
        ...parsed,
        config: {
          ...parsed.config,
          siteUrl: process.env.VITE_SITE_URL || parsed.config?.siteUrl || 'https://www.gideonboadi.com',
          supabaseUrl: process.env.VITE_SUPABASE_URL || parsed.config?.supabaseUrl || 'https://oorbvpnuivsyfxftlqwr.supabase.co',
          supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || parsed.config?.supabaseAnonKey || 'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV',
        },
      };
    }
  } catch (err) {
    console.error('Failed to read db.json, generating initial database:', err);
  }

  const initial = getInitialDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

db = loadDatabase();

async function startServer() {
  const app = express();

  // Known allowed origins for authentications and API requests
  const ALLOWED_ORIGINS = [
    'https://www.gideonboadi.com',
    'https://gideonboadi.com',
    'http://www.gideonboadi.com',
    'http://gideonboadi.com',
    'https://gideonboadi.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];

  // CORS Middleware: Allow https://www.gideonboadi.com and associated domains
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    const isAllowed =
      !origin ||
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith('.run.app') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('gideonboadi.com') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:');

    if (origin && isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey, X-Client-Info'
    );

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // Middleware for parsing JSON
  app.use(express.json({ limit: '50mb' }));

  // API Router
  const api = express.Router();

  // 1. Health check & status
  api.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      projectsCount: db.projects.length,
      portfolioCount: db.portfolio.length,
      productsCount: db.products.length,
      mediaCount: db.media.length,
      isSupabaseConfigured: Boolean(
        db.config?.supabaseUrl &&
        db.config?.supabaseAnonKey &&
        !db.config.supabaseUrl.includes('placeholder')
      ),
    });
  });

  // 2. Config & Supabase connection info
  api.get('/config', (_req: Request, res: Response) => {
    res.json({
      supabaseUrl: db.config?.supabaseUrl || '',
      siteUrl: db.config?.siteUrl || 'https://www.gideonboadi.com',
      allowedOrigins: ALLOWED_ORIGINS,
      isSupabaseConfigured: Boolean(
        db.config?.supabaseUrl &&
        db.config?.supabaseAnonKey &&
        !db.config.supabaseUrl.includes('placeholder')
      ),
    });
  });

  api.post('/config', (req: Request, res: Response) => {
    const { supabaseUrl, supabaseAnonKey } = req.body;
    db.config = {
      ...db.config,
      supabaseUrl: supabaseUrl || db.config.supabaseUrl,
      supabaseAnonKey: supabaseAnonKey || db.config.supabaseAnonKey,
    };
    saveDatabase(db);
    res.json({ success: true, config: { supabaseUrl: db.config.supabaseUrl } });
  });

  // 3. Projects API
  api.get('/projects', (req: Request, res: Response) => {
    let list = db.projects;
    const { status, categoryId, search, featured, includeDeleted } = req.query;

    if (!includeDeleted) {
      list = list.filter((p) => !p.deleted_at);
    }
    if (status && status !== 'all') {
      list = list.filter((p) => p.status === status);
    }
    if (categoryId) {
      list = list.filter((p) => p.category_id === categoryId);
    }
    if (featured !== undefined) {
      list = list.filter((p) => p.featured === (featured === 'true'));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.client?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  api.get('/projects/:idOrSlug', (req: Request, res: Response) => {
    const { idOrSlug } = req.params;
    const project = db.projects.find(
      (p) => (p.id === idOrSlug || p.slug === idOrSlug) && !p.deleted_at
    );
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  });

  api.post('/projects', (req: Request, res: Response) => {
    const newProject = {
      ...req.body,
      id: req.body.id || `proj-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    db.projects.unshift(newProject);
    saveDatabase(db);
    res.status(201).json(newProject);
  });

  api.put('/projects/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = db.projects.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    db.projects[idx] = {
      ...db.projects[idx],
      ...req.body,
      id,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(db);
    res.json(db.projects[idx]);
  });

  api.delete('/projects/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = db.projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      db.projects.splice(idx, 1);
      saveDatabase(db);
    }
    res.json({ success: true, id });
  });

  api.post('/projects/seed', (_req: Request, res: Response) => {
    const initial = getInitialDatabase();
    db.projects = initial.projects;
    saveDatabase(db);
    res.json({ success: true, count: db.projects.length, projects: db.projects });
  });

  // 4. Portfolio Shots API
  api.get('/portfolio', (req: Request, res: Response) => {
    let list = db.portfolio;
    const { status, category, search, includeDeleted } = req.query;

    if (!includeDeleted) {
      list = list.filter((s) => !s.deleted_at);
    }
    if (status && status !== 'all') {
      list = list.filter((s) => s.status === status);
    }
    if (category && category !== 'all') {
      list = list.filter((s) => s.category?.toLowerCase() === String(category).toLowerCase());
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.caption?.toLowerCase().includes(q) ||
          s.client_or_brand?.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  api.get('/portfolio/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const shot = db.portfolio.find((s) => s.id === id && !s.deleted_at);
    if (!shot) {
      return res.status(404).json({ error: 'Portfolio shot not found' });
    }
    res.json(shot);
  });

  api.post('/portfolio', (req: Request, res: Response) => {
    const newShot = {
      ...req.body,
      id: req.body.id || `port-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    db.portfolio.unshift(newShot);
    saveDatabase(db);
    res.status(201).json(newShot);
  });

  api.put('/portfolio/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = db.portfolio.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Portfolio shot not found' });
    }
    db.portfolio[idx] = {
      ...db.portfolio[idx],
      ...req.body,
      id,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(db);
    res.json(db.portfolio[idx]);
  });

  api.delete('/portfolio/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = db.portfolio.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.portfolio.splice(idx, 1);
      saveDatabase(db);
    }
    res.json({ success: true, id });
  });

  api.post('/portfolio/seed', (_req: Request, res: Response) => {
    const initial = getInitialDatabase();
    db.portfolio = initial.portfolio;
    saveDatabase(db);
    res.json({ success: true, count: db.portfolio.length, portfolio: db.portfolio });
  });

  // 5. Products API
  api.get('/products', (req: Request, res: Response) => {
    let list = db.products;
    const { status, category, search, includeDeleted } = req.query;

    if (!includeDeleted) {
      list = list.filter((p) => !p.deleted_at);
    }
    if (status && status !== 'all') {
      list = list.filter((p) => p.status === status);
    }
    if (category && category !== 'all') {
      list = list.filter((p) => p.category?.toLowerCase() === String(category).toLowerCase());
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.caption?.toLowerCase().includes(q) ||
          p.client_or_brand?.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });

  api.get('/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const prod = db.products.find((p) => p.id === id && !p.deleted_at);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(prod);
  });

  api.post('/products', (req: Request, res: Response) => {
    const newProd = {
      ...req.body,
      id: req.body.id || `prod-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    db.products.unshift(newProd);
    saveDatabase(db);
    res.status(201).json(newProd);
  });

  api.put('/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    db.products[idx] = {
      ...db.products[idx],
      ...req.body,
      id,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(db);
    res.json(db.products[idx]);
  });

  api.delete('/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      db.products.splice(idx, 1);
      saveDatabase(db);
    }
    res.json({ success: true, id });
  });

  api.post('/products/seed', (_req: Request, res: Response) => {
    const initial = getInitialDatabase();
    db.products = initial.products;
    saveDatabase(db);
    res.json({ success: true, count: db.products.length, products: db.products });
  });

  // 6. Categories API
  api.get('/categories', (_req: Request, res: Response) => {
    res.json(db.categories);
  });

  api.post('/categories', (req: Request, res: Response) => {
    const newCat = {
      ...req.body,
      id: req.body.id || `cat-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.categories.push(newCat);
    saveDatabase(db);
    res.status(201).json(newCat);
  });

  // 7. Media Library API (Permanent deletion guaranteed)
  api.get('/media', (_req: Request, res: Response) => {
    const deletedSet = new Set((db.deleted_keys || []).map((k) => k.toLowerCase()));
    const activeMedia = (db.media || []).filter(
      (m) =>
        !deletedSet.has(m.id?.toLowerCase()) &&
        !deletedSet.has(m.url?.toLowerCase()) &&
        !deletedSet.has(m.name?.toLowerCase())
    );
    res.json(activeMedia);
  });

  api.post('/media', (req: Request, res: Response) => {
    const newAsset = {
      id: req.body.id || `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: req.body.name || 'Untitled Asset',
      url: req.body.url,
      storagePath: req.body.storagePath || req.body.url,
      type: req.body.type || 'image',
      size: req.body.size || '1.5 MB',
      date: req.body.date || new Date().toISOString().split('T')[0],
      projectId: req.body.projectId || null,
    };

    // Remove from deleted_keys if re-added
    db.deleted_keys = (db.deleted_keys || []).filter(
      (k) => k.toLowerCase() !== newAsset.id.toLowerCase() && k.toLowerCase() !== newAsset.url.toLowerCase()
    );

    db.media = [newAsset, ...(db.media || [])];
    saveDatabase(db);
    res.status(201).json(newAsset);
  });

  api.delete('/media/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const url = req.query.url as string | undefined;

    if (!db.deleted_keys) db.deleted_keys = [];

    // Add keys to deleted blacklist so they NEVER reappear
    if (id) db.deleted_keys.push(id.toLowerCase());
    if (url) {
      db.deleted_keys.push(url.toLowerCase());
      if (url.includes('?')) {
        db.deleted_keys.push(url.split('?')[0].toLowerCase());
      }
    }

    // Remove from active media library
    db.media = (db.media || []).filter((m) => m.id !== id && (url ? m.url !== url : true));

    // Also purge from projects
    for (const proj of db.projects) {
      if (Array.isArray(proj.media)) {
        proj.media = proj.media.filter(
          (m: any) => m.id !== id && (url ? m.media_url !== url : true)
        );
      }
      if (url && proj.preview_image === url) {
        proj.preview_image = proj.media?.[0]?.media_url || '/assets/gideon_boadi_portrait.png';
      }
      if (url && proj.hero_image === url) {
        proj.hero_image = proj.media?.[0]?.media_url || '/assets/gideon_boadi_portrait.png';
      }
    }

    // Also purge from portfolio shots
    db.portfolio = db.portfolio.filter((s) => s.id !== id && (url ? s.url !== url : true));

    // Also purge from product shots
    db.products = db.products.filter((p) => p.id !== id && (url ? p.url !== url : true));

    saveDatabase(db);
    res.json({ success: true, id, url });
  });

  // 8. Team & User Account Management API
  api.get('/auth/users', (_req: Request, res: Response) => {
    res.json(db.users || []);
  });

  api.post('/auth/users', (req: Request, res: Response) => {
    const { email, password, full_name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = (db.users || []).find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      password: password, // In production, hash with bcrypt
      full_name: full_name?.trim() || 'Studio Member',
      role: role || 'admin',
      created_at: new Date().toISOString(),
    };

    db.users = [...(db.users || []), newUser];
    saveDatabase(db);

    // Return user without exposing raw password in response
    const { password: _, ...userSafe } = newUser;
    res.status(201).json(userSafe);
  });

  api.delete('/auth/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (id === 'admin-appahstephen9' || id === 'demo-admin-id') {
      return res.status(400).json({ error: 'Cannot delete primary owner' });
    }
    db.users = (db.users || []).filter((u) => u.id !== id);
    saveDatabase(db);
    res.json({ success: true, id });
  });

  // Mount API router
  app.use('/api', api);

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Deon Studios CMS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
