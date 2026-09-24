import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../../../lib/supabase';
import { SignInCredentials } from '../types/auth';
import { DbProfile } from '../../../types/database';
import { ApiClient } from '../../../lib/api';

export class AuthService {
  /**
   * Log in admin with email & password via Supabase Auth
   */
  static async signIn({ email, password }: SignInCredentials) {
    if (!isSupabaseConfigured()) {
      // Check primary admin or any additional team accounts
      const savedPassword = localStorage.getItem('demo_admin_password') || 'admin123';
      const cleanEmail = email.trim().toLowerCase();

      if ((cleanEmail === 'admin@deonstudios.com' || cleanEmail === 'admin') && password === savedPassword) {
        const mockUser = {
          id: 'demo-admin-id',
          email: 'admin@deonstudios.com',
          user_metadata: { full_name: 'Gideon Boadi (Studio Owner)', role: 'admin' },
        };
        localStorage.setItem('demo_admin_session', JSON.stringify(mockUser));
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      }

      // Check stored custom team members from centralized server first
      let customUsers: any[] = [];
      try {
        customUsers = await ApiClient.get<any[]>('/auth/users');
      } catch {
        customUsers = this.getLocalTeamUsers();
      }

      const match = customUsers.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === password
      );
      if (match) {
        const mockUser = {
          id: match.id,
          email: match.email,
          user_metadata: { full_name: match.full_name, role: match.role },
        };
        localStorage.setItem('demo_admin_session', JSON.stringify(mockUser));
        return { data: { user: mockUser, session: { user: mockUser } }, error: null };
      }

      throw new Error('Invalid email or password. Please verify your credentials and try again.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      throw new Error(error.message || 'Failed to sign in. Please verify your credentials.');
    }

    return { data, error: null };
  }

