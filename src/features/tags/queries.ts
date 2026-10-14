import { queryOptions, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { fetchTags } from './api';
import type { Tag } from '@/types/database';

export const tagsQueryOptions = () =>
  queryOptions<Tag[]>({
    queryKey: qk.tags.all,
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000,
  });

export function useTags() {
  return useQuery(tagsQueryOptions());
}
