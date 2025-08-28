import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { DarkModeProvider } from '../lib/darkMode';
import { AuthProvider } from '../lib/auth';
import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';

export default function MyApp({ Component, pageProps }: AppProps) {
  // Create a client instance for React Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 2,
        staleTime: 5000, // Data considered fresh for 5 seconds
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <AuthProvider>
          <Component {...pageProps} />
          <Analytics />
        </AuthProvider>
      </DarkModeProvider>
    </QueryClientProvider>
  );
} 