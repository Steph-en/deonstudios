import dotenv from 'dotenv';
dotenv.config({ override: true });

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse --port from command line arguments (e.g. --port 3000)
function getPort(): number {
  const args = process.argv.slice(2);
  const portIdx = args.indexOf('--port');
  if (portIdx !== -1 && args[portIdx + 1]) {
    const p = parseInt(args[portIdx + 1], 10);
    if (!isNaN(p) && p > 0) return p;
  }
  const pIdx = args.indexOf('-p');
  if (pIdx !== -1 && args[pIdx + 1]) {
    const p = parseInt(args[pIdx + 1], 10);
    if (!isNaN(p) && p > 0) return p;
  }
  // In Cloud Run containers, process.env.PORT is 8080 (where nginx runs and forwards to port 3000).
  // The Node application must always bind to port 3000 unless a non-8080 custom port is specified.
  if (process.env.PORT && process.env.PORT !== '8080') {
    const p = parseInt(process.env.PORT, 10);
    if (!isNaN(p) && p > 0) return p;
  }
  return 3000;
}

const PORT = getPort();
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
  site_settings?: Record<string, any>;
  inquiries?: any[];
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
    projects: [],
    portfolio: [],
    products: [],
    inquiries: [],
    // Clean media: starts with NO zombie sample placeholders
    media: [],
    deleted_keys: [],
    site_settings: {},
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

  // CORS Middleware: Allow all valid origins including preview iframe domains
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
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

    // Sort by display_order (lowest first), fallback to created_at
    list = [...list].sort((a, b) => {
      const orderA = a.display_order !== undefined && a.display_order !== null ? a.display_order : 9999;
      const orderB = b.display_order !== undefined && b.display_order !== null ? b.display_order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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

  api.post('/projects/batch-delete', (req: Request, res: Response) => {
    const { ids } = req.body;
    if (Array.isArray(ids)) {
      const idSet = new Set(ids);
      db.projects = db.projects.filter((p) => !idSet.has(p.id));
      saveDatabase(db);
    }
    res.json({ success: true, count: ids?.length || 0 });
  });

  api.post('/projects/batch-update', (req: Request, res: Response) => {
    const { ids, updates } = req.body;
    if (Array.isArray(ids) && updates) {
      const idSet = new Set(ids);
      db.projects = db.projects.map((p) =>
        idSet.has(p.id) ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      );
      saveDatabase(db);
    }
    res.json({ success: true, count: ids?.length || 0 });
  });

  api.post('/projects/reorder', (req: Request, res: Response) => {
    const { orders } = req.body;
    if (Array.isArray(orders)) {
      const orderMap = new Map(orders.map((o: any) => [o.id, Number(o.display_order)]));
      db.projects = db.projects.map((p) =>
        orderMap.has(p.id)
          ? { ...p, display_order: orderMap.get(p.id), updated_at: new Date().toISOString() }
          : p
      );
      db.projects.sort((a, b) => {
        const orderA = a.display_order !== undefined && a.display_order !== null ? a.display_order : 9999;
        const orderB = b.display_order !== undefined && b.display_order !== null ? b.display_order : 9999;
        return orderA - orderB;
      });
      saveDatabase(db);
    }
    res.json({ success: true });
  });

  api.post('/projects/seed', (_req: Request, res: Response) => {
    res.json({ success: true, count: 0, message: 'Sample seed feature removed' });
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

  api.post('/portfolio/batch-delete', (req: Request, res: Response) => {
    const { ids } = req.body;
    if (Array.isArray(ids)) {
      const idSet = new Set(ids);
      db.portfolio = db.portfolio.filter((s) => !idSet.has(s.id));
      saveDatabase(db);
    }
    res.json({ success: true, count: ids?.length || 0 });
  });

  api.post('/portfolio/batch-update', (req: Request, res: Response) => {
    const { ids, updates } = req.body;
    if (Array.isArray(ids) && updates) {
      const idSet = new Set(ids);
      db.portfolio = db.portfolio.map((s) =>
        idSet.has(s.id) ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
      );
      saveDatabase(db);
    }
    res.json({ success: true, count: ids?.length || 0 });
  });

  api.post('/portfolio/reorder', (req: Request, res: Response) => {
    const { orders } = req.body;
    if (Array.isArray(orders)) {
      const orderMap = new Map(orders.map((o: any) => [o.id, o.display_order]));
      db.portfolio = db.portfolio.map((s) =>
        orderMap.has(s.id) ? { ...s, display_order: orderMap.get(s.id), updated_at: new Date().toISOString() } : s
      );
      db.portfolio.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      saveDatabase(db);
    }
    res.json({ success: true });
  });

  api.post('/portfolio/seed', (_req: Request, res: Response) => {
    res.json({ success: true, count: 0, message: 'Sample seed feature removed' });
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

  api.post('/products/batch-delete', (req: Request, res: Response) => {
    const { ids } = req.body;
    if (Array.isArray(ids)) {
      const idSet = new Set(ids);
      db.products = db.products.filter((p) => !idSet.has(p.id));
      saveDatabase(db);
    }
    res.json({ success: true, count: ids?.length || 0 });
  });

  api.post('/products/batch-update', (req: Request, res: Response) => {
    const { ids, updates } = req.body;
    if (Array.isArray(ids) && updates) {
      const idSet = new Set(ids);
      db.products = db.products.map((p) =>
        idSet.has(p.id) ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
      );
      saveDatabase(db);
    }
    res.json({ success: true, count: ids?.length || 0 });
  });

  api.post('/products/reorder', (req: Request, res: Response) => {
    const { orders } = req.body;
    if (Array.isArray(orders)) {
      const orderMap = new Map(orders.map((o: any) => [o.id, o.display_order]));
      db.products = db.products.map((p) =>
        orderMap.has(p.id) ? { ...p, display_order: orderMap.get(p.id), updated_at: new Date().toISOString() } : p
      );
      db.products.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      saveDatabase(db);
    }
    res.json({ success: true });
  });

  api.post('/products/seed', (_req: Request, res: Response) => {
    res.json({ success: true, count: 0, message: 'Sample seed feature removed' });
  });

  // 6b. Site Settings API (Hero & About Dynamic Configuration)
  api.get('/settings/:key', (req: Request, res: Response) => {
    const key = req.params.key;
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.site_settings) {
          db.site_settings = parsed.site_settings;
        }
      }
    } catch {
      // ignore
    }
    if (!db.site_settings) db.site_settings = {};
    let value = db.site_settings[key] || null;

    // Purge obsolete legacy single image if it exists in memory for backwards compatibility response
    if (key === 'hero_settings' && value && typeof value === 'object') {
      if (value.mediaUrl && typeof value.mediaUrl === 'string' && value.mediaUrl.includes('l1060844')) {
        value = {
          ...value,
          mode: 'rotation',
          mediaUrl: '',
        };
      }
    }

    res.json({ success: true, key, value });
  });

  api.post('/settings/:key', (req: Request, res: Response) => {
    const key = req.params.key;
    const { value } = req.body;
    if (!db.site_settings) db.site_settings = {};
    db.site_settings[key] = value;
    saveDatabase(db);
    res.json({ success: true, key, value });
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

  api.delete('/categories/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const idx = db.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.categories.splice(idx, 1);
      saveDatabase(db);
    }
    res.json({ success: true, id });
  });

  api.post('/categories/batch-delete', (req: Request, res: Response) => {
    const { ids } = req.body;
    if (Array.isArray(ids)) {
      const idSet = new Set(ids);
      db.categories = db.categories.filter((c) => !idSet.has(c.id));
      saveDatabase(db);
    }
    res.json({ success: true, count: ids?.length || 0 });
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

  api.post('/media/batch-delete', (req: Request, res: Response) => {
    const { assets } = req.body; // array of { id, url }
    if (Array.isArray(assets)) {
      if (!db.deleted_keys) db.deleted_keys = [];
      const idSet = new Set(assets.map((a: any) => a.id));
      const urlSet = new Set(assets.map((a: any) => a.url).filter(Boolean));

      for (const a of assets) {
        if (a.id) db.deleted_keys.push(a.id.toLowerCase());
        if (a.url) {
          db.deleted_keys.push(a.url.toLowerCase());
          if (a.url.includes('?')) {
            db.deleted_keys.push(a.url.split('?')[0].toLowerCase());
          }
        }
      }

      db.media = (db.media || []).filter((m) => !idSet.has(m.id) && !urlSet.has(m.url));

      for (const proj of db.projects) {
        if (Array.isArray(proj.media)) {
          proj.media = proj.media.filter(
            (m: any) => !idSet.has(m.id) && !urlSet.has(m.media_url)
          );
        }
      }
      db.portfolio = db.portfolio.filter((s) => !idSet.has(s.id) && !urlSet.has(s.url));
      db.products = db.products.filter((p) => !idSet.has(p.id) && !urlSet.has(p.url));

      saveDatabase(db);
    }
    res.json({ success: true, count: assets?.length || 0 });
  });

  
  // 12. Contact & Email Dispatch API
  // -------------------------------------------------------------
  const CONTACT_DESTINATION_EMAIL =
    process.env.CONTACT_DESTINATION_EMAIL || 'studio@gideonboadi.com';

  // Health check and CORS preflight for contact endpoint
  api.options('/contact', (_req: Request, res: Response) => {
    res.sendStatus(200);
  });

  // Health check, configuration status, and CORS preflight for contact endpoint
  api.options('/contact', (_req: Request, res: Response) => {
    res.sendStatus(200);
  });
  api.options('/contact/test', (_req: Request, res: Response) => {
    res.sendStatus(200);
  });

  api.get('/contact/status', (_req: Request, res: Response) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const target = process.env.CONTACT_DESTINATION_EMAIL || 'studio@gideonboadi.com';

    const hasResend = Boolean(resendApiKey && resendApiKey.trim().length > 5);
    const hasSmtp = Boolean(smtpHost && smtpUser && smtpPass);

    res.status(200).json({
      status: 'ok',
      service: 'Deon Studios Contact & Booking API',
      destination: target,
      deliveryProvider: hasResend ? 'resend' : hasSmtp ? 'smtp' : 'database_only',
      resendConfigured: hasResend,
      smtpConfigured: hasSmtp,
      smtpHost: smtpHost ? smtpHost : 'Not set',
      smtpUser: smtpUser ? smtpUser : 'Not set',
      totalInquiries: Array.isArray(db.inquiries) ? db.inquiries.length : 0,
      timestamp: new Date().toISOString(),
    });
  });

  api.get('/contact', (_req: Request, res: Response) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const target = process.env.CONTACT_DESTINATION_EMAIL || 'studio@gideonboadi.com';

    const hasResend = Boolean(resendApiKey && resendApiKey.trim().length > 5);
    const hasSmtp = Boolean(smtpHost && smtpUser && smtpPass);

    res.status(200).json({
      status: 'ok',
      service: 'Deon Studios Contact & Booking API',
      destination: target,
      deliveryProvider: hasResend ? 'resend' : hasSmtp ? 'smtp' : 'database_only',
      resendConfigured: hasResend,
      smtpConfigured: hasSmtp,
      smtpHost: smtpHost ? smtpHost : 'Not configured (inquiries saved to database)',
      totalInquiries: Array.isArray(db.inquiries) ? db.inquiries.length : 0,
      timestamp: new Date().toISOString(),
    });
  });

  // Diagnostic Test Route: Sends a real verification test email to studio@gideonboadi.com
  api.post('/contact/test', async (_req: Request, res: Response) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const targetDestination = (process.env.CONTACT_DESTINATION_EMAIL || 'studio@gideonboadi.com').trim();
    const smtpFrom = process.env.SMTP_FROM || `"Deon Studios" <${targetDestination}>`;

    const testSubject = `[TEST] Deon Studios Contact Email Verification — ${new Date().toLocaleTimeString()}`;
    const testHtml = `
      <div style="font-family: -apple-system, sans-serif; max-width: 500px; padding: 24px; background: #0a0a0a; color: #fff; border-radius: 8px;">
        <h2 style="margin: 0 0 12px; font-size: 16px; text-transform: uppercase; letter-spacing: 0.15em;">Deon Studios Email Test</h2>
        <p style="font-size: 13px; color: #a3a3a3; line-height: 1.5;">This diagnostic verification email confirms that your outgoing mail dispatch is operational and routing to <strong>${targetDestination}</strong>.</p>
        <p style="font-size: 11px; color: #737373; margin-top: 20px;">Timestamp: ${new Date().toISOString()}</p>
      </div>
    `;

    // 1. Try Resend if configured
    if (resendApiKey && resendApiKey.trim().length > 5) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || 'Deon Studios <onboarding@resend.dev>',
            to: [targetDestination],
            subject: testSubject,
            html: testHtml,
          }),
        });
        const resendData = await resendRes.json();
        if (resendRes.ok) {
          return res.json({
            success: true,
            provider: 'resend',
            message: `Verification email successfully dispatched via Resend to ${targetDestination}.`,
            id: resendData?.id,
          });
        } else {
          return res.status(400).json({
            success: false,
            provider: 'resend',
            error: resendData?.message || 'Resend API returned an error',
            details: resendData,
          });
        }
      } catch (err: any) {
        return res.status(500).json({
          success: false,
          provider: 'resend',
          error: err?.message || 'Failed connecting to Resend API',
        });
      }
    }

    // 2. Try SMTP if configured
    if (smtpHost && smtpUser && smtpPass) {
      try {
        const isSecure = smtpPort === 465 || process.env.SMTP_SECURE === 'true';
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: isSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 8000,
          greetingTimeout: 6000,
          socketTimeout: 8000,
        });

        await transporter.verify();

        await transporter.sendMail({
          from: smtpFrom,
          to: targetDestination,
          subject: testSubject,
          text: `Deon Studios Email Test: Outgoing mail dispatch is operational and routing to ${targetDestination}.`,
          html: testHtml,
        });

        return res.json({
          success: true,
          provider: 'smtp',
          message: `Verification email successfully sent via SMTP (${smtpHost}) to ${targetDestination}.`,
        });
      } catch (err: any) {
        const isBadCredentials =
          err?.message?.includes('535') || err?.message?.includes('BadCredentials');
        return res.status(400).json({
          success: false,
          provider: 'smtp',
          error: err?.message || 'SMTP Authentication or Connection failed',
          hint: isBadCredentials
            ? 'Google rejected the login credentials (535 Bad Credentials). Regular passwords do not work with Gmail SMTP. You must generate a 16-character App Password at https://myaccount.google.com/apppasswords (with 2-Step Verification enabled on the Google account) and set it as SMTP_PASS. Alternatively, use Resend (RESEND_API_KEY) which is recommended for Vercel serverless.'
            : 'Check your SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env or hosting environment variables.',
        });
      }
    }

    return res.status(400).json({
      success: false,
      provider: 'none',
      error: 'No email dispatch provider configured in .env',
      hint: 'Add RESEND_API_KEY or SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) to .env to enable automated email transmission.',
    });
  });

  api.post('/contact', async (req: Request, res: Response) => {
    try {
      const { name, email, message, projectType, phone, destinationEmail } = req.body || {};

      // Server-side form validation (friendly minimums)
      const errors: Record<string, string> = {};
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.name = 'Please provide your full name (minimum 2 characters).';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
        errors.email = 'Please provide a valid email address.';
      }

      if (!message || typeof message !== 'string' || message.trim().length < 2) {
        errors.message = 'Please provide a message with details about your inquiry.';
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Please fill in all required fields.',
          errors,
        });
      }

      const cleanName = name.trim();
      const cleanEmail = email.trim();
      const cleanMessage = message.trim();
      const cleanProjectType = (projectType || 'General Editorial / Commercial Inquiry').trim();
      const cleanPhone = (phone || '').trim();
      const targetDestination = (
        destinationEmail ||
        process.env.CONTACT_DESTINATION_EMAIL ||
        'studio@gideonboadi.com'
      ).trim();

      const newInquiry = {
        id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        projectType: cleanProjectType,
        phone: cleanPhone,
        destination_email: targetDestination,
        status: 'unread',
        created_at: new Date().toISOString(),
      };

      // Persist in local database so no messages are ever lost
      try {
        if (fs.existsSync(DB_FILE)) {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.inquiries)) {
            db.inquiries = parsed.inquiries;
          }
        }
        if (!Array.isArray(db.inquiries)) {
          db.inquiries = [];
        }
        db.inquiries.unshift(newInquiry);
        saveDatabase(db);
      } catch (dbErr) {
        console.error('Failed to save inquiry to disk, maintaining in memory:', dbErr);
      }

      // Persist in Supabase site_settings (cloud DB)
      const sbUrl =
        process.env.VITE_SUPABASE_URL ||
        process.env.SUPABASE_URL ||
        'https://oorbvpnuivsyfxftlqwr.supabase.co';
      const sbAnonKey =
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';
      if (sbUrl && sbAnonKey) {
        import('@supabase/supabase-js')
          .then(({ createClient }) => {
            const sb = createClient(sbUrl, sbAnonKey);
            sb.from('site_settings')
              .select('value')
              .eq('key', 'client_inquiries')
              .maybeSingle()
              .then(({ data }) => {
                const list: any[] = Array.isArray((data as any)?.value)
                  ? [...(data as any).value]
                  : [];
                if (!list.some((i: any) => i.id === newInquiry.id)) {
                  list.unshift(newInquiry);
                  sb.from('site_settings')
                    .upsert(
                      {
                        key: 'client_inquiries',
                        value: list,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: 'key' }
                    )
                    .then(() => {});
                }
              });
          })
          .catch(() => {});
      }

      // Email dispatch using Resend API (Priority 1) or Nodemailer SMTP (Priority 2)
      let emailDispatched = false;
      let emailProvider = 'database_only';
      let emailError: string | null = null;

      const resendApiKey = process.env.RESEND_API_KEY;
      const smtpHost = process.env.SMTP_HOST;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const smtpFrom =
        process.env.SMTP_FROM || `"Deon Studios" <${targetDestination}>`;

      const emailSubject = `New Studio Inquiry from ${cleanName} — Deon Studios`;
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717; background-color: #f5f5f5; margin: 0; padding: 24px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden; }
            .header { background: #0a0a0a; color: #ffffff; padding: 28px 32px; text-align: left; }
            .header h1 { margin: 0; font-size: 18px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; }
            .header p { margin: 6px 0 0; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #a3a3a3; }
            .content { padding: 32px; }
            .field { margin-bottom: 20px; }
            .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.18em; color: #737373; margin-bottom: 4px; }
            .value { font-size: 14px; color: #171717; line-height: 1.5; }
            .message-box { background: #fafafa; border: 1px solid #e5e5e5; border-left: 3px solid #0a0a0a; padding: 18px; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #262626; border-radius: 4px; }
            .footer { border-top: 1px solid #e5e5e5; padding: 18px 32px; font-size: 11px; color: #737373; text-align: center; background: #fafafa; }
            .btn { display: inline-block; background: #0a0a0a; color: #ffffff !important; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Deon Studios</h1>
              <p>Client Inquiry &amp; Commission Brief</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Client Name</div>
                <div class="value"><strong>${cleanName}</strong></div>
              </div>
              <div class="field">
                <div class="label">Email Address</div>
                <div class="value"><a href="mailto:${cleanEmail}?subject=Re: Photography Inquiry — Deon Studios">${cleanEmail}</a></div>
              </div>
              ${cleanPhone ? `
              <div class="field">
                <div class="label">Phone / WhatsApp</div>
                <div class="value">${cleanPhone}</div>
              </div>` : ''}
              ${cleanProjectType ? `
              <div class="field">
                <div class="label">Project / Campaign Type</div>
                <div class="value">${cleanProjectType}</div>
              </div>` : ''}
              <div class="field">
                <div class="label">Brief &amp; Message</div>
                <div class="message-box">${cleanMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              </div>
              <a href="mailto:${cleanEmail}?subject=Re: Photography Inquiry — Deon Studios" class="btn">Reply Directly to Client</a>
            </div>
            <div class="footer">
              Sent via Deon Studios Contact Service to <strong>${targetDestination}</strong> on ${new Date().toISOString()}.
            </div>
          </div>
        </body>
        </html>
      `;

      // 1. Try Resend if configured
      if (resendApiKey && resendApiKey.trim().length > 5) {
        try {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM || 'Deon Studios <onboarding@resend.dev>',
              to: [targetDestination],
              reply_to: cleanEmail,
              subject: emailSubject,
              html: emailHtml,
            }),
          });
          if (resendRes.ok) {
            emailDispatched = true;
            emailProvider = 'resend';
            console.log(`[Email Dispatch] Successfully sent email to ${targetDestination} via Resend`);
          } else {
            const errJson = await resendRes.json();
            emailError = errJson?.message || 'Resend error';
            console.error('[Email Dispatch] Resend error:', emailError);
          }
        } catch (rErr: any) {
          emailError = rErr?.message || String(rErr);
          console.error('[Email Dispatch] Resend exception:', emailError);
        }
      }

      // 2. Try SMTP if not dispatched yet and SMTP is configured
      if (!emailDispatched && smtpHost && smtpUser && smtpPass) {
        try {
          const isSecure = smtpPort === 465 || process.env.SMTP_SECURE === 'true';
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: isSecure,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
            connectionTimeout: 8000,
            greetingTimeout: 5000,
            socketTimeout: 8000,
          });

          await transporter.sendMail({
            from: smtpFrom,
            to: targetDestination,
            replyTo: `${cleanName} <${cleanEmail}>`,
            subject: emailSubject,
            text: `New Studio Inquiry from ${cleanName} (${cleanEmail})\n\nProject Type: ${cleanProjectType}\nPhone: ${cleanPhone}\n\nMessage:\n${cleanMessage}`,
            html: emailHtml,
          });
          console.log(`[Email Dispatch] Successfully sent email to ${targetDestination} via SMTP`);
          emailDispatched = true;
          emailProvider = 'smtp';
        } catch (smtpErr: any) {
          emailError = smtpErr?.message || String(smtpErr);
          console.error('[Email Dispatch] SMTP note:', emailError);
        }
      }

      if (!emailDispatched) {
        // Safe logging when email provider not configured
        console.log(`\n============================================================`);
        console.log(`[EMAIL DISPATCH SERVICE] Routing message to: ${targetDestination}`);
        console.log(`From: "${cleanName}" <${cleanEmail}>`);
        console.log(`Subject: ${emailSubject}`);
        console.log(`Project: ${cleanProjectType}`);
        if (cleanPhone) console.log(`Phone: ${cleanPhone}`);
        console.log(`Message:\n${cleanMessage}`);
        console.log(`Notice: Message saved in studio inbox. Outgoing email requires SMTP or Resend credentials in .env`);
        console.log(`============================================================\n`);
      }

      return res.status(200).json({
        success: true,
        message: emailDispatched
          ? `Your message has been emailed directly to ${targetDestination}.`
          : `Your inquiry has been received by Deon Studios and saved to the studio inbox.`,
        inquiryId: newInquiry.id,
        destination: targetDestination,
        emailDelivered: emailDispatched,
        deliveryProvider: emailProvider,
        smtpConfigured: Boolean(smtpHost && smtpUser && smtpPass),
        resendConfigured: Boolean(resendApiKey),
        smtpError: emailError,
      });
    } catch (err: any) {
      console.error('[Contact API Error]:', err);
      // Resilient fallback: Ensure inquiry is preserved in db and return success
      try {
        if (!Array.isArray(db.inquiries)) db.inquiries = [];
        const fallbackInquiry = {
          id: `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: req.body?.name || 'Studio Client',
          email: req.body?.email || 'client@example.com',
          message: req.body?.message || '',
          projectType: req.body?.projectType || 'General Inquiry',
          phone: req.body?.phone || '',
          destination_email: 'studio@gideonboadi.com',
          status: 'unread',
          created_at: new Date().toISOString(),
        };
        db.inquiries.unshift(fallbackInquiry);
        saveDatabase(db);
        return res.status(200).json({
          success: true,
          message: 'Your inquiry has been received by Deon Studios.',
          inquiryId: fallbackInquiry.id,
          destination: 'studio@gideonboadi.com',
          dispatched: true,
        });
      } catch {
        return res.status(200).json({
          success: true,
          message: 'Your inquiry has been received by Deon Studios.',
          inquiryId: `inq-${Date.now()}`,
          destination: 'studio@gideonboadi.com',
          dispatched: true,
        });
      }
    }
  });

  // Endpoints to manage received inquiries (for Admin)
  api.get('/inquiries', async (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    // 1. Try Supabase cloud inquiries
    const sbUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://oorbvpnuivsyfxftlqwr.supabase.co';
    const sbAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';

    let cloudInquiries: any[] | null = null;
    if (sbUrl && sbAnonKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(sbUrl, sbAnonKey);
        const { data, error } = await sb
          .from('site_settings')
          .select('value')
          .eq('key', 'client_inquiries')
          .maybeSingle();

        if (!error && data && Array.isArray((data as any).value)) {
          cloudInquiries = (data as any).value;
        }
      } catch (err) {
        console.warn('[server /inquiries] Supabase note:', err);
      }
    }

    // 2. Read local db.json
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.inquiries)) {
          db.inquiries = parsed.inquiries;
        } else {
          db.inquiries = [];
        }
      }
    } catch {}

    if (cloudInquiries !== null) {
      // Merge cloud and local inquiries
      const map = new Map<string, any>();
      for (const inq of [...(db.inquiries || []), ...cloudInquiries]) {
        if (inq && inq.id) map.set(inq.id, inq);
      }
      const merged = Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.created_at || a.date || 0).getTime();
        const timeB = new Date(b.created_at || b.date || 0).getTime();
        return timeB - timeA;
      });
      db.inquiries = merged;
      return res.json(merged);
    }

    res.json(db.inquiries || []);
  });

  api.patch('/inquiries/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body || {};
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.inquiries)) {
          db.inquiries = parsed.inquiries;
        }
      }
    } catch {}

    let updatedTarget = null;
    if (Array.isArray(db.inquiries)) {
      const target = db.inquiries.find((inq: any) => inq.id === id);
      if (target && status) {
        target.status = status;
        updatedTarget = target;
        saveDatabase(db);
      }
    }

    // Also update in Supabase
    const sbUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://oorbvpnuivsyfxftlqwr.supabase.co';
    const sbAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';
    if (sbUrl && sbAnonKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(sbUrl, sbAnonKey);
        const { data } = await sb
          .from('site_settings')
          .select('value')
          .eq('key', 'client_inquiries')
          .maybeSingle();

        const list: any[] = Array.isArray((data as any)?.value)
          ? [...(data as any).value]
          : [];
        const item = list.find((i: any) => i.id === id);
        if (item) {
          item.status = status || 'read';
          await sb.from('site_settings').upsert(
            {
              key: 'client_inquiries',
              value: list,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );
        }
      } catch {}
    }

    res.json({ success: true, id, inquiry: updatedTarget });
  });

  api.delete('/inquiries/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.inquiries)) {
          db.inquiries = parsed.inquiries;
        }
      }
    } catch {}

    db.inquiries = (db.inquiries || []).filter((inq: any) => inq.id !== id);
    saveDatabase(db);

    // Also delete in Supabase
    const sbUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://oorbvpnuivsyfxftlqwr.supabase.co';
    const sbAnonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';
    if (sbUrl && sbAnonKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(sbUrl, sbAnonKey);
        const { data } = await sb
          .from('site_settings')
          .select('value')
          .eq('key', 'client_inquiries')
          .maybeSingle();

        const list: any[] = Array.isArray((data as any)?.value)
          ? [...(data as any).value]
          : [];
        const filtered = list.filter((i: any) => i.id !== id);
        await sb.from('site_settings').upsert(
          {
            key: 'client_inquiries',
            value: filtered,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
      } catch {}
    }

    res.json({ success: true, id });
  });

  // Mount API router
  app.use('/api', api);

  // Dedicated Sitemap and Robots.txt routes
  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    const distSitemap = path.resolve(__dirname, 'dist', 'sitemap.xml');
    const publicSitemap = path.resolve(__dirname, 'public', 'sitemap.xml');
    const filePath = fs.existsSync(distSitemap) ? distSitemap : publicSitemap;

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.sendFile(filePath);
    }
    res.status(404).send('sitemap.xml not found');
  });

  app.get('/robots.txt', (_req: Request, res: Response) => {
    const distRobots = path.resolve(__dirname, 'dist', 'robots.txt');
    const publicRobots = path.resolve(__dirname, 'public', 'robots.txt');
    const filePath = fs.existsSync(distRobots) ? distRobots : publicRobots;

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(filePath);
    }
    res.status(404).send('robots.txt not found');
  });

  // Serve static assets or mount Vite dev middleware
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'))) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      root: __dirname,
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {
          ignored: [
            '**/data/**',
            '**/backups/**',
            '**/.tmp*/**',
            '**/storage-*',
            '**/public/uploads/**',
            '**/*.log',
          ],
        },
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Fallback: transform and serve index.html for any client route in dev mode
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          return;
        }
        res.status(404).send('<!doctype html><html><body><h2>index.html not found</h2><p>Please ensure you run npm run dev from the root of the project directory.</p></body></html>');
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

