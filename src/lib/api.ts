/**
 * Client for the optional local Express dev server (server.ts), which provides a
 * JSON-file database used as an offline fallback when Supabase is unreachable.
 *
 * In production (Vercel) that server does not exist - only the serverless
 * functions in /api (contact, inquiries) do - so every call here would 404.
 * Outside of dev, and unless VITE_API_URL points at a hosted backend, the
 * client therefore fails immediately without touching the network; callers
 * already catch this and fall back to Supabase / local cache.
 */

const REMOTE_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const BASE_URL = REMOTE_BASE ? `${REMOTE_BASE}/api` : import.meta.env.DEV ? '/api' : null;

async function request<T>(method: string, endpoint: string, data?: unknown): Promise<T> {
  if (!BASE_URL) throw new Error('Local API server is not available in production.');

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(data !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (!res.ok) {
    const body = isJson ? await res.json().catch(() => null) : null;
    const detail = body?.error;
    throw new Error(
      (typeof detail === 'string' ? detail : detail?.message) ||
        res.statusText ||
        `HTTP ${res.status}: request failed for ${endpoint}`
    );
  }
  if (!isJson) throw new Error(`Expected JSON from ${endpoint}`);
  return res.json();
}

export const ApiClient = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, data?: unknown) => request<T>('POST', endpoint, data),
  put: <T>(endpoint: string, data: unknown) => request<T>('PUT', endpoint, data),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
};
