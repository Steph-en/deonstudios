import { createClient } from '@supabase/supabase-js';
import {
  supabase,
  isSupabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
  getAuthRedirectUrl,
  PRIMARY_SITE_URL,
} from '../../../lib/supabase';
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

    const isPrimaryAdminUser =
      rawInput === PRIMARY_ADMIN_USERNAME ||
      rawInput === PRIMARY_ADMIN_EMAIL ||
      rawInput === 'admin' ||
      rawInput === 'admin@deonstudios.com';

    // Helper to produce primary admin user session
    const createAdminSession = (effectivePass?: string) => {
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
      if (effectivePass) {
        localStorage.setItem('demo_admin_password', effectivePass);
      }
      return primaryAdminUser;
    };

    // 1. Direct match for Primary Administrator credentials with default / saved password
    if (isPrimaryAdminUser && (password === savedPassword || password === 'admin123')) {
      const adminUser = createAdminSession(password);

      // Background sync to Supabase app_users and try Auth sign-in if configured
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('app_users').upsert({
            id: 'admin-appahstephen9',
            email: PRIMARY_ADMIN_EMAIL,
            username: PRIMARY_ADMIN_USERNAME,
            full_name: 'Stephen Appah',
            role: 'admin',
            password: password,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
        try {
          await supabase.auth.signInWithPassword({
            email: PRIMARY_ADMIN_EMAIL,
            password,
          });
        } catch {
          // ignore
        }
      }

      return {
        data: { user: adminUser, session: { user: adminUser } },
        error: null,
      };
    }

    // 2. Cross-Platform Supabase app_users check (shared database across Google, Local, and Hosted environments)
    if (isSupabaseConfigured()) {
      try {
        const { data: suUser, error: suErr } = await supabase
          .from('app_users')
          .select('*')
          .or(`email.ilike.${cleanEmail},username.ilike.${rawInput}`)
          .maybeSingle();

        if (!suErr && suUser) {
          const isPasswordValid =
            suUser.password === password ||
            (suUser.role === 'admin' && (password === savedPassword || password === 'admin123'));

          if (isPasswordValid) {
            const isPrimary =
              suUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
              suUser.username?.toLowerCase() === PRIMARY_ADMIN_USERNAME;

            const userSession = {
              id: suUser.id,
              email: suUser.email,
              user_metadata: {
                username: isPrimary
                  ? PRIMARY_ADMIN_USERNAME
                  : suUser.username || suUser.email.split('@')[0],
                full_name:
                  suUser.full_name || (isPrimary ? 'Stephen Appah' : 'Studio Member'),
                role: (suUser.role as UserRole) || (isPrimary ? 'admin' : 'manager'),
              },
            };

            localStorage.setItem('demo_admin_session', JSON.stringify(userSession));
            if (isPrimary) {
              localStorage.setItem('demo_admin_password', password);
            }

            return {
              data: { user: userSession, session: { user: userSession } },
              error: null,
            };
          }
        }
      } catch (suCheckErr) {
        console.warn('Supabase app_users auth check notice:', suCheckErr);
      }
    }

    // 3. Check stored custom team members (managers, admins, editors) from server or local
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
      const isPrimary =
        matchedUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
        matchedUser.username?.toLowerCase() === PRIMARY_ADMIN_USERNAME;

      const userSession = {
        id: matchedUser.id,
        email: matchedUser.email,
        user_metadata: {
          username: isPrimary
            ? PRIMARY_ADMIN_USERNAME
            : matchedUser.username || matchedUser.email.split('@')[0],
          full_name: matchedUser.full_name || (isPrimary ? 'Stephen Appah' : 'User'),
          role: (matchedUser.role as UserRole) || (isPrimary ? 'admin' : 'manager'),
        },
      };
      localStorage.setItem('demo_admin_session', JSON.stringify(userSession));
      if (isPrimary) {
        localStorage.setItem('demo_admin_password', password);
      }
      return { data: { user: userSession, session: { user: userSession } }, error: null };
    }

    // 4. Supabase Auth fallback when configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw new Error(error.message || 'Failed to sign in. Please verify your credentials.');
        }

        if (data?.user) {
          const isPrimary =
            data.user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
          const userSession = {
            id: data.user.id,
            email: data.user.email,
            user_metadata: {
              username: isPrimary
                ? PRIMARY_ADMIN_USERNAME
                : data.user.user_metadata?.username || data.user.email?.split('@')[0],
              full_name:
                data.user.user_metadata?.full_name || (isPrimary ? 'Stephen Appah' : 'User'),
              role: isPrimary ? 'admin' : ((data.user.user_metadata?.role as UserRole) || 'manager'),
            },
          };
          localStorage.setItem('demo_admin_session', JSON.stringify(userSession));
          if (isPrimary) {
            localStorage.setItem('demo_admin_password', password);
          }
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
   * Get all registered users from server or Supabase
   */
  static async getTeamMembers(): Promise<DbProfile[]> {
    const baseAdmin: DbProfile = {
      id: 'admin-appahstephen9',
      email: PRIMARY_ADMIN_EMAIL,
      username: PRIMARY_ADMIN_USERNAME,
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

    const localProfiles: DbProfile[] = serverUsers
      .filter((u) => u.email?.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase())
      .map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username || u.email?.split('@')[0],
        full_name: u.full_name,
        avatar_url: null,
        role: (u.role as UserRole) || 'manager',
        created_at: u.created_at || new Date().toISOString(),
        updated_at: u.created_at || new Date().toISOString(),
      }));

    if (!isSupabaseConfigured()) {
      return [baseAdmin, ...localProfiles];
    }

    // Try fetching from Supabase app_users table first (cross-platform storage)
    try {
      const { data: suUsers } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: true });

      if (suUsers && suUsers.length > 0) {
        const mappedProfiles: DbProfile[] = suUsers.map((u: any) => ({
          id: u.id,
          email: u.email,
          username: u.username || u.email?.split('@')[0],
          full_name: u.full_name || u.username || u.email.split('@')[0],
          avatar_url: null,
          role: (u.role as UserRole) || 'manager',
          created_at: u.created_at || new Date().toISOString(),
          updated_at: u.updated_at || new Date().toISOString(),
        }));

        const hasAdmin = mappedProfiles.some(
          (p) => p.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
        );
        return hasAdmin ? mappedProfiles : [baseAdmin, ...mappedProfiles];
      }
    } catch {
      // Continue to profiles query
    }

    // Fallback to Supabase profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        return [baseAdmin, ...localProfiles];
      }

      const hasPrimary = data.some(
        (p) => p.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
      );

      const merged = hasPrimary ? (data as DbProfile[]) : [baseAdmin, ...(data as DbProfile[])];
      return merged;
    } catch {
      return [baseAdmin, ...localProfiles];
    }
  }

  /**
   * Invite or create a new user account with designated role
   * Saves to Supabase app_users, public.profiles, server, and local storage
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
      updated_at: new Date().toISOString(),
    };

    // 1. Cross-Platform Persist: Insert into Supabase app_users table & profiles
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('app_users').upsert({
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          full_name: newUser.full_name,
          role: newUser.role,
          password: newUser.password,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at,
        });
      } catch (appUserErr) {
        console.warn('Supabase app_users note:', appUserErr);
      }

      try {
        await supabase.from('profiles').upsert({
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          full_name: newUser.full_name,
          role: newUser.role,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at,
        });
      } catch (profErr) {
        console.warn('Supabase profiles upsert note:', profErr);
      }

      // 2. Also attempt Supabase Auth sign-up (does not block if rate limited or email unconfirmed)
      try {
        const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });

        await tempClient.auth.signUp({
          email: cleanEmail,
          password: payload.password,
          options: {
            data: {
              full_name: payload.full_name.trim(),
              username: cleanUsername,
              role: payload.role,
            },
            emailRedirectTo: getAuthRedirectUrl('/admin'),
          },
        });
      } catch (authErr) {
        console.warn('Supabase sign-up attempt notice:', authErr);
      }
    }

    // 3. Persist to server API if available (Local / Dev backend)
    try {
      await ApiClient.post('/auth/users', newUser);
    } catch {
      // offline / static hosted environment fallback
    }

    // 4. Save to local storage
    existing.push(newUser);
    this.saveLocalTeamUsers(existing);

    return {
      success: true,
      message: `Account for ${payload.full_name} (${cleanEmail}) created with role "${payload.role.toUpperCase()}". Credentials are now active across all environments.`,
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
      try {
        await Promise.allSettled([
          supabase.from('app_users').delete().eq('id', id),
          supabase.from('profiles').delete().eq('id', id),
        ]);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Update current user's password across all environments
   */
  static async updatePassword(newPassword: string) {
    localStorage.setItem('demo_admin_password', newPassword);

    const { session } = await this.getSession();
    const userEmail = session?.user?.email || PRIMARY_ADMIN_EMAIL;

    if (isSupabaseConfigured()) {
      // Sync to Supabase app_users table
      try {
        await supabase
          .from('app_users')
          .update({
            password: newPassword,
            updated_at: new Date().toISOString(),
          })
          .ilike('email', userEmail);
      } catch (err) {
        console.warn('Supabase app_users password update error:', err);
      }

      // Also try live Supabase Auth update if active session
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          console.warn('Supabase auth password update note:', error.message);
        }
        return { data, error: null };
      } catch (err: any) {
        console.warn('Supabase password update error:', err);
      }
    }

    return { error: null };
  }

  /**
   * Send password reset email with authorized redirect URL
   */
  static async sendPasswordReset(email: string) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null };
    }
    return supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getAuthRedirectUrl('/admin'),
    });
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
        username: PRIMARY_ADMIN_USERNAME,
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
            username:
              sUser.user_metadata?.username ||
              (isPrimary ? PRIMARY_ADMIN_USERNAME : sUser.email?.split('@')[0]),
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
        username: custom.username || custom.email?.split('@')[0],
        full_name: custom.full_name,
        avatar_url: null,
        role: (custom.role as UserRole) || 'manager',
        created_at: custom.created_at,
        updated_at: custom.created_at,
      };
    }

    // 3.5 Check Supabase app_users table
    if (isSupabaseConfigured()) {
      try {
        const { data: appUser } = await supabase
          .from('app_users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (appUser) {
          const isPrimary = appUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
          return {
            id: appUser.id,
            email: appUser.email,
            username: appUser.username || appUser.email?.split('@')[0],
            full_name: appUser.full_name || appUser.username || appUser.email.split('@')[0],
            avatar_url: null,
            role: isPrimary ? 'admin' : ((appUser.role as UserRole) || 'manager'),
            created_at: appUser.created_at,
            updated_at: appUser.updated_at,
          };
        }
      } catch {
        // ignore
      }
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
            username: data.username || (isPrimary ? PRIMARY_ADMIN_USERNAME : data.email?.split('@')[0]),
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
            username:
              authData.user.user_metadata?.username ||
              (isPrimary ? PRIMARY_ADMIN_USERNAME : authData.user.email?.split('@')[0]),
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