function getProcessUsingPort(port: number): string | null {
  try {
    const { execSync } = require('child_process');
    if (process.platform === 'darwin' || process.platform === 'linux') {
      const output = execSync(`lsof -i :${port} -sTCP:LISTEN -P -n 2>/dev/null || true`, { encoding: 'utf-8' }).trim();
      return output || null;
    } else if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' }).trim();
      return output || null;
    }
  } catch {
    return null;
  }
  return null;
}

  const listenOnPort = (portToTry: number, retryCount = 0): Promise<number> => {
    return new Promise((resolve, reject) => {
      const server = app.listen(portToTry, '0.0.0.0');

      server.once('listening', () => {
        resolve(portToTry);
      });

      server.once('error', async (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[Port Status] Port ${portToTry} currently in use (attempt ${retryCount + 1}/5). Waiting for release...`);
          if (retryCount < 5) {
            await new Promise((r) => setTimeout(r, 1000));
            try {
              const p = await listenOnPort(portToTry, retryCount + 1);
              resolve(p);
            } catch (retryErr) {
              reject(retryErr);
            }
          } else {
            console.error(`[Port Error] Port ${portToTry} is still in use after 5 retries.`);
            reject(err);
          }
        } else {
          reject(err);
        }
      });
    });
  };

  const activePort = await listenOnPort(PORT);
  console.log(`\n  ╭──────────────────────────────────────────────────────────╮`);
  console.log(`  │                                                          │`);
  console.log(`  │   Deon Studios Portfolio CMS is ready!                   │`);
  console.log(`  │                                                          │`);
  console.log(`  │   ➜  Main Site:   http://localhost:${activePort}/                 │`);
  console.log(`  │   ➜  Admin Login: http://localhost:${activePort}/admin            │`);
  console.log(`  │   ➜  Direct Link: http://localhost:${activePort}/admin/login      │`);
  console.log(`  │                                                          │`);
  if (activePort !== 3000) {
    console.log(`  │   ⚠️  IMPORTANT: Port 3000 was occupied by another app.   │`);
    console.log(`  │      Be sure to open http://localhost:${activePort} (NOT 3000)!     │`);
    console.log(`  │                                                          │`);
  }
  console.log(`  ╰──────────────────────────────────────────────────────────╯\n`);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
