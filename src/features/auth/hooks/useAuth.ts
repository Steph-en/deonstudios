import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { AuthService } from '../services/authService';
import { AuthState, SignInCredentials } from '../types/auth';
import { DbProfile, UserRole } from '../../../types/database';

export function useAuth() {
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
          setUser(currentSession.user);
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
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setRole(null);
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

  const login = async (credentials: SignInCredentials) => {
    setIsLoading(true);
    try {
      const { data } = await AuthService.signIn(credentials);
      if (data?.user) {
        setUser(data.user as User);
        setSession(data.session as Session);
        await fetchProfile(data.user.id);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
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
  };

  const state: AuthState = {
    user,
    profile,
    session,
    role,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: role === 'admin' || Boolean(user),
  };

  return {
    ...state,
    login,
    logout,
    refreshProfile: () => (user ? fetchProfile(user.id) : Promise.resolve()),
  };
}
