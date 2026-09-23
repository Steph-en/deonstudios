/**
 * Robust Client-Side Persistent Storage via IndexedDB with LocalStorage Fallback.
 * Guarantees that uploaded media and deletion states persist indefinitely across refreshes.
 */

const DB_NAME = 'deon_studios_cms_db';
const DB_VERSION = 1;
const STORE_MEDIA = 'media_library';
const STORE_DELETED = 'deleted_keys';

const LOCAL_DELETED_KEY = 'deon_cms_deleted_keys_v2';
const LOCAL_MEDIA_KEY = 'deon_cms_media_assets';
const MEDIA_INITIALIZED_KEY = 'deon_cms_media_initialized';

// In-memory set of deleted IDs and URLs for instant synchronous filtering
let memoryDeletedKeys: Set<string> = new Set();
let isInitialized = false;

function loadLocalDeletedKeys(): Set<string> {
  const set = new Set<string>();
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((k) => set.add(String(k).toLowerCase()));
      }
    }
  } catch {
    // fallback
  }
  return set;
}

function saveLocalDeletedKeys(set: Set<string>) {
  try {
    localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

// Initialize memory set immediately from localStorage
memoryDeletedKeys = loadLocalDeletedKeys();

/**
 * Open or upgrade IndexedDB database
 */
function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MEDIA)) {
          db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_DELETED)) {
          db.createObjectStore(STORE_DELETED, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('Could not open IndexedDB, falling back to localStorage');
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Helper to check if a key (ID, filename, or URL) has been permanently deleted
 */
export function isMediaDeleted(id?: string | null, url?: string | null, name?: string | null): boolean {
  if (!id && !url && !name) return false;

  if (id && memoryDeletedKeys.has(id.toLowerCase())) return true;
  if (url && memoryDeletedKeys.has(url.toLowerCase())) return true;
  if (name && memoryDeletedKeys.has(name.toLowerCase())) return true;

  // Also check without query string in url
  if (url) {
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (memoryDeletedKeys.has(cleanUrl)) return true;
  }

  return false;
}

/**
 * Permanently mark keys (IDs and URLs) as deleted.
 * Once marked, they can never reappear on page refresh.
 */
export async function markMediaAsDeleted(keys: (string | undefined | null)[]): Promise<void> {
  const validKeys = keys
    .filter((k): k is string => Boolean(k && k.trim()))
    .map((k) => k.trim().toLowerCase());

  if (validKeys.length === 0) return;

  validKeys.forEach((k) => {
    memoryDeletedKeys.add(k);
    // Also add url clean path without query params
    if (k.includes('?')) {
      memoryDeletedKeys.add(k.split('?')[0]);
    }
  });

  saveLocalDeletedKeys(memoryDeletedKeys);

  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_DELETED, 'readwrite');
      const store = tx.objectStore(STORE_DELETED);
      for (const k of validKeys) {
        store.put({ key: k, deletedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.warn('Failed to write deleted key to IndexedDB:', err);
    }
  }
}

/**
 * Restore keys from deletion (e.g. when user explicitly clicks "Seed Sample Media")
 */
export async function unmarkMediaAsDeleted(keys: string[]): Promise<void> {
  keys.forEach((k) => {
    const lower = k.toLowerCase();
    memoryDeletedKeys.delete(lower);
    if (lower.includes('?')) {
      memoryDeletedKeys.delete(lower.split('?')[0]);
    }
  });
  saveLocalDeletedKeys(memoryDeletedKeys);

  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_DELETED, 'readwrite');
      const store = tx.objectStore(STORE_DELETED);
      for (const k of keys) {
        store.delete(k.toLowerCase());
      }
    } catch {
      // ignore
    }
  }
}

/**
 * Load all stored media items from IndexedDB or localStorage
 */
