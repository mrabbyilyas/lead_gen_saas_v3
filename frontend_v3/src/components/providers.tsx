"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import devtools to avoid SSR issues
const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((mod) => ({
    default: mod.ReactQueryDevtools,
  })),
  { ssr: false }
);

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Optimized caching configuration
        staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
        gcTime: 10 * 60 * 1000, // 10 minutes - cache cleanup time
        retry: (failureCount, error) => {
          // Smart retry logic
          if (error instanceof Error && error.message.includes('401')) {
            return false; // Don't retry auth errors
          }
          return failureCount < 2; // Retry up to 2 times for other errors
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false, // Disable refetch on window focus for performance
        refetchOnMount: true,
        refetchOnReconnect: true,
        // Enable background refetching for better UX
        refetchInterval: false, // Disable automatic refetching
        refetchIntervalInBackground: false,
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}