import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { DbCategory } from '../../../types/database';
import { ApiClient } from '../../../lib/api';

const LOCAL_CATEGORIES_KEY = 'deon_cms_local_categories';
const CATEGORIES_INITIALIZED_KEY = 'deon_cms_categories_initialized';

const DEFAULT_CATEGORIES: DbCategory[] = [
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
];

function getLocalCategories(): DbCategory[] {
  try {
    const initialized = localStorage.getItem(CATEGORIES_INITIALIZED_KEY);
    const raw = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (initialized) {
      return raw ? JSON.parse(raw) : [];
    }
    localStorage.setItem(CATEGORIES_INITIALIZED_KEY, 'true');
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  } catch {
    return [];
  }
}

function saveLocalCategories(cats: DbCategory[]) {
  try {
    localStorage.setItem(CATEGORIES_INITIALIZED_KEY, 'true');
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(cats));
  } catch {
    // ignore
  }
}

export class CategoryService {
  /**
   * Fetch all categories ordered by display_order
   */
  static async getCategories(): Promise<DbCategory[]> {
    if (!isSupabaseConfigured()) {
      try {
        const list = await ApiClient.get<DbCategory[]>('/categories');
        saveLocalCategories(list);
        return list.sort((a, b) => a.display_order - b.display_order);
      } catch {
        return getLocalCategories().sort((a, b) => a.display_order - b.display_order);
      }
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Supabase categories query error, using defaults:', error.message);
      return getLocalCategories();
    }

    return (data as DbCategory[]) || [];
  }

  /**
   * Get single category by ID
   */
  static async getCategoryById(id: string): Promise<DbCategory | null> {
    if (!isSupabaseConfigured()) {
      return getLocalCategories().find((c) => c.id === id) || null;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as DbCategory;
  }

  /**
   * Create new category
   */
  static async createCategory(category: Partial<DbCategory>): Promise<DbCategory> {
    const slug = category.slug || category.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'cat';

    if (!isSupabaseConfigured()) {
      const list = getLocalCategories();
      const newCat: DbCategory = {
        id: `cat-${Date.now()}`,
        name: category.name || 'New Category',
        slug,
        description: category.description || null,
        color: category.color || '#d4d4d4',
        icon: category.icon || 'folder',
        display_order: list.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      list.push(newCat);
      saveLocalCategories(list);
      return newCat;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name!,
        slug,
        description: category.description,
        color: category.color,
        icon: category.icon,
        display_order: category.display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Unable to create category');
    }

    return data as DbCategory;
  }

  /**
   * Update category
   */
  static async updateCategory(id: string, updates: Partial<DbCategory>): Promise<DbCategory> {
    if (!isSupabaseConfigured()) {
      const list = getLocalCategories();
      const idx = list.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Category not found');
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
      saveLocalCategories(list);
      return list[idx];
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Unable to update category');
    }

    return data as DbCategory;
  }

  /**
   * Delete category with check for linked projects
   */
  static async deleteCategory(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      // Check if any projects reference this category
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)
        .is('deleted_at', null);

      if (count && count > 0) {
        throw new Error(`Cannot delete category: ${count} active project(s) are currently assigned to it. Please reassign those projects first.`);
      }

      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) {
        throw new Error(error.message || 'Failed to delete category');
      }
      return true;
    }

    const list = getLocalCategories();
    const filtered = list.filter((c) => c.id !== id);
    saveLocalCategories(filtered);
    return true;
  }

  /**
   * Delete multiple categories in bulk
   */
  static async deleteCategories(ids: string[]): Promise<boolean> {
    try {
      await ApiClient.post('/categories/batch-delete', { ids });
    } catch {
      // offline fallback
    }

    const list = getLocalCategories();
    const idSet = new Set(ids);
    const filtered = list.filter((c) => !idSet.has(c.id));
    saveLocalCategories(filtered);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('categories').delete().in('id', ids);
      } catch (err) {
        console.warn('Supabase bulk delete categories error:', err);
      }
    }
    return true;
  }

  /**
   * Reorder categories by array of IDs
   */
  static async reorderCategories(orderedIds: string[]): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const list = getLocalCategories();
      list.forEach((c) => {
        const orderIdx = orderedIds.indexOf(c.id);
        if (orderIdx !== -1) c.display_order = orderIdx + 1;
      });
      saveLocalCategories(list);
      return true;
    }

    const updates = orderedIds.map((id, index) =>
      supabase
        .from('categories')
        .update({ display_order: index + 1 })
        .eq('id', id)
    );

    await Promise.all(updates);
    return true;
  }

  /**
   * Seed sample categories if explicitly requested
   */
  static async seedSampleCategories(): Promise<DbCategory[]> {
    saveLocalCategories(DEFAULT_CATEGORIES);
    return DEFAULT_CATEGORIES;
  }
}
