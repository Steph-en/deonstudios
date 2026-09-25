import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

export const PRIMARY_SITE_URL = 'https://www.gideonboadi.com';

export const ALLOWED_AUTH_ORIGINS: readonly string[] = [
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

const DEFAULT_SUPABASE_URL = 'https://oorbvpnuivsyfxftlqwr.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';

export const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;

export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

/**
 * Returns dynamic redirect URL for authentication flows (magic links, password reset, sign up)
 * Prioritizes the current valid origin (e.g. https://www.gideonboadi.com, localhost, or preview environment)
 */
export function getAuthRedirectUrl(path: string = '/admin'): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    const curOrigin = window.location.origin;
    const isKnownDomain =
      ALLOWED_AUTH_ORIGINS.includes(curOrigin) ||
      curOrigin.endsWith('.run.app') ||
      curOrigin.endsWith('.vercel.app') ||
      curOrigin.includes('gideonboadi.com') ||
      curOrigin.startsWith('http://localhost:') ||
      curOrigin.startsWith('http://127.0.0.1:');

    if (isKnownDomain) {
      return `${curOrigin}${cleanPath}`;
    }
  }
  return `${PRIMARY_SITE_URL}${cleanPath}`;
}

// Fallback dummy URL to allow client initialization without crashing
const safeUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co';
const safeKey = isSupabaseConfigured() ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient<Database>(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
