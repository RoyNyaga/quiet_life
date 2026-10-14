import { queryOptions, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { fetchSubscriptions } from './api';
import type { Subscription } from '@/types/database';

export const subscriptionsQueryOptions = () =>
  queryOptions<Subscription[]>({
    queryKey: qk.subscriptions.all,
    queryFn: fetchSubscriptions,
    staleTime: 60 * 1000,
  });

export function useSubscriptions(options?: { enabled?: boolean }) {
  return useQuery({
    ...subscriptionsQueryOptions(),
    enabled: options?.enabled ?? true,
  });
}