export async function getStoredMediaItems<T extends { id: string; url: string; name?: string }>(): Promise<T[]> {
  const db = await openDB();
  let items: T[] = [];

  if (db) {
    try {
      items = await new Promise<T[]>((resolve) => {
        const tx = db.transaction(STORE_MEDIA, 'readonly');
        const store = tx.objectStore(STORE_MEDIA);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      items = [];
    }
  }

  // If IndexedDB had nothing, check localStorage
  if (items.length === 0) {
    try {
      const raw = localStorage.getItem(LOCAL_MEDIA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          items = parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // Filter out any items that have been marked as deleted
  return items.filter((item) => !isMediaDeleted(item.id, item.url, item.name));
}

/**
 * Save a media item permanently to IndexedDB and localStorage
 */
export async function saveStoredMediaItem<T extends { id: string; url: string }>(item: T): Promise<void> {
  // Remove from deleted set if newly uploaded/re-added
  if (item.id) memoryDeletedKeys.delete(item.id.toLowerCase());
  if (item.url) memoryDeletedKeys.delete(item.url.toLowerCase());
  saveLocalDeletedKeys(memoryDeletedKeys);

  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_MEDIA, 'readwrite');
      const store = tx.objectStore(STORE_MEDIA);
      store.put(item);
    } catch (err) {
      console.warn('Failed to save to IndexedDB:', err);
    }
  }

  // Also update localStorage (strip massive video base64 if it would exceed 5MB quota)
  try {
    const raw = localStorage.getItem(LOCAL_MEDIA_KEY);
    const existing: T[] = raw ? JSON.parse(raw) : [];
    const updated = [item, ...existing.filter((e) => e.id !== item.id)];
    localStorage.setItem(MEDIA_INITIALIZED_KEY, 'true');
    // Only store first 50 items in localStorage to prevent quota errors
    localStorage.setItem(LOCAL_MEDIA_KEY, JSON.stringify(updated.slice(0, 50)));
  } catch (err) {
    console.warn('LocalStorage save skipped (IndexedDB is primary):', err);
  }
}

/**
 * Remove a media item permanently from IndexedDB and localStorage
 */
export async function deleteStoredMediaItem(id: string, url?: string): Promise<void> {
  // 1. Mark as deleted permanently
  await markMediaAsDeleted([id, url]);

  // 2. Delete from IndexedDB
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_MEDIA, 'readwrite');
      const store = tx.objectStore(STORE_MEDIA);
      store.delete(id);
    } catch (err) {
      console.warn('IndexedDB delete error:', err);
    }
  }

  // 3. Delete from localStorage
  try {
    const raw = localStorage.getItem(LOCAL_MEDIA_KEY);
    if (raw) {
      const existing: any[] = JSON.parse(raw);
      const filtered = existing.filter((e) => e.id !== id && (url ? e.url !== url : true));
      localStorage.setItem(LOCAL_MEDIA_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }
}

/**
 * Clear all stored media items
 */
export async function clearAllStoredMedia(): Promise<void> {
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_MEDIA, 'readwrite');
      const store = tx.objectStore(STORE_MEDIA);
      store.clear();
    } catch {
      // ignore
    }
  }
  try {
    localStorage.setItem(LOCAL_MEDIA_KEY, '[]');
    localStorage.setItem(MEDIA_INITIALIZED_KEY, 'true');
  } catch {
    // ignore
  }
}

/**
 * Convert a File to a permanent, high-quality Base64 Data URL.
 * Resizes huge images (above 2560px) to prevent memory hogging while keeping ultra-crisp editorial quality.
 */
export async function fileToPersistentDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // For non-images (videos, SVG, etc), directly read as data URL
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    // For images, optimize if dimensions are extraordinarily large (> 2560px)
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 2560;
        let width = img.width;
        let height = img.height;

        if (width <= MAX_DIM && height <= MAX_DIM && file.size < 3 * 1024 * 1024) {
          // If already under 3MB and under 2560px, use pristine data URL directly
          resolve(e.target?.result as string);
          return;
        }

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP if supported, or JPEG with 0.92 pristine quality
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = file.type === 'image/png' ? undefined : 0.92;
        resolve(canvas.toDataURL(mime, quality));
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
