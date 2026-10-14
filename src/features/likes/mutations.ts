import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { togglePostLike } from './api';

export function useToggleLike(userId?: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, nextLiked }: { postId: string; nextLiked: boolean }) => {
      if (!userId) throw new Error('Must be signed in to like an article');
      return togglePostLike({ postId, userId, nextLiked });
    },
    meta: { silent: true },
    onMutate: async ({ postId, nextLiked }) => {
      if (!userId) return;
      const key = qk.likes.byUser(userId);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key) ?? [];

      const next = nextLiked
        ? (previous.includes(postId) ? previous : [...previous, postId])
        : previous.filter(id => id !== postId);

      qc.setQueryData<string[]>(key, next);

      // Optimistically update post likes_count across all cached post queries
      const delta = nextLiked ? 1 : -1;
      qc.setQueriesData({ queryKey: qk.posts.all }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((p: any) =>
            p?.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) + delta) } : p
          );
        }
        if (typeof old === 'object' && old !== null && 'id' in old && (old as any).id === postId) {
          const p = old as any;
          return { ...p, likes_count: Math.max(0, (p.likes_count || 0) + delta) };
        }
        return old;
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (userId && context?.previous) {
        qc.setQueryData(qk.likes.byUser(userId), context.previous);
      }
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
    onSettled: () => {
      if (userId) {
        qc.invalidateQueries({ queryKey: qk.likes.byUser(userId) });
      }
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}
