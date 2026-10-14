import { queryOptions, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { fetchComments } from './api';
import type { Comment } from '@/types/database';

export const commentsQueryOptions = (postId: string) =>
  queryOptions<Comment[]>({
    queryKey: qk.comments.byPost(postId),
    queryFn: () => (postId ? fetchComments(postId) : Promise.resolve([])),
    enabled: Boolean(postId),
    staleTime: 30 * 1000,
  });

export function useComments(postId: string) {
  return useQuery(commentsQueryOptions(postId));
}
