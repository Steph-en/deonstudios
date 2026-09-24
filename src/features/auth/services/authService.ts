import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../../../lib/supabase';
import { SignInCredentials } from '../types/auth';
import { DbProfile, UserRole } from '../../../types/database';
import { ApiClient } from '../../../lib/api';

const PRIMARY_ADMIN_EMAIL = 'appahstephen9@gmail.com';
const PRIMARY_ADMIN_USERNAME = 'appahstephen9';

export class AuthService {
  /**
   * Log in admin with username/email & password
   */
  static async signIn({ email, password }: SignInCredentials) {
    const rawInput = email.trim().toLowerCase();
    const savedPassword = localStorage.getItem('demo_admin_password') || 'admin123';

    // Normalize username aliases to primary admin or target email
    let cleanEmail = rawInput;
    if (rawInput === PRIMARY_ADMIN_USERNAME || rawInput === 'admin') {
      cleanEmail = PRIMARY_ADMIN_EMAIL;
    }

    const isPrimaryAdminCredentials =
      (rawInput === PRIMARY_ADMIN_USERNAME ||
        rawInput === PRIMARY_ADMIN_EMAIL ||
        rawInput === 'admin' ||
        rawInput === 'admin@deonstudios.com') &&
      (password === savedPassword || password === 'admin123');

    // 1. Direct match for Primary Administrator credentials
    if (isPrimaryAdminCredentials) {
      const primaryAdminUser = {
        id: 'admin-appahstephen9',
        email: PRIMARY_ADMIN_EMAIL,
        user_metadata: {
          username: PRIMARY_ADMIN_USERNAME,
          full_name: 'Stephen Appah',
          role: 'admin' as UserRole,
        },
      };
      localStorage.setItem('demo_admin_session', JSON.stringify(primaryAdminUser));

      // Also try background Supabase sign-in if available, but do not block
      if (isSupabaseConfigured()) {
        try {
          await supabase.auth.signInWithPassword({
            email: PRIMARY_ADMIN_EMAIL,
            password,
          });
        } catch {
          // Fallback to local admin session is already secured
        }
      }

      return {
        data: { user: primaryAdminUser, session: { user: primaryAdminUser } },
        error: null,
      };
    }

    // 2. Check stored custom team members (managers, admins, editors) from server or local
    let customUsers: any[] = [];
    try {
      customUsers = await ApiClient.get<any[]>('/auth/users');
    } catch {
      customUsers = this.getLocalTeamUsers();
    }

    const matchedUser = customUsers.find(
      (u) =>
        (u.email.toLowerCase() === cleanEmail ||
          (u.username && u.username.toLowerCase() === rawInput)) &&
        u.password === password
    );

    if (matchedUser) {
      const mockUser = {
        id: matchedUser.id,
        email: matchedUser.email,
        user_metadata: {
          username: matchedUser.username || matchedUser.email.split('@')[0],
          full_name: matchedUser.full_name,
          role: (matchedUser.role as UserRole) || 'manager',
        },
      };
      localStorage.setItem('demo_admin_session', JSON.stringify(mockUser));
      return { data: { user: mockUser, session: { user: mockUser } }, error: null };
    }

    // 3. Supabase Auth fallback when configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw new Error(error.message || 'Failed to sign in. Please verify your credentials.');
        }

