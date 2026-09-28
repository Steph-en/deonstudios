import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { AuthService } from '../services/authService';
import { AuthState, SignInCredentials } from '../types/auth';
import { DbProfile, UserRole } from '../../../types/database';

export interface AuthContextType extends AuthState {
  login: (credentials: SignInCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const prof = await AuthService.getProfile(userId);
      setProfile(prof);
      setRole(prof?.role || 'admin');
    } catch {
      setRole('admin');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { session: currentSession } = await AuthService.getSession();
        if (!isMounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user as User);
          await fetchProfile(currentSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    if (isSupabaseConfigured()) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!isMounted) return;

        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user as User);
          await fetchProfile(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('demo_admin_session');
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
        } else {
          // If another Supabase auth event fires without a newSession,
          // only restore from getSession() if one exists, and NEVER wipe out active user
          const { session: currentSession } = await AuthService.getSession();
          if (currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user as User);
            await fetchProfile(currentSession.user.id);
          }
        }
        setIsLoading(false);
      });

      return () => {
        isMounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [fetchProfile]);

  const login = useCallback(
    async (credentials: SignInCredentials) => {
      setIsLoading(true);
      try {
        const { data } = await AuthService.signIn(credentials);
        const loggedUser = data?.user as User | undefined;
        if (!loggedUser) {
          throw new Error('Authentication failed. No user record returned.');
        }

        const loggedSession = (data.session || { user: loggedUser }) as Session;
        setUser(loggedUser);
        setSession(loggedSession);
        localStorage.setItem('demo_admin_session', JSON.stringify(loggedUser));

        const isPrimary =
          loggedUser.email?.toLowerCase() === 'appahstephen9@gmail.com' ||
          loggedUser.id === 'admin-appahstephen9';

        try {
          const prof = await AuthService.getProfile(loggedUser.id);
          setProfile(prof);
          setRole(
            prof?.role ||
              (loggedUser.user_metadata?.role as UserRole) ||
              (isPrimary ? 'admin' : 'manager')
          );
        } catch {
          setRole(isPrimary ? 'admin' : 'manager');
        }

        setIsLoading(false);
        return { success: true };
      } catch (error: any) {
        setIsLoading(false);
        return { success: false, error: error.message || 'Login failed' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    role,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: role === 'admin' || user?.email === 'appahstephen9@gmail.com',
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
