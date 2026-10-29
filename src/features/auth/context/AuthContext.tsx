import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { AuthService } from '../services/authService';
import { AuthState, SignInCredentials } from '../types/auth';
import { DbProfile } from '../../../types/database';

export interface AuthContextType extends AuthState {
  login: (credentials: SignInCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Fires once immediately with the stored session (INITIAL_SESSION), then on
    // every sign-in / sign-out / token refresh, so it is the single source of truth.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Don't call Supabase from inside this callback (can deadlock); defer a tick.
      setTimeout(async () => {
        const nextProfile = next ? await AuthService.getProfile(next.user.id) : null;
        if (!active) return;
        setProfile(nextProfile);
        setIsLoading(false);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: SignInCredentials) => {
    try {
      const { session: nextSession, profile: nextProfile } = await AuthService.signIn(credentials);
      setSession(nextSession);
      setProfile(nextProfile);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    await AuthService.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) setProfile(await AuthService.getProfile(session.user.id));
  }, [session]);

  const role = profile?.role ?? null;

  const value: AuthContextType = {
    user: session?.user ?? null,
    profile,
    session,
    role,
    isLoading,
    // Signed in AND holds a staff role. A bare Supabase account is not enough.
    isAuthenticated: Boolean(session && role),
    isAdmin: role === 'admin',
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
