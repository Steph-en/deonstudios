import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { HelmetProvider } from 'react-helmet-async';
import { AdminUIProvider } from './context/AdminUIContext';
import { AuthProvider } from './features/auth/hooks/useAuth';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep cached database queries in storage for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
      // Fresh data threshold: 2 minutes default
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Configure synchronous localStorage persister to preserve cache between sessions
const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'DEON_STUDIOS_QUERY_CACHE_V1',
  throttleTime: 1000,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          buster: 'deon-studios-cache-v1',
        }}
      >
        <AdminUIProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AdminUIProvider>
      </PersistQueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);


