import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ApiClient } from '../lib/api';

export interface HeroSettings {
  mediaType: 'video' | 'image';
  mediaUrl: string;
  mobileMediaUrl?: string;
  fallbackPosterUrl?: string;
  overlayOpacity?: number; // 0 to 1
  scrollText?: string;
}

export interface AboutSettings {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  mediaCredit?: string;
  artistName: string;
  artistTitle: string;
  roleTagline?: string;
  bioParagraphs: string[];
  socialLinks: { name: string; url: string }[];
  bookingUrl: string;
  bookingLabel?: string;
  clients: string[];
}

export const DEFAULT_HERO_SETTINGS: HeroSettings = {
  mediaType: 'video',
  mediaUrl: '/videos/hero-desktop.mp4',
  mobileMediaUrl: '',
  fallbackPosterUrl: '',
  overlayOpacity: 0.2,
  scrollText: 'SCROLL',
};

export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  mediaType: 'image',
  mediaUrl: '/assets/images/gideon_boadi_portrait.png',
  mediaCredit: 'Nana K. Boakye',
  artistName: 'Gideon Boadi',
  artistTitle: 'Photographer · Visual Storyteller · Founder of Deon Studios',
  roleTagline: 'Photographer',
  bioParagraphs: [
    'Gideon Boadi is an image creative, photographer, and visual storyteller based in Accra, Ghana. Working at the intersection of fashion, culture, and contemporary art, he crafts distinctive visual narratives that transform ideas, identities, and emotions into evocative, enduring imagery.',
    'Through his creative practice and studio banner, Deon Studios, Gideon collaborates with brands and cultural institutions across fashion, beauty, lifestyle, and editorial publishing. Every project is approached with disciplined intentionality—from initial conceptualization and narrative architecture to cinematographic lighting, mood, composition, and final execution. His work sits at the confluence of African heritage and global contemporary aesthetics, creating imagery that feels considered, authentic, and unforgettable.',
    'Gideon plays an active, hands-on role throughout the entire creative continuum—directing pre-production, set atmosphere, and cinematographic lighting through to post-production color grading and art direction. Drawing inspiration from architectural form, natural textures, and human vulnerability, he pursues visual resonance by introducing a timeless stillness into dynamic modern settings.',
    'His work has been commissioned and featured by prominent international titles and brands, including Vogue, Vlisco, Dazed, and Guzangs Magazine, among others. Whether developing an expansive commercial campaign, defining a brand’s visual identity, or capturing intimate editorial portraits, Gideon is driven by a singular belief: cultivating genuine emotional connections through unique, relevant, and resonant visual storytelling.',
    'Available worldwide for editorial commissions, runway documentation, commercial campaigns, and creative direction.',
  ],
  socialLinks: [
    { name: 'Instagram', url: 'https://instagram.com/gideon_boadi' },
    { name: 'Vogue', url: 'https://www.vogue.com' },
    { name: 'Models.com', url: 'https://models.com' },
    { name: 'LinkedIn', url: 'https://linkedin.com' },
  ],
  bookingUrl: 'https://deon-studios.easyweek.de/',
  bookingLabel: 'Bookings & General Inquiries',
  clients: [
    'Guzangs Magazine',
    'Daniel Diyepriye Beauty ',
    'Vogue',
    'Vlisco',
    'Dazed',
    'Christie Brown',
    'Maison Saint Kiss',
    'Vexxels',
    'Fine Forever Fragrance',
  ],
};

const LOCAL_STORAGE_PREFIX = 'deon_site_settings_';

export class SiteSettingsService {
  /**
   * Retrieves setting by key with multi-layer fallback:
   * 1. Supabase site_settings table
   * 2. Express backend /api/settings/:key
   * 3. Browser localStorage cache
   * 4. Default constant
   */
  static async getSettings<T>(key: string, defaultValue: T): Promise<T> {
    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('site_settings' as any)
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (!error && data && (data as any).value) {
          const val = (data as any).value as T;
          this.setLocalCache(key, val);
          return val;
        }
      } catch (err) {
        console.warn(`Supabase getSettings error for ${key}:`, err);
      }
    }

    // 2. Try Server API Proxy
    try {
      const serverRes = await ApiClient.get<{ value: T }>(`/settings/${encodeURIComponent(key)}`);
      if (serverRes && serverRes.value) {
        this.setLocalCache(key, serverRes.value);
        return serverRes.value;
      }
    } catch {
      // Ignore API server proxy failures
    }

    // 3. Try LocalStorage
    const local = this.getLocalCache<T>(key);
    if (local !== null) {
      return local;
    }

    return defaultValue;
  }

  /**
   * Updates setting in Supabase, backend API, and local cache
   */
  static async updateSettings<T>(key: string, value: T): Promise<T> {
    this.setLocalCache(key, value);

    // 1. Save to Supabase
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('site_settings' as any)
          .upsert(
            {
              key,
              value: value as any,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );

        if (error) {
          console.warn(`Supabase updateSettings warning for ${key}:`, error.message);
        }
      } catch (err) {
        console.warn(`Supabase updateSettings error for ${key}:`, err);
      }
    }

    // 2. Save to Server API
    try {
      await ApiClient.post(`/settings/${encodeURIComponent(key)}`, { value });
    } catch {
      // Non-fatal
    }

    return value;
  }

  private static getLocalCache<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // Ignore parsing errors
    }
    return null;
  }

  private static setLocalCache<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(value));
    } catch {
      // Ignore storage errors
    }
  }
}
