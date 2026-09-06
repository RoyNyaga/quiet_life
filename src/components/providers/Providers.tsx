'use client';

import { useState, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeRegistry from '@/theme/ThemeRegistry';
import { AppProvider } from '@/lib/store';
import { Locale } from '@/types/database';

export function Providers({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
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
      <AppProvider initialLocale={initialLocale}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </AppProvider>
    </QueryClientProvider>
  );
}
