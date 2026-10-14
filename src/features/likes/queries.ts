import { queryOptions, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { qk } from '@/lib/query/keys';
import { fetchUserLikes } from './api';

export const userLikesQueryOptions = (userId?: string | null) =>
  queryOptions<string[]>({
    queryKey: qk.likes.byUser(userId),
    queryFn: () => (userId ? fetchUserLikes(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

export function useUserLikes(userId?: string | null) {
  const query = useQuery(userLikesQueryOptions(userId));
  const likedPostIds = useMemo(() => new Set(query.data ?? []), [query.data]);

  return {
    ...query,
    likedPostIds,
    isLiked: (postId: string) => likedPostIds.has(postId),
  };
}
