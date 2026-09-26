import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { DbProjectMedia } from '../../../types/database';
import { StorageService } from '../../../services/storageService';
import {
  getStoredMediaItems,
  saveStoredMediaItem,
  deleteStoredMediaItem,
  markMediaAsDeleted,
  unmarkMediaAsDeleted,
  isMediaDeleted,
  clearAllStoredMedia,
} from '../../../services/indexedDbStorage';
import { ApiClient } from '../../../lib/api';

export interface LibraryMediaAsset {
  id: string;
  name: string;
  url: string;
  storagePath?: string;
  type: 'image' | 'video';
  size: string;
  date: string;
  projectId?: string | null;
}

const LOCAL_MEDIA_KEY = 'deon_cms_media_assets';
const MEDIA_INITIALIZED_KEY = 'deon_cms_media_initialized';
const LOCAL_PROJECTS_KEY = 'deon_cms_local_projects';
const LOCAL_PORTFOLIO_KEY = 'deon_cms_local_portfolio_shots';
const LOCAL_PRODUCTS_KEY = 'deon_cms_local_product_shots';

const DEFAULT_SAMPLE_MEDIA: LibraryMediaAsset[] = [
  {
    id: 'sample-1',
    name: 'gideon_boadi_portrait.png',
    url: '/assets/gideon_boadi_portrait.png',
    type: 'image',
    size: '1.4 MB',
    date: '2025-09-01',
  },
  {
    id: 'sample-2',
    name: 'helmet_of_heritage_hero.jpg',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop',
    type: 'image',
    size: '2.1 MB',
    date: '2025-08-14',
  },
  {
    id: 'sample-3',
    name: 'vlisco_textile_editorial.jpg',
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1600&auto=format&fit=crop',
    type: 'image',
    size: '1.8 MB',
    date: '2025-07-22',
  },
  {
    id: 'sample-4',
    name: 'beauty_portrait_duveprime.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
    type: 'image',
    size: '2.6 MB',
    date: '2025-07-05',
  },
  {
    id: 'sample-5',
    name: 'dazed_generation_pulse.jpg',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1600&auto=format&fit=crop',
    type: 'image',
    size: '1.9 MB',
    date: '2025-06-18',
  },
  {
    id: 'sample-6',
    name: 'bottega_form_leather.jpg',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
    type: 'image',
    size: '2.2 MB',
    date: '2025-05-30',
  },
];

/**
 * Harvest media assets from active projects, portfolio shots, and product shots
 * to ensure all uploaded/existing visuals in the system appear in the centralized Media Library.
 */
