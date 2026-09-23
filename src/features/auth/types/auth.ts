import { User, Session } from '@supabase/supabase-js';
import { DbProfile, UserRole } from '../../../types/database';

export interface AuthState {
  user: User | null;
  profile: DbProfile | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface SignInCredentials {
  email: string;
  password: string;
}
