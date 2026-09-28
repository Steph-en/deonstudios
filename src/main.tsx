import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AdminUIProvider } from './context/AdminUIContext';
import { AuthProvider } from './features/auth/hooks/useAuth';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AdminUIProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AdminUIProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);


