'use client';

import { useState, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ThemeRegistry from '@/theme/ThemeRegistry';
import { AppProvider } from '@/lib/store';
import { Locale } from '@/types/database';
import { makeQueryClient } from '@/lib/query/queryClient';

export function Providers({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider initialLocale={initialLocale}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </AppProvider>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}
