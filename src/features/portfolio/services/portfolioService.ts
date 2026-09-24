import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { DbPortfolioShot, ProjectStatus } from '../../../types/database';
import { SingleShot } from '../../../types';
import { PORTFOLIO_SHOTS as STATIC_PORTFOLIO_SHOTS } from '../../../data/portfolioData';
import { isMediaDeleted, markMediaAsDeleted } from '../../../services/indexedDbStorage';

const LOCAL_PORTFOLIO_KEY = 'deon_cms_local_portfolio_shots';
const LOCAL_PORTFOLIO_INITIALIZED = 'deon_cms_portfolio_initialized';

function singleShotToDb(s: SingleShot, idx: number): DbPortfolioShot {
  return {
    id: s.id || `port-${idx + 1}`,
    title: s.title,
    category: s.category || 'Portraiture',
    url: s.url,
    fallback_url: s.fallbackUrl || null,
    aspect_ratio: s.aspectRatio || 'portrait',
    caption: s.caption || '',
    client_or_brand: s.clientOrBrand || 'Studio Archive',
    tag: s.tag || 'Single Shot',
    camera: s.exif?.camera || null,
    lens: s.exif?.lens || null,
    iso: s.exif?.iso || null,
    shutter: s.exif?.shutter || null,
    status: (s.status as ProjectStatus) || 'published',
    featured: s.featured ?? idx < 4,
    display_order: s.display_order ?? idx,
    created_at: s.created_at || new Date(Date.now() - idx * 3600000).toISOString(),
    updated_at: s.updated_at || new Date().toISOString(),
    deleted_at: s.deleted_at || null,
  };
}

export function dbShotToSingleShot(db: DbPortfolioShot): SingleShot {
  return {
    id: db.id,
    title: db.title,
    category: db.category || 'Portraiture',
    url: db.url,
    fallbackUrl: db.fallback_url || undefined,
    aspectRatio: db.aspect_ratio,
    caption: db.caption || '',
    clientOrBrand: db.client_or_brand || undefined,
    tag: db.tag || undefined,
    exif: {
      camera: db.camera || undefined,
      lens: db.lens || undefined,
      iso: db.iso || undefined,
      shutter: db.shutter || undefined,
    },
    status: db.status,
    featured: db.featured,
    display_order: db.display_order,
    created_at: db.created_at,
    updated_at: db.updated_at,
    deleted_at: db.deleted_at,
  };
}

function getLocalShots(): DbPortfolioShot[] {
  try {
    const raw = localStorage.getItem(LOCAL_PORTFOLIO_KEY);
    const initialized = localStorage.getItem(LOCAL_PORTFOLIO_INITIALIZED);

    // If initialized, respect the state even if it's an empty array []
    if (initialized || raw !== null) {
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((s) => !isMediaDeleted(s.id, s.url, s.title));
        }
      }
      return [];
    }
  } catch {
    // fallback
  }

  const initial: DbPortfolioShot[] = STATIC_PORTFOLIO_SHOTS
    .slice(0, 3)
    .map(singleShotToDb)
    .filter((s) => !isMediaDeleted(s.id, s.url, s.title));
  try {
    localStorage.setItem(LOCAL_PORTFOLIO_KEY, JSON.stringify(initial));
    localStorage.setItem(LOCAL_PORTFOLIO_INITIALIZED, 'true');
  } catch {
    // ignore
  }
  return initial;
}

function saveLocalShots(shots: DbPortfolioShot[]) {
  try {
    localStorage.setItem(LOCAL_PORTFOLIO_KEY, JSON.stringify(shots));
    localStorage.setItem(LOCAL_PORTFOLIO_INITIALIZED, 'true');
  } catch {
    // ignore
  }
}

export class PortfolioService {
  /**
   * Fetch portfolio / portrait shots with filtering
   */
  static async getShots(options: {
    status?: ProjectStatus | 'all';
    category?: string;
    search?: string;
    includeDeleted?: boolean;
  } = {}): Promise<DbPortfolioShot[]> {
    if (!isSupabaseConfigured()) {
      let list = getLocalShots();
      if (!options.includeDeleted) {
        list = list.filter((s) => !s.deleted_at);
      }
      if (options.status && options.status !== 'all') {
        list = list.filter((s) => s.status === options.status);
      }
      if (options.category && options.category !== 'All') {
        list = list.filter((s) => s.category?.toLowerCase() === options.category?.toLowerCase());
      }
      if (options.search) {
        const q = options.search.toLowerCase();
        list = list.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.caption?.toLowerCase().includes(q) ||
            s.client_or_brand?.toLowerCase().includes(q) ||
            s.category?.toLowerCase().includes(q)
        );
      }
      return list.sort((a, b) => a.display_order - b.display_order);
    }

