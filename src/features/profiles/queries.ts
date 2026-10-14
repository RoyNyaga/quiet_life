import { queryOptions, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { fetchProfiles } from './api';
import type { Profile } from '@/types/database';

export const profilesQueryOptions = () =>
  queryOptions<Profile[]>({
    queryKey: qk.profiles.all,
    queryFn: fetchProfiles,
    staleTime: 60 * 1000,
  });

export function useProfiles(options?: { enabled?: boolean }) {
  return useQuery({
    ...profilesQueryOptions(),
    enabled: options?.enabled ?? true,
  });
}