        return { data, error: null };
      } catch (err: any) {
        throw new Error(err.message || 'Invalid username/email or password.');
      }
    }

    throw new Error('Invalid username/email or password. Please verify your credentials and try again.');
  }

  /**
   * Local storage helper for team members
   */
  private static getLocalTeamUsers(): Array<{
    id: string;
    email: string;
    username?: string;
    full_name: string;
    role: UserRole;
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
   * Get all registered users from server or Supabase profiles
   */
  static async getTeamMembers(): Promise<DbProfile[]> {
    const baseAdmin: DbProfile = {
      id: 'admin-appahstephen9',
      email: PRIMARY_ADMIN_EMAIL,
      full_name: 'Stephen Appah (Administrator)',
      avatar_url: null,
      role: 'admin',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: new Date().toISOString(),
    };

    let serverUsers: any[] = [];
    try {
      serverUsers = await ApiClient.get<any[]>('/auth/users');
      this.saveLocalTeamUsers(serverUsers);
    } catch {
      serverUsers = this.getLocalTeamUsers();
    }

    // Filter out duplicate primary admin if stored in server
    const serverProfiles: DbProfile[] = serverUsers
      .filter((u) => u.email.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase())
      .map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        avatar_url: null,
        role: (u.role as UserRole) || 'manager',
        created_at: u.created_at,
        updated_at: u.created_at,
      }));

    if (!isSupabaseConfigured()) {
      return [baseAdmin, ...serverProfiles];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return [baseAdmin, ...serverProfiles];
      }

      // Check if primary admin is present in Supabase profiles
      const hasPrimary = data.some(
        (p) => p.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
      );

      const merged = hasPrimary ? (data as DbProfile[]) : [baseAdmin, ...(data as DbProfile[])];
      return merged;
    } catch {
      return [baseAdmin, ...serverProfiles];
    }
  }

  /**
   * Invite or create a new user account with designated role
   * Only administrators can call this
   */
  static async createTeamMember(payload: {
    email: string;
    username?: string;
    password: string;
    full_name: string;
    role: UserRole;
  }): Promise<{ success: boolean; message: string }> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanUsername = (payload.username || cleanEmail.split('@')[0]).trim().toLowerCase();

    // Verify current user is admin
    const { session } = await this.getSession();
    const currentUserRole =
      session?.user?.user_metadata?.role ||
      (session?.user?.id ? (await this.getProfile(session.user.id))?.role : null);

    if (currentUserRole && currentUserRole !== 'admin') {
      throw new Error('Access Denied: Only administrators have permission to create new users.');
    }

    let existing: any[] = [];
    try {
      existing = await ApiClient.get<any[]>('/auth/users');
    } catch {
      existing = this.getLocalTeamUsers();
    }

    if (
      cleanEmail === PRIMARY_ADMIN_EMAIL ||
      existing.some((u) => u.email.toLowerCase() === cleanEmail)
    ) {
      throw new Error(`An account with email "${cleanEmail}" already exists.`);
    }

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      username: cleanUsername,
      full_name: payload.full_name.trim(),
      role: payload.role,
      password: payload.password,
      created_at: new Date().toISOString(),
    };

    try {
      await ApiClient.post('/auth/users', newUser);
    } catch {
      // fallback to local storage
    }

    existing.push(newUser);
    this.saveLocalTeamUsers(existing);

    // If Supabase is configured, create in Supabase Auth & public.profiles
    if (isSupabaseConfigured()) {
      const { data: currentAdminSession } = await supabase.auth.getSession();
      const adminAccessToken = currentAdminSession?.session?.access_token;
      const adminRefreshToken = currentAdminSession?.session?.refresh_token;

      let targetUserId: string | null = null;

      try {
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
              username: cleanUsername,
              role: payload.role,
            },
          },
        });

        if (!signUpError && signUpData?.user) {
          targetUserId = signUpData.user.id;
        }
      } catch (authErr) {
        console.warn('Supabase sign-up attempt note:', authErr);
      } finally {
        if (adminAccessToken && adminRefreshToken) {
          try {
            await supabase.auth.setSession({
              access_token: adminAccessToken,
              refresh_token: adminRefreshToken,
            });
          } catch {
            // ignore
          }
        }
      }

      if (targetUserId) {
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
    }

    return {
      success: true,
      message: `Account for ${payload.full_name} (${cleanEmail}) created with role "${payload.role.toUpperCase()}". They can now log in using these credentials.`,
    };
  }

  /**
   * Remove a user account
   */
  static async removeTeamMember(id: string): Promise<void> {
    if (id === 'admin-appahstephen9' || id === 'demo-admin-id') {
      throw new Error('Cannot delete the primary owner account.');
    }

    // Verify caller is admin
    const { session } = await this.getSession();
    const currentUserRole =
      session?.user?.user_metadata?.role ||
      (session?.user?.id ? (await this.getProfile(session.user.id))?.role : null);

    if (currentUserRole && currentUserRole !== 'admin') {
      throw new Error('Access Denied: Only administrators have permission to remove users.');
    }

    try {
      await ApiClient.delete(`/auth/users/${id}`);
    } catch {
      // offline
    }

    const existing = this.getLocalTeamUsers().filter((u) => u.id !== id);
    this.saveLocalTeamUsers(existing);

    if (isSupabaseConfigured()) {
      await supabase.from('profiles').delete().eq('id', id);
    }
  }

  /**
   * Update current user's password
   */
  static async updatePassword(newPassword: string) {
    localStorage.setItem('demo_admin_password', newPassword);

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          console.warn('Supabase password update note:', error.message);
        }
        return { data, error: null };
      } catch (err: any) {
        console.warn('Supabase password update error:', err);
      }
    }

    return { error: null };
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
    const sessionRaw = localStorage.getItem('demo_admin_session');
    if (sessionRaw) {
      try {
        if (sessionRaw.startsWith('{')) {
          const parsed = JSON.parse(sessionRaw);
          return { session: { user: parsed } as any };
        }
      } catch {
        // fallback
      }
    }

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) {
        return { session: data.session };
      }
    }

    return { session: null };
  }

  /**
   * Fetch user profile from public.profiles with safe fallback
   */
  static async getProfile(userId: string): Promise<DbProfile | null> {
    // 1. Primary Administrator profile
    if (userId === 'admin-appahstephen9' || userId === 'demo-admin-id') {
      return {
        id: 'admin-appahstephen9',
        email: PRIMARY_ADMIN_EMAIL,
        full_name: 'Stephen Appah',
        avatar_url: null,
        role: 'admin',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString(),
      };
    }

    // 2. Check local admin session if matched
    const sessionRaw = localStorage.getItem('demo_admin_session');
    if (sessionRaw) {
      try {
        const sUser = JSON.parse(sessionRaw);
        if (sUser && (sUser.id === userId || !userId)) {
          const isPrimary =
            sUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
            sUser.id === 'admin-appahstephen9';
          return {
            id: sUser.id || userId,
            email: sUser.email || (isPrimary ? PRIMARY_ADMIN_EMAIL : 'member@deonstudios.com'),
            full_name: sUser.user_metadata?.full_name || (isPrimary ? 'Stephen Appah' : 'User'),
            avatar_url: null,
            role: isPrimary ? 'admin' : ((sUser.user_metadata?.role as UserRole) || 'manager'),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      } catch {
        // ignore
      }
    }

    // 3. Check server team users
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
        role: (custom.role as UserRole) || 'manager',
        created_at: custom.created_at,
        updated_at: custom.created_at,
      };
    }

    // 4. Check Supabase profiles table
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          const isPrimary = data.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
          return {
            ...data,
            role: isPrimary ? 'admin' : ((data.role as UserRole) || 'manager'),
          } as DbProfile;
        }
      } catch {
        // ignore
      }

      // Supabase auth getUser fallback
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user && authData.user.id === userId) {
          const isPrimary = authData.user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
          return {
            id: authData.user.id,
            email: authData.user.email || '',
            full_name:
              authData.user.user_metadata?.full_name ||
              (isPrimary ? 'Stephen Appah' : authData.user.email?.split('@')[0]) ||
              'User',
            avatar_url: authData.user.user_metadata?.avatar_url || null,
            role: isPrimary ? 'admin' : ((authData.user.user_metadata?.role as UserRole) || 'manager'),
            created_at: authData.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      } catch {
        // ignore
      }
    }

    return null;
  }
}
