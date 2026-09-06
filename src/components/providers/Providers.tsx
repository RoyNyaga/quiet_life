'use client';

import { useState, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeRegistry from '@/theme/ThemeRegistry';
import { AppProvider } from '@/lib/store';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeRegistry>{children}</ThemeRegistry>
      </AppProvider>
    </QueryClientProvider>
  );
}