  /**
   * Local storage helper for team members
   */
  private static getLocalTeamUsers(): Array<{
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'editor';
    password?: string;
    created_at: string;
  }> {
    try {
      const raw = localStorage.getItem('deon_cms_team_members');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return [];
  }

  private static saveLocalTeamUsers(users: any[]) {
    try {
      localStorage.setItem('deon_cms_team_members', JSON.stringify(users));
    } catch {
      // ignore
    }
  }

  /**
   * Get all admin/editor users from Supabase profiles or local/server database
   */
  static async getTeamMembers(): Promise<DbProfile[]> {
    if (!isSupabaseConfigured()) {
      const baseAdmin: DbProfile = {
        id: 'demo-admin-id',
        email: 'admin@deonstudios.com',
        full_name: 'Gideon Boadi (Studio Owner)',
        avatar_url: '/assets/gideon_boadi_portrait.png',
        role: 'admin',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      };

      let customUsers: any[] = [];
      try {
        customUsers = await ApiClient.get<any[]>('/auth/users');
        this.saveLocalTeamUsers(customUsers);
      } catch {
        customUsers = this.getLocalTeamUsers();
      }

      const custom = customUsers.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        avatar_url: null,
        role: u.role,
        created_at: u.created_at,
        updated_at: u.created_at,
      }));
      return [baseAdmin, ...custom];
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }
    return data as DbProfile[];
  }

  /**
   * Invite or create a new user account with credentials
   */
  static async createTeamMember(payload: {
    email: string;
    password: string;
    full_name: string;
    role: 'admin' | 'editor';
  }): Promise<{ success: boolean; message: string }> {
    const cleanEmail = payload.email.trim().toLowerCase();

    if (!isSupabaseConfigured()) {
      let existing: any[] = [];
      try {
        existing = await ApiClient.get<any[]>('/auth/users');
      } catch {
        existing = this.getLocalTeamUsers();
      }

      if (
        cleanEmail === 'admin@deonstudios.com' ||
        existing.some((u) => u.email.toLowerCase() === cleanEmail)
      ) {
        throw new Error(`An account with email "${cleanEmail}" already exists.`);
      }

      const newUser = {
        id: `team-${Date.now()}`,
        email: cleanEmail,
        full_name: payload.full_name.trim(),
        role: payload.role,
        password: payload.password,
        created_at: new Date().toISOString(),
      };

      try {
        await ApiClient.post('/auth/users', newUser);
      } catch {
        // fallback
      }

      existing.push(newUser);
      this.saveLocalTeamUsers(existing);

      return {
        success: true,
        message: `Account for ${payload.full_name} (${cleanEmail}) has been created successfully. They can now log in using these credentials.`,
      };
    }

    // When connected to Supabase:
    // Notice: calling supabase.auth.signUp() directly from client side can replace the current admin's session
    // if auto-confirm is enabled. We use a secondary non-persistent auth client or preserve the admin session.
    const { data: currentAdminSession } = await supabase.auth.getSession();
    const adminAccessToken = currentAdminSession?.session?.access_token;
    const adminRefreshToken = currentAdminSession?.session?.refresh_token;

    let targetUserId: string | null = null;

    try {
      // Create a temporary isolated client without session persistence so current admin is not logged out
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email: cleanEmail,
        password: payload.password,
        options: {
          data: {
            full_name: payload.full_name.trim(),
            role: payload.role,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message || 'Failed to create user in Supabase auth.');
      }

      targetUserId = signUpData.user?.id || null;
    } catch (authErr: any) {
      // If Supabase sign up is disabled or requires service role, provide friendly message
      throw new Error(authErr.message || 'Failed to create user account in Supabase.');
    } finally {
      // Restore current admin session if it was altered
      if (adminAccessToken && adminRefreshToken) {
        try {
          await supabase.auth.setSession({
            access_token: adminAccessToken,
            refresh_token: adminRefreshToken,
          });
        } catch {
          // ignore session restore errors
        }
      }
    }

    if (targetUserId) {
      // Upsert profile record explicitly to guarantee role & metadata
      try {
        await supabase.from('profiles').upsert({
          id: targetUserId,
          email: cleanEmail,
          full_name: payload.full_name.trim(),
          role: payload.role,
          updated_at: new Date().toISOString(),
        });
      } catch (profileErr) {
        console.warn('Profile upsert note:', profileErr);
      }
    }

    return {
      success: true,
      message: `Account created for ${payload.full_name} (${cleanEmail}). They can now log in to the admin panel.`,
    };
  }

  /**
   * Remove a team member
   */
  static async removeTeamMember(id: string): Promise<void> {
    if (id === 'demo-admin-id') {
      throw new Error('Cannot delete the primary owner account.');
    }

    if (!isSupabaseConfigured()) {
      try {
        await ApiClient.delete(`/auth/users/${id}`);
      } catch {
        // offline
      }
      const existing = this.getLocalTeamUsers().filter((u) => u.id !== id);
      this.saveLocalTeamUsers(existing);
      return;
    }

    await supabase.from('profiles').delete().eq('id', id);
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
      const sessionRaw = localStorage.getItem('demo_admin_session');
      if (sessionRaw) {
        try {
          // If stored as JSON object
          if (sessionRaw.startsWith('{')) {
            const mockUser = JSON.parse(sessionRaw);
            return { session: { user: mockUser } as any };
          }
        } catch {
          // fallback
        }
        const mockUser = {
          id: 'demo-admin-id',
          email: 'admin@deonstudios.com',
          user_metadata: { full_name: 'Gideon Boadi (Studio Owner)', role: 'admin' },
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
   * Fetch user profile from public.profiles with safe fallback
   */
  static async getProfile(userId: string): Promise<DbProfile | null> {
    if (!isSupabaseConfigured()) {
      if (userId === 'demo-admin-id') {
        return {
          id: 'demo-admin-id',
          email: 'admin@deonstudios.com',
          full_name: 'Gideon Boadi (Studio Owner)',
          avatar_url: '/assets/gideon_boadi_portrait.png',
          role: 'admin',
          created_at: '2025-01-01T00:00:00.000Z',
          updated_at: new Date().toISOString(),
        };
      }

      // Check server team users first
      let customUsers: any[] = [];
      try {
        customUsers = await ApiClient.get<any[]>('/auth/users');
      } catch {
        customUsers = this.getLocalTeamUsers();
      }

      const custom = customUsers.find((u) => u.id === userId);
      if (custom) {
        return {
          id: custom.id,
          email: custom.email,
          full_name: custom.full_name,
          avatar_url: null,
          role: custom.role,
          created_at: custom.created_at,
          updated_at: custom.created_at,
        };
      }

      // Fallback check from current session if logged in
      const sessionRaw = localStorage.getItem('demo_admin_session');
      if (sessionRaw) {
        try {
          const sUser = JSON.parse(sessionRaw);
          if (sUser && (sUser.id === userId || !userId)) {
            return {
              id: sUser.id || userId,
              email: sUser.email || 'admin@deonstudios.com',
              full_name: sUser.user_metadata?.full_name || 'Admin User',
              avatar_url: '/assets/gideon_boadi_portrait.png',
              role: sUser.user_metadata?.role || 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          }
        } catch {
          // ignore
        }
      }

      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as DbProfile;
      }
    } catch {
      // ignore
    }

    // Supabase fallback: construct profile from auth.getUser() so profile page doesn't crash if profiles row is pending
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user && authData.user.id === userId) {
        return {
          id: authData.user.id,
          email: authData.user.email || '',
          full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Admin User',
          avatar_url: authData.user.user_metadata?.avatar_url || null,
          role: (authData.user.user_metadata?.role as 'admin' | 'editor') || 'admin',
          created_at: authData.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch {
      // ignore
    }

    return null;
  }
}
