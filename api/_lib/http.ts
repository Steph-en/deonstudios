import type { IncomingMessage, ServerResponse } from 'http';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Files starting with "_" inside /api are shared helpers, not routes.

export type ApiRequest = IncomingMessage & { body?: unknown };
export type ApiResponse = ServerResponse;

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://oorbvpnuivsyfxftlqwr.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_qbhaFoU1TzHZzWqUKeOCig_rylAdzFV';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

/** Anonymous client: subject to RLS exactly like a visitor's browser. */
export const anonClient = (): SupabaseClient => createClient(SUPABASE_URL, SUPABASE_ANON_KEY, noSession);

/** Service-role client: bypasses RLS. Server-side only; never expose this key to the browser. */
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new HttpError(500, 'Server is not configured: SUPABASE_SERVICE_ROLE_KEY is missing.');
  return createClient(SUPABASE_URL, key, noSession);
}

export type StaffRole = 'admin' | 'manager' | 'editor';

/**
 * Verifies the caller's Supabase JWT and loads their role from public.profiles
 * (through RLS, using their own token). Throws 401/403 otherwise.
 */
export async function requireStaff(
  req: ApiRequest,
  opts: { admin?: boolean } = {}
): Promise<{ userId: string; role: StaffRole }> {
  const header = String(req.headers.authorization ?? '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Sign in required.');

  const { data, error } = await anonClient().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Invalid or expired session.');

  const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: profile } = await asUser.from('profiles').select('role').eq('id', data.user.id).maybeSingle();

  const role = profile?.role as StaffRole | undefined;
  if (!role || !['admin', 'manager', 'editor'].includes(role)) {
    throw new HttpError(403, 'This account does not have access.');
  }
  if (opts.admin && role !== 'admin') throw new HttpError(403, 'Administrator access required.');
  return { userId: data.user.id, role };
}

export function sendJson(res: ApiResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export async function readJson<T = Record<string, unknown>>(req: ApiRequest): Promise<T> {
  if (req.body && typeof req.body === 'object') return req.body as T;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T;
    } catch {
      throw new HttpError(400, 'Invalid JSON body.');
    }
  }
  const raw = await new Promise<string>((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 100_000) reject(new HttpError(413, 'Request body too large.'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
  try {
    return (raw ? JSON.parse(raw) : {}) as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON body.');
  }
}

/** Wraps a handler: turns thrown HttpErrors into JSON responses and hides internal errors. */
export function route(handler: (req: ApiRequest, res: ApiResponse) => Promise<void>) {
  return async (req: ApiRequest, res: ApiResponse) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message });
      console.error('[api] unexpected error:', err);
      sendJson(res, 500, { error: 'Something went wrong.' });
    }
  };
}
