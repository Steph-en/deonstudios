import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { authFetch } from '../../../lib/authFetch';
import { SignInCredentials } from '../types/auth';
import { DbProfile, UserRole } from '../../../types/database';

/**
 * Authentication is handled ONLY by Supabase Auth (hashed passwords, signed JWTs).
 * Authorization is decided by the database: public.profiles.role + row level
 * security (see supabase/migrations/019). Nothing here is trusted by the server;
 * client-side checks only decide what UI to show.
 */

const GENERIC_LOGIN_ERROR = 'Invalid username/email or password.';

async function adminApi<T>(method: 'POST' | 'DELETE', query: string, body?: unknown): Promise<T> {
  const res = await authFetch(`/api/admin/users${query}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status}).`);
  return json as T;
}

export class AuthService {
  /** Sign in with an e-mail address or username. Throws a user-presentable Error. */
  static async signIn({ email: identifier, password }: SignInCredentials) {
    const input = identifier.trim();
    if (!input || !password) throw new Error(GENERIC_LOGIN_ERROR);

    let email = input.toLowerCase();
    if (!input.includes('@')) {
      const { data } = await supabase.rpc('login_email_for', { identifier: input });
      if (!data) throw new Error(GENERIC_LOGIN_ERROR);
      email = data;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      throw new Error(/not confirmed/i.test(error?.message ?? '') ? error!.message : GENERIC_LOGIN_ERROR);
    }

    // Being a Supabase user is not enough: the account must have a staff profile.
    const profile = await this.getProfile(data.session.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('This account does not have access to the admin area.');
    }
    return { session: data.session as Session, profile };
  }

  static async signOut() {
    return supabase.auth.signOut();
  }

  /** The signed-in user's staff profile, or null if they have none. */
  static async getProfile(userId: string): Promise<DbProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) console.warn('Could not load profile:', error.message);
    return (data as DbProfile | null) ?? null;
  }

  /** Admins see every team member; other roles only see themselves (enforced by RLS). */
  static async getTeamMembers(): Promise<DbProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as DbProfile[];
  }

  /** Admin only. Handled server-side with the service role (api/admin/users.ts). */
  static async createTeamMember(payload: {
    email: string;
    username?: string;
    password: string;
    full_name: string;
    role: UserRole;
  }): Promise<{ success: boolean; message: string }> {
    await adminApi('POST', '', payload);
    return {
      success: true,
      message: `Account for ${payload.full_name} (${payload.email.trim().toLowerCase()}) created with role "${payload.role.toUpperCase()}".`,
    };
  }

  /** Admin only. Deletes the Supabase Auth user (profile is removed by cascade). */
  static async removeTeamMember(id: string): Promise<void> {
    await adminApi('DELETE', `?id=${encodeURIComponent(id)}`);
  }

  /** Re-verifies the current password first so a hijacked session can't change it. */
  static async updatePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyError) throw new Error('Current password is incorrect.');

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }
}