    try {
      let query = supabase
        .from('portfolio_shots')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!options.includeDeleted) {
        query = query.is('deleted_at', null);
      }
      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }
      if (options.category && options.category !== 'All') {
        query = query.eq('category', options.category);
      }
      if (options.search) {
        query = query.or(
          `title.ilike.%${options.search}%,caption.ilike.%${options.search}%,client_or_brand.ilike.%${options.search}%`
        );
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return getLocalShots();
      }
      return data as DbPortfolioShot[];
    } catch {
      return getLocalShots();
    }
  }

  /**
   * Fetch published shots for public portfolio section
   */
  static async getPublishedShots(): Promise<SingleShot[]> {
    const list = await this.getShots({ status: 'published' });
    return list.map(dbShotToSingleShot);
  }

  /**
   * Fetch single shot by ID
   */
  static async getShotById(id: string): Promise<DbPortfolioShot | null> {
    const list = getLocalShots();
    const foundLocal = list.find((s) => s.id === id && !s.deleted_at);

    if (!isSupabaseConfigured()) {
      return foundLocal || null;
    }

    try {
      const { data, error } = await supabase
        .from('portfolio_shots')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) {
        return foundLocal || null;
      }
      return data as DbPortfolioShot;
    } catch {
      return foundLocal || null;
    }
  }

  /**
   * Create a new portfolio / portrait shot
   */
  static async createShot(payload: Partial<DbPortfolioShot>): Promise<DbPortfolioShot> {
    const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `port-${Date.now()}`;
    const newShot: DbPortfolioShot = {
      id: newId,
      title: payload.title || 'Untitled Portrait',
      category: payload.category || 'Portraiture',
      url: payload.url || '/assets/gideon_boadi_portrait.png',
      fallback_url: payload.fallback_url || null,
      aspect_ratio: payload.aspect_ratio || 'portrait',
      caption: payload.caption || null,
      client_or_brand: payload.client_or_brand || null,
      tag: payload.tag || 'Single Shot',
      camera: payload.camera || null,
      lens: payload.lens || null,
      iso: payload.iso || null,
      shutter: payload.shutter || null,
      status: payload.status || 'published',
      featured: payload.featured ?? false,
      display_order: payload.display_order ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    // Save to local cache first
    const list = getLocalShots();
    list.unshift(newShot);
    saveLocalShots(list);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('portfolio_shots')
          .insert(newShot)
          .select()
          .single();

        if (!error && data) {
          return data as DbPortfolioShot;
        }
      } catch (err) {
        console.warn('Supabase portfolio shot insert error:', err);
      }
    }

    return newShot;
  }

  /**
   * Update an existing portfolio / portrait shot
   */
  static async updateShot(id: string, updates: Partial<DbPortfolioShot>): Promise<DbPortfolioShot> {
    const list = getLocalShots();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) {
      throw new Error(`Portfolio shot with ID "${id}" not found.`);
    }

    const updated: DbPortfolioShot = {
      ...list[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[idx] = updated;
    saveLocalShots(list);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('portfolio_shots')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase portfolio shot update error:', err);
      }
    }

    return updated;
  }

  /**
   * Delete a shot permanently or soft delete, keeping local cache and Supabase in sync
   */
  static async deleteShot(id: string): Promise<void> {
    const list = getLocalShots();
    const target = list.find((s) => s.id === id);
    if (target) {
      await markMediaAsDeleted([target.id, target.url, target.title]);
    } else {
      await markMediaAsDeleted([id]);
    }

    const filtered = list.filter((s) => s.id !== id);
    saveLocalShots(filtered);

    if (isSupabaseConfigured()) {
      try {
        const { error: hardErr } = await supabase
          .from('portfolio_shots')
          .delete()
          .eq('id', id);

        if (hardErr) {
          await supabase
            .from('portfolio_shots')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        }
      } catch (err) {
        console.warn('Supabase portfolio shot delete error:', err);
      }
    }
  }

  /**
   * Seeds exactly 3 sample portfolio portrait shots into Supabase and local storage
   */
  static async seedShotsToDatabase(): Promise<DbPortfolioShot[]> {
    // Exactly 3 sample shots showing portrait, editorial, and creative lighting structures
    const initial: DbPortfolioShot[] = STATIC_PORTFOLIO_SHOTS.slice(0, 3).map(singleShotToDb);

    if (isSupabaseConfigured()) {
      for (const shot of initial) {
        try {
          const { id, ...dataWithoutId } = shot;
          await supabase.from('portfolio_shots').insert(dataWithoutId);
        } catch (e) {
          console.warn('Seed shot error:', e);
        }
      }
    }

    saveLocalShots(initial);
    return initial;
  }

  /**
   * Duplicate a shot
   */
  static async duplicateShot(id: string): Promise<DbPortfolioShot> {
    const original = await this.getShotById(id);
    if (!original) {
      throw new Error('Original shot not found');
    }

    return this.createShot({
      ...original,
      id: undefined,
      title: `${original.title} (Copy)`,
      status: 'draft',
      display_order: original.display_order + 1,
    });
  }
}
