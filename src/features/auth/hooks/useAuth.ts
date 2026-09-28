import { useAuthContext, AuthProvider, AuthContextType } from '../context/AuthContext';

export { AuthProvider };
export type { AuthContextType };

/**
 * Global authentication hook providing synchronized auth state across all components
 */
export function useAuth(): AuthContextType {
  return useAuthContext();
}
