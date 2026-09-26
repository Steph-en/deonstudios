import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { DbProductShot, ProjectStatus } from '../../../types/database';
import { SingleShot } from '../../../types';
import { PRODUCT_SHOTS as STATIC_PRODUCT_SHOTS } from '../../../data/portfolioData';
import { isMediaDeleted, markMediaAsDeleted } from '../../../services/indexedDbStorage';
import { ApiClient } from '../../../lib/api';

const LOCAL_PRODUCTS_KEY = 'deon_cms_local_product_shots';
const LOCAL_PRODUCTS_INITIALIZED = 'deon_cms_product_shots_initialized';

function singleProductToDb(s: SingleShot, idx: number): DbProductShot {
  return {
    id: s.id || `prod-${idx + 1}`,
    title: s.title,
    category: s.category || 'Still Life',
    url: s.url,
    fallback_url: s.fallbackUrl || null,
    aspect_ratio: s.aspectRatio || 'portrait',
    caption: s.caption || '',
    client_or_brand: s.clientOrBrand || 'Brand Partner',
    tag: s.tag || 'Product Shot',
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

export function dbProductToSingleShot(db: DbProductShot): SingleShot {
  return {
    id: db.id,
    title: db.title,
    category: db.category || 'Still Life',
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

function getLocalProducts(): DbProductShot[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    const initialized = localStorage.getItem(LOCAL_PRODUCTS_INITIALIZED);

    // If initialized, respect state even if empty array []
    if (initialized || raw !== null) {
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => !isMediaDeleted(p.id, p.url, p.title));
        }
      }
      return [];
    }
  } catch {
    // fallback
  }

  const initial: DbProductShot[] = STATIC_PRODUCT_SHOTS
    .slice(0, 3)
    .map(singleProductToDb)
    .filter((p) => !isMediaDeleted(p.id, p.url, p.title));
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(initial));
    localStorage.setItem(LOCAL_PRODUCTS_INITIALIZED, 'true');
  } catch {
    // ignore
  }
  return initial;
}

function saveLocalProducts(products: DbProductShot[]) {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(LOCAL_PRODUCTS_INITIALIZED, 'true');
  } catch {
    // ignore
  }
}

export class ProductService {
  /**
   * Fetch product shots with filtering
   */
  static async getProducts(options: {
    status?: ProjectStatus | 'all';
    category?: string;
    search?: string;
    includeDeleted?: boolean;
  } = {}): Promise<DbProductShot[]> {
    if (!isSupabaseConfigured()) {
      let list: DbProductShot[] = [];
      try {
        list = await ApiClient.get<DbProductShot[]>('/products');
        saveLocalProducts(list);
      } catch {
        list = getLocalProducts();
      }

      if (!options.includeDeleted) {
        list = list.filter((p) => !p.deleted_at);
      }
      if (options.status && options.status !== 'all') {
        list = list.filter((p) => p.status === options.status);
      }
      if (options.category && options.category !== 'All') {
        list = list.filter((p) => p.category?.toLowerCase() === options.category?.toLowerCase());
      }
      if (options.search) {
        const q = options.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.caption?.toLowerCase().includes(q) ||
            p.client_or_brand?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        );
      }
      return list.sort((a, b) => a.display_order - b.display_order);
    }

