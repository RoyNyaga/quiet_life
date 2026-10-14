import { queryOptions, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { fetchPublishedPosts, fetchPostBySlug, fetchAdminPosts } from './api';
import type { Post } from '@/types/database';

export const postsQueryOptions = (filters?: Record<string, unknown>) =>
  queryOptions<Post[]>({
    queryKey: qk.posts.list(filters),
    queryFn: fetchPublishedPosts,
    staleTime: 60 * 1000,
  });

export function usePosts(filters?: Record<string, unknown>) {
  return useQuery(postsQueryOptions(filters));
}

export const usePublicPosts = usePosts;

export const postQueryOptions = (slug: string) =>
  queryOptions<Post | null>({
    queryKey: qk.posts.detail(slug),
    queryFn: () => fetchPostBySlug(slug),
    staleTime: 60 * 1000,
    enabled: Boolean(slug),
  });

export function usePost(slug: string) {
  return useQuery(postQueryOptions(slug));
}

export const adminPostsQueryOptions = () =>
  queryOptions<Post[]>({
    queryKey: qk.posts.admin(),
    queryFn: fetchAdminPosts,
    staleTime: 30 * 1000,
  });

export function useAdminPosts(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminPostsQueryOptions(),
    enabled: options?.enabled ?? true,
  });
}
