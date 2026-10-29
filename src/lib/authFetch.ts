import { supabase } from './supabase';

/** fetch() that attaches the signed-in user's Supabase access token (for /api/admin and staff-only endpoints). */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  return fetch(input, { ...init, headers });
}