    try {
      let query = supabase
        .from('product_shots')
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
        return getLocalProducts();
      }
      return data as DbProductShot[];
    } catch {
      return getLocalProducts();
    }
  }

  /**
   * Fetch published products for public section
   */
  static async getPublishedProducts(): Promise<SingleShot[]> {
    const list = await this.getProducts({ status: 'published' });
    return list.map(dbProductToSingleShot);
  }

  /**
   * Fetch single product by ID
   */
  static async getProductById(id: string): Promise<DbProductShot | null> {
    if (!isSupabaseConfigured()) {
      try {
        return await ApiClient.get<DbProductShot>(`/products/${id}`);
      } catch {
        const list = getLocalProducts();
        return list.find((p) => p.id === id && !p.deleted_at) || null;
      }
    }

    try {
      const { data, error } = await supabase
        .from('product_shots')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !data) {
        const list = getLocalProducts();
        return list.find((p) => p.id === id && !p.deleted_at) || null;
      }
      return data as DbProductShot;
    } catch {
      const list = getLocalProducts();
      return list.find((p) => p.id === id && !p.deleted_at) || null;
    }
  }

  /**
   * Create a new product shot
   */
  static async createProduct(payload: Partial<DbProductShot>): Promise<DbProductShot> {
    const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `prod-${Date.now()}`;
    const newProduct: DbProductShot = {
      id: newId,
      title: payload.title || 'Untitled Product',
      category: payload.category || 'Still Life',
      url: payload.url || '/assets/gideon_boadi_portrait.png',
      fallback_url: payload.fallback_url || null,
      aspect_ratio: payload.aspect_ratio || 'portrait',
      caption: payload.caption || null,
      client_or_brand: payload.client_or_brand || null,
      tag: payload.tag || 'Product Shot',
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

    if (!isSupabaseConfigured()) {
      try {
        const created = await ApiClient.post<DbProductShot>('/products', newProduct);
        const list = getLocalProducts();
        list.unshift(created);
        saveLocalProducts(list);
        return created;
      } catch {
        const list = getLocalProducts();
        list.unshift(newProduct);
        saveLocalProducts(list);
        return newProduct;
      }
    }

    // Save to local cache first
    const list = getLocalProducts();
    list.unshift(newProduct);
    saveLocalProducts(list);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('product_shots')
          .insert(newProduct)
          .select()
          .single();

        if (!error && data) {
          return data as DbProductShot;
        }
      } catch (err) {
        console.warn('Supabase product shot insert error:', err);
      }
    }

    return newProduct;
  }

  /**
   * Update an existing product shot
   */
  static async updateProduct(id: string, updates: Partial<DbProductShot>): Promise<DbProductShot> {
    if (!isSupabaseConfigured()) {
      try {
        const updated = await ApiClient.put<DbProductShot>(`/products/${id}`, updates);
        const list = getLocalProducts();
        const idx = list.findIndex((p) => p.id === id);
        if (idx !== -1) {
          list[idx] = updated;
          saveLocalProducts(list);
        }
        return updated;
      } catch {
        const list = getLocalProducts();
        const idx = list.findIndex((p) => p.id === id);
        if (idx === -1) {
          throw new Error(`Product shot with ID "${id}" not found.`);
        }
        const updated: DbProductShot = {
          ...list[idx],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        list[idx] = updated;
        saveLocalProducts(list);
        return updated;
      }
    }

    const list = getLocalProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Product shot with ID "${id}" not found.`);
    }

    const updated: DbProductShot = {
      ...list[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    list[idx] = updated;
    saveLocalProducts(list);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('product_shots')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase product shot update error:', err);
      }
    }

    return updated;
  }

  /**
   * Delete a product shot permanently or soft delete, keeping local cache and Supabase in sync
   */
  static async deleteProduct(id: string): Promise<void> {
    try {
      await ApiClient.delete(`/products/${id}`);
    } catch {
      // offline
    }

    const list = getLocalProducts();
    const target = list.find((p) => p.id === id);
    if (target) {
      await markMediaAsDeleted([target.id, target.url, target.title]);
    } else {
      await markMediaAsDeleted([id]);
    }

    const filtered = list.filter((p) => p.id !== id);
    saveLocalProducts(filtered);

    if (isSupabaseConfigured()) {
      try {
        const { error: hardErr } = await supabase
          .from('product_shots')
          .delete()
          .eq('id', id);

        if (hardErr) {
          await supabase
            .from('product_shots')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);
        }
      } catch (err) {
        console.warn('Supabase product shot delete error:', err);
      }
    }
  }

  /**
   * Delete multiple products in bulk
   */
  static async deleteProducts(ids: string[]): Promise<void> {
    try {
      await ApiClient.post('/products/batch-delete', { ids });
    } catch {
      // offline fallback
    }

    const list = getLocalProducts();
    const idSet = new Set(ids);
    const keysToPurge: string[] = [];

    for (const id of ids) {
      const target = list.find((p) => p.id === id);
      if (target) {
        keysToPurge.push(target.id, target.url, target.title);
      } else {
        keysToPurge.push(id);
      }
    }

    await markMediaAsDeleted(keysToPurge);
    const filtered = list.filter((p) => !idSet.has(p.id));
    saveLocalProducts(filtered);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('product_shots').delete().in('id', ids);
      } catch (err) {
        console.warn('Supabase bulk delete products error:', err);
      }
    }
  }

  /**
   * Batch update products status
   */
  static async updateProductsStatus(ids: string[], status: ProjectStatus): Promise<void> {
    try {
      await ApiClient.post('/products/batch-update', { ids, updates: { status } });
    } catch {
      // fallback
    }

    const list = getLocalProducts();
    const idSet = new Set(ids);
    for (const p of list) {
      if (idSet.has(p.id)) {
        p.status = status;
        p.updated_at = new Date().toISOString();
      }
    }
    saveLocalProducts(list);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('product_shots')
          .update({ status, updated_at: new Date().toISOString() })
          .in('id', ids);
      } catch (err) {
        console.warn('Supabase bulk status update warning:', err);
      }
    }
  }

  /**
   * Batch update products featured flag
   */
  static async updateProductsFeatured(ids: string[], featured: boolean): Promise<void> {
    try {
      await ApiClient.post('/products/batch-update', { ids, updates: { featured } });
    } catch {
      // fallback
    }

    const list = getLocalProducts();
    const idSet = new Set(ids);
    for (const p of list) {
      if (idSet.has(p.id)) {
        p.featured = featured;
        p.updated_at = new Date().toISOString();
      }
    }
    saveLocalProducts(list);

    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('product_shots')
          .update({ featured, updated_at: new Date().toISOString() })
          .in('id', ids);
      } catch (err) {
        console.warn('Supabase bulk featured update warning:', err);
      }
    }
  }

  /**
   * Seeds exactly 3 sample product still life shots into Supabase and local storage
   */
  static async seedProductsToDatabase(): Promise<DbProductShot[]> {
    if (!isSupabaseConfigured()) {
      try {
        const res = await ApiClient.post<{ products: DbProductShot[] }>('/products/seed');
        if (res?.products) {
          saveLocalProducts(res.products);
          return res.products;
        }
      } catch {
        // fallback
      }
    }

    // Exactly 3 sample shots showing cosmetics, skincare, and set design structures
    const initial: DbProductShot[] = STATIC_PRODUCT_SHOTS.slice(0, 3).map(singleProductToDb);

    if (isSupabaseConfigured()) {
      for (const shot of initial) {
        try {
          const { id, ...dataWithoutId } = shot;
          await supabase.from('product_shots').insert(dataWithoutId);
        } catch (e) {
          console.warn('Seed product error:', e);
        }
      }
    }

    saveLocalProducts(initial);
    return initial;
  }

  /**
   * Duplicate a product shot
   */
  static async duplicateProduct(id: string): Promise<DbProductShot> {
    const original = await this.getProductById(id);
    if (!original) {
      throw new Error('Original product not found');
    }

    return this.createProduct({
      ...original,
      id: undefined,
      title: `${original.title} (Copy)`,
      status: 'draft',
      display_order: original.display_order + 1,
    });
  }
}