function harvestCmsMedia(): LibraryMediaAsset[] {
  const harvested: LibraryMediaAsset[] = [];
  const seenUrls = new Set<string>();

  try {
    // 1. Harvest from Projects
    const rawProj = localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (rawProj) {
      const projects: any[] = JSON.parse(rawProj);
      if (Array.isArray(projects)) {
        for (const proj of projects) {
          if (proj.deleted_at) continue;

          // Project gallery media
          if (Array.isArray(proj.media)) {
            for (const m of proj.media) {
              if (m.media_url && !seenUrls.has(m.media_url) && !isMediaDeleted(m.id, m.media_url, m.file_name)) {
                seenUrls.add(m.media_url);
                harvested.push({
                  id: m.id || `proj-m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  name: m.file_name || `${proj.title} Gallery Asset`,
                  url: m.media_url,
                  storagePath: m.storage_path || m.media_url,
                  type: m.media_type === 'video' ? 'video' : 'image',
                  size: m.file_size ? `${(m.file_size / (1024 * 1024)).toFixed(2)} MB` : '1.8 MB',
                  date: m.created_at ? m.created_at.split('T')[0] : '2025-09-01',
                  projectId: proj.id,
                });
              }
            }
          }

          // Project hero/preview images
          if (proj.preview_image && !seenUrls.has(proj.preview_image) && !isMediaDeleted(null, proj.preview_image)) {
            seenUrls.add(proj.preview_image);
            harvested.push({
              id: `proj-prev-${proj.id}`,
              name: `${proj.slug || proj.title}-cover.jpg`,
              url: proj.preview_image,
              storagePath: proj.preview_image,
              type: 'image',
              size: '2.4 MB',
              date: proj.created_at ? proj.created_at.split('T')[0] : '2025-09-01',
              projectId: proj.id,
            });
          }
        }
      }
    }

    // 2. Harvest from Portfolio Shots
    const rawPort = localStorage.getItem(LOCAL_PORTFOLIO_KEY);
    if (rawPort) {
      const shots: any[] = JSON.parse(rawPort);
      if (Array.isArray(shots)) {
        for (const s of shots) {
          if (s.deleted_at || !s.url) continue;
          if (!seenUrls.has(s.url) && !isMediaDeleted(s.id, s.url, s.title)) {
            seenUrls.add(s.url);
            harvested.push({
              id: s.id || `port-${Date.now()}`,
              name: `${s.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
              url: s.url,
              storagePath: s.url,
              type: 'image',
              size: '2.1 MB',
              date: s.created_at ? s.created_at.split('T')[0] : '2025-08-20',
            });
          }
        }
      }
    }

    // 3. Harvest from Product Shots
    const rawProd = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (rawProd) {
      const prods: any[] = JSON.parse(rawProd);
      if (Array.isArray(prods)) {
        for (const p of prods) {
          if (p.deleted_at || !p.url) continue;
          if (!seenUrls.has(p.url) && !isMediaDeleted(p.id, p.url, p.title)) {
            seenUrls.add(p.url);
            harvested.push({
              id: p.id || `prod-${Date.now()}`,
              name: `${p.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`,
              url: p.url,
              storagePath: p.url,
              type: 'image',
              size: '1.9 MB',
              date: p.created_at ? p.created_at.split('T')[0] : '2025-08-10',
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error harvesting CMS media:', err);
  }

  return harvested;
}

export class MediaService {
  /**
   * Fetch all media items in the centralized media library.
   * Merges persistent uploaded storage items, active CMS assets, and default samples.
   * Strictly filters out ANY item marked as deleted so deleted images never reappear.
   */
  static async getAllLibraryAssets(): Promise<LibraryMediaAsset[]> {
    const assetsMap = new Map<string, LibraryMediaAsset>();

    // 1. Load authoritative active media from centralized server API
    try {
      const serverMedia = await ApiClient.get<LibraryMediaAsset[]>('/media');
      for (const sm of serverMedia) {
        if (!isMediaDeleted(sm.id, sm.url, sm.name)) {
          assetsMap.set(sm.url, sm);
        }
      }
    } catch (err) {
      // offline fallback
    }

    // 2. Load stored items from persistent IndexedDB / localStorage
    const storedItems = await getStoredMediaItems<LibraryMediaAsset>();
    for (const item of storedItems) {
      if (!isMediaDeleted(item.id, item.url, item.name)) {
        assetsMap.set(item.url, item);
      }
    }

    // 3. If Supabase is configured, pull from project_media table
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('project_media')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          for (const item of data) {
            if (!isMediaDeleted(item.id, item.media_url, item.file_name)) {
              assetsMap.set(item.media_url, {
                id: item.id,
                name: item.file_name || `asset-${item.id.slice(0, 8)}`,
                url: item.media_url,
                storagePath: item.storage_path,
                type: (item.media_type === 'video' ? 'video' : 'image') as 'image' | 'video',
                size: item.file_size
                  ? `${(item.file_size / (1024 * 1024)).toFixed(2)} MB`
                  : '1.5 MB',
                date: item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                projectId: item.project_id,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Could not query project_media table:', err);
      }
    }

    // 4. Harvest media from CMS projects, portfolio, and products (strictly filtering deleted)
    const cmsAssets = harvestCmsMedia();
    for (const ca of cmsAssets) {
      if (!assetsMap.has(ca.url) && !isMediaDeleted(ca.id, ca.url, ca.name)) {
        assetsMap.set(ca.url, ca);
      }
    }

    // Mark initialized so placeholders are NEVER resurrected
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MEDIA_INITIALIZED_KEY, 'true');
      } catch {
        // ignore
      }
    }

    // Convert map to array and sort by date descending
    const result = Array.from(assetsMap.values());
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }

  /**
   * Add a new media asset to the library.
   * Saves to persistent storage (IndexedDB + localStorage) and server/Supabase.
   */
  static async addLibraryAsset(asset: {
    name: string;
    url: string;
    storagePath?: string;
    type: 'image' | 'video';
    size: string;
    projectId?: string | null;
  }): Promise<LibraryMediaAsset> {
    const newAsset: LibraryMediaAsset = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: asset.name,
      url: asset.url,
      storagePath: asset.storagePath || asset.url,
      type: asset.type,
      size: asset.size,
      date: new Date().toISOString().split('T')[0],
      projectId: asset.projectId || null,
    };

    // Save to centralized server database
    try {
      await ApiClient.post<LibraryMediaAsset>('/media', newAsset);
    } catch {
      // offline
    }

    // Save permanently in IndexedDB and localStorage
    await saveStoredMediaItem(newAsset);

    // If attached to a project, sync to that project's local media array
    if (asset.projectId) {
      try {
        const rawProj = localStorage.getItem(LOCAL_PROJECTS_KEY);
        if (rawProj) {
          const projects: any[] = JSON.parse(rawProj);
          const pIdx = projects.findIndex((p) => p.id === asset.projectId);
          if (pIdx !== -1) {
            const currentMedia = projects[pIdx].media || [];
            projects[pIdx].media = [
              ...currentMedia,
              {
                id: newAsset.id,
                project_id: asset.projectId,
                media_type: newAsset.type,
                storage_path: newAsset.storagePath,
                media_url: newAsset.url,
                thumbnail_path: newAsset.storagePath,
                thumbnail_url: newAsset.url,
                file_name: newAsset.name,
                file_size: null,
                mime_type: newAsset.type === 'video' ? 'video/mp4' : 'image/jpeg',
                width: 1200,
                height: 1600,
                alt_text: newAsset.name,
                display_order: currentMedia.length + 1,
                created_at: new Date().toISOString(),
              },
            ];
            localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
          }
        }
      } catch (err) {
        console.warn('Failed to sync added media to project:', err);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('project_media')
          .insert({
            project_id: asset.projectId || '00000000-0000-0000-0000-000000000000',
            media_type: asset.type,
            storage_path: asset.storagePath || asset.url,
            media_url: asset.url,
            file_name: asset.name,
            mime_type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
            display_order: 0,
          })
          .select()
          .maybeSingle();

        if (!error && data) {
          newAsset.id = data.id;
        }
      } catch (err) {
        console.warn('Failed to insert project_media record in Supabase:', err);
      }
    }

    return newAsset;
  }

  /**
   * Delete media asset permanently from database, storage, and local cache.
   * Adds the ID and URL to the persistent deletion blacklist so it NEVER reappears on refresh.
   * Also purges the asset from any projects, portfolio shots, or product shots that reference it.
   */
  static async deleteLibraryAsset(id: string, storagePath?: string, url?: string): Promise<boolean> {
    // 0. Delete permanently from centralized server database
    try {
      const q = url ? `?url=${encodeURIComponent(url)}` : '';
      await ApiClient.delete(`/media/${encodeURIComponent(id)}${q}`);
    } catch {
      // offline fallback
    }

    // 1. Mark permanently deleted in both IndexedDB and LocalStorage
    await markMediaAsDeleted([id, storagePath, url]);

    // 2. Remove from persistent stored items
    await deleteStoredMediaItem(id, url);

    // 3. Remove physical file from Supabase Storage if path exists
    if (storagePath) {
      try {
        await StorageService.deleteMedia(storagePath);
      } catch (err) {
        console.warn('Storage deletion failed or file not in bucket:', err);
      }
    }

    // 4. Delete database record in Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('project_media').delete().eq('id', id);
        if (url) {
          await supabase.from('project_media').delete().eq('media_url', url);
        }
        if (storagePath) {
          await supabase.from('project_media').delete().eq('storage_path', storagePath);
        }
      } catch (err) {
        console.warn('Database deletion from project_media failed:', err);
      }
    }

    // 5. Purge from local projects (gallery media, preview images, hero images)
    try {
      const rawProj = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (rawProj) {
        const projects: any[] = JSON.parse(rawProj);
        let updated = false;
        for (const p of projects) {
          if (Array.isArray(p.media)) {
            const initialLen = p.media.length;
            p.media = p.media.filter(
              (m: any) => m.id !== id && (url ? m.media_url !== url : true) && (storagePath ? m.storage_path !== storagePath : true)
            );
            if (p.media.length !== initialLen) updated = true;
          }
          if (url && p.preview_image === url) {
            p.preview_image = p.media?.[0]?.media_url || '/assets/gideon_boadi_portrait.png';
            updated = true;
          }
          if (url && p.hero_image === url) {
            p.hero_image = p.media?.[0]?.media_url || '/assets/gideon_boadi_portrait.png';
            updated = true;
          }
        }
        if (updated) {
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
        }
      }
    } catch (err) {
      console.warn('Error purging deleted media from projects:', err);
    }

    // 6. Purge from local portfolio shots
    try {
      const rawPort = localStorage.getItem(LOCAL_PORTFOLIO_KEY);
      if (rawPort) {
        const shots: any[] = JSON.parse(rawPort);
        const filtered = shots.filter((s: any) => s.id !== id && (url ? s.url !== url : true));
        if (filtered.length !== shots.length) {
          localStorage.setItem(LOCAL_PORTFOLIO_KEY, JSON.stringify(filtered));
        }
      }
    } catch (err) {
      console.warn('Error purging deleted media from portfolio shots:', err);
    }

    // 7. Purge from local product shots
    try {
      const rawProd = localStorage.getItem(LOCAL_PRODUCTS_KEY);
      if (rawProd) {
        const prods: any[] = JSON.parse(rawProd);
        const filtered = prods.filter((p: any) => p.id !== id && (url ? p.url !== url : true));
        if (filtered.length !== prods.length) {
          localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(filtered));
        }
      }
    } catch (err) {
      console.warn('Error purging deleted media from product shots:', err);
    }

    return true;
  }

  /**
   * Bulk delete multiple media library assets
   */
  static async deleteMultipleLibraryAssets(
    assets: { id: string; storagePath?: string; url?: string }[]
  ): Promise<boolean> {
    try {
      await ApiClient.post('/media/batch-delete', { assets });
    } catch {
      // offline fallback
    }

    for (const asset of assets) {
      await this.deleteLibraryAsset(asset.id, asset.storagePath, asset.url);
    }
    return true;
  }

  /**
   * Re-seed sample media assets if explicitly triggered by the user in the UI.
   * Clears deletion marks for the sample assets so they can be restored.
   */
  static async seedSampleAssets(): Promise<LibraryMediaAsset[]> {
    const sampleKeys = DEFAULT_SAMPLE_MEDIA.flatMap((s) => [s.id, s.url, s.name]);
    await unmarkMediaAsDeleted(sampleKeys);

    for (const item of DEFAULT_SAMPLE_MEDIA) {
      await saveStoredMediaItem(item);
    }

    return DEFAULT_SAMPLE_MEDIA;
  }

  /**
   * Clear all media assets
   */
  static async clearAllMedia(): Promise<void> {
    await clearAllStoredMedia();
    const current = await this.getAllLibraryAssets();
    await markMediaAsDeleted(current.flatMap((c) => [c.id, c.url, c.name]));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('project_media').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Failed to clear project_media in Supabase:', err);
      }
    }
  }

  // -------------------------------------------------------------
  // Project-Specific Gallery Methods
  // -------------------------------------------------------------

  static async getMediaForProject(projectId: string): Promise<DbProjectMedia[]> {
    if (!isSupabaseConfigured()) {
      try {
        const rawProj = localStorage.getItem(LOCAL_PROJECTS_KEY);
        if (rawProj) {
          const projects: any[] = JSON.parse(rawProj);
          const p = projects.find((proj) => proj.id === projectId);
          if (p && Array.isArray(p.media)) {
            return p.media.filter((m: any) => !isMediaDeleted(m.id, m.media_url, m.file_name));
          }
        }
      } catch (err) {
        console.warn('Error reading local project media:', err);
      }
      return [];
    }

    const { data, error } = await supabase
      .from('project_media')
      .select('*')
      .eq('project_id', projectId)
      .order('display_order', { ascending: true });

    if (error) {
      console.warn('Failed to fetch project media from Supabase:', error.message);
      return [];
    }

    return ((data as DbProjectMedia[]) || []).filter((m) => !isMediaDeleted(m.id, m.media_url, m.file_name));
  }

  static async addMedia(item: {
    project_id: string;
    media_type: 'image' | 'video';
    storage_path: string;
    media_url: string;
    file_name?: string | null;
    file_size?: number | null;
    mime_type?: string | null;
    width?: number | null;
    height?: number | null;
    alt_text?: string | null;
    display_order?: number;
  }): Promise<DbProjectMedia> {
    const newMedia: DbProjectMedia = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      project_id: item.project_id,
      media_type: item.media_type,
      storage_path: item.storage_path,
      media_url: item.media_url,
      thumbnail_path: item.storage_path,
      thumbnail_url: item.media_url,
      file_name: item.file_name ?? null,
      file_size: item.file_size ?? null,
      mime_type: item.mime_type ?? (item.media_type === 'video' ? 'video/mp4' : 'image/jpeg'),
      width: item.width ?? 1200,
      height: item.height ?? 1600,
      alt_text: item.alt_text ?? null,
      display_order: item.display_order ?? 0,
      created_at: new Date().toISOString(),
    };

    // Save into project's local media array in deon_cms_local_projects
    try {
      const rawProj = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (rawProj) {
        const projects: any[] = JSON.parse(rawProj);
        const pIdx = projects.findIndex((p) => p.id === item.project_id);
        if (pIdx !== -1) {
          const list = projects[pIdx].media || [];
          projects[pIdx].media = [...list, newMedia];
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
        }
      }
    } catch (err) {
      console.warn('Error saving media to local project:', err);
    }

    // Also register into central media library so it is universally accessible
    await saveStoredMediaItem({
      id: newMedia.id,
      name: newMedia.file_name || `gallery-asset-${newMedia.id.slice(0, 8)}`,
      url: newMedia.media_url,
      storagePath: newMedia.storage_path,
      type: newMedia.media_type,
      size: newMedia.file_size ? `${(newMedia.file_size / (1024 * 1024)).toFixed(2)} MB` : '1.5 MB',
      date: new Date().toISOString().split('T')[0],
      projectId: item.project_id,
    });

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('project_media')
          .insert({
            project_id: item.project_id,
            media_type: item.media_type,
            storage_path: item.storage_path,
            media_url: item.media_url,
            thumbnail_path: item.storage_path,
            thumbnail_url: item.media_url,
            file_name: item.file_name,
            file_size: item.file_size,
            mime_type: item.mime_type,
            width: item.width,
            height: item.height,
            alt_text: item.alt_text,
            display_order: item.display_order ?? 0,
          })
          .select()
          .single();

        if (!error && data) {
          return data as DbProjectMedia;
        }
      } catch (err) {
        console.warn('Supabase insert failed for project media:', err);
      }
    }

    return newMedia;
  }

  static async updateMedia(id: string, updates: Partial<DbProjectMedia>): Promise<DbProjectMedia> {
    // Update in local projects
    try {
      const rawProj = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (rawProj) {
        const projects: any[] = JSON.parse(rawProj);
        let updated = false;
        for (const p of projects) {
          if (Array.isArray(p.media)) {
            const idx = p.media.findIndex((m: any) => m.id === id);
            if (idx !== -1) {
              p.media[idx] = { ...p.media[idx], ...updates };
              updated = true;
              break;
            }
          }
        }
        if (updated) {
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
        }
      }
    } catch (err) {
      console.warn('Error updating local project media:', err);
    }

    if (!isSupabaseConfigured()) {
      return { id, ...updates } as DbProjectMedia;
    }

    const { data, error } = await supabase
      .from('project_media')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('Failed to update media in Supabase:', error.message);
      return { id, ...updates } as DbProjectMedia;
    }

    return data as DbProjectMedia;
  }

  static async deleteMedia(id: string, storagePath?: string, url?: string): Promise<boolean> {
    // Mark as permanently deleted so it never resurrects
    await markMediaAsDeleted([id, storagePath, url]);

    // Delete from central media store
    await deleteStoredMediaItem(id, url);

    // Delete from local projects
    try {
      const rawProj = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (rawProj) {
        const projects: any[] = JSON.parse(rawProj);
        let updated = false;
        for (const p of projects) {
          if (Array.isArray(p.media)) {
            const initialLen = p.media.length;
            p.media = p.media.filter(
              (m: any) => m.id !== id && (storagePath ? m.storage_path !== storagePath : true) && (url ? m.media_url !== url : true)
            );
            if (p.media.length !== initialLen) updated = true;
          }
        }
        if (updated) {
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
        }
      }
    } catch (err) {
      console.warn('Error deleting media from local project:', err);
    }

    if (storagePath) {
      try {
        await StorageService.deleteMedia(storagePath);
      } catch (err) {
        console.warn('Storage delete error:', err);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('project_media').delete().eq('id', id);
        if (url) {
          await supabase.from('project_media').delete().eq('media_url', url);
        }
      } catch (err) {
        console.warn('Supabase delete media error:', err);
      }
    }

    return true;
  }

  static async reorderMedia(orderedItems: { id: string; display_order: number }[]): Promise<boolean> {
    try {
      const rawProj = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (rawProj) {
        const projects: any[] = JSON.parse(rawProj);
        const orderMap = new Map(orderedItems.map((o) => [o.id, o.display_order]));
        for (const p of projects) {
          if (Array.isArray(p.media)) {
            for (const m of p.media) {
              if (orderMap.has(m.id)) {
                m.display_order = orderMap.get(m.id)!;
              }
            }
            p.media.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
          }
        }
        localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
      }
    } catch (err) {
      console.warn('Error reordering media in local projects:', err);
    }

    if (!isSupabaseConfigured()) return true;

    try {
      const updates = orderedItems.map((item) =>
        supabase
          .from('project_media')
          .update({ display_order: item.display_order })
          .eq('id', item.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.warn('Supabase reorder failed:', err);
    }

    return true;
  }
}
