import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { SignInCredentials } from '../types/auth';
import { DbProfile } from '../../../types/database';

export class AuthService {
  /**
   * Log in admin with email & password via Supabase Auth
   */
  static async signIn({ email, password }: SignInCredentials) {
    if (!isSupabaseConfigured()) {
      // Development mode / demo admin login fallback
      const savedPassword = localStorage.getItem('demo_admin_password') || 'admin123';
      if (email === 'admin@deonstudios.com' && password === savedPassword) {
        const mockUser = {
          id: 'demo-admin-id',
          email: 'admin@deonstudios.com',
          user_metadata: { full_name: 'Gideon Boadi (Demo Admin)', role: 'admin' },
        };
        localStorage.setItem('demo_admin_session', 'true');
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      }
      throw new Error('Invalid email or password. Please verify your credentials and try again.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Failed to sign in. Please verify your credentials.');
    }

    return { data, error: null };
  }

  /**
   * Update current user's password
   */
  static async updatePassword(newPassword: string) {
    if (!isSupabaseConfigured()) {
      localStorage.setItem('demo_admin_password', newPassword);
      return { error: null };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message || 'Failed to update password.');
    }

    return { data, error: null };
  }

  /**
   * Log out session
   */
  static async signOut() {
    localStorage.removeItem('demo_admin_session');
    if (!isSupabaseConfigured()) {
      return { error: null };
    }
    return supabase.auth.signOut();
  }

  /**
   * Fetch current session
   */
  static async getSession() {
    if (!isSupabaseConfigured()) {
      const isDemo = localStorage.getItem('demo_admin_session') === 'true';
      if (isDemo) {
        const mockUser = {
          id: 'demo-admin-id',
          email: 'admin@deonstudios.com',
          user_metadata: { full_name: 'Gideon Boadi (Demo Admin)', role: 'admin' },
        };
        return { session: { user: mockUser } as any };
      }
      return { session: null };
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { session: null };
    }
    return { session: data.session };
  }

  /**
   * Fetch user profile from public.profiles
   */
  static async getProfile(userId: string): Promise<DbProfile | null> {
    if (!isSupabaseConfigured()) {
      if (userId === 'demo-admin-id') {
        return {
          id: 'demo-admin-id',
          email: 'admin@deonstudios.com',
          full_name: 'Gideon Boadi',
          avatar_url: '/assets/gideon_boadi_portrait.png',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as DbProfile;
  }
}
