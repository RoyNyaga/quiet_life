import { queryOptions } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { fetchProfileRow } from './api';

export const profileQueryOptions = (userId?: string | null) =>
  queryOptions({
    queryKey: qk.auth.profile(userId),
    queryFn: () => fetchProfileRow(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
