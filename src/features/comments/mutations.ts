import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { createComment, toggleCommentLike } from './api';
import type { Comment } from '@/types/database';

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentData: Partial<Comment>) =>
      createComment({ ...commentData, post_id: postId }),
    meta: { successMessage: 'notifications.commentPosted' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.comments.byPost(postId) });
    },
  });
}

export function useToggleCommentLike(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { commentId: string; userId?: string | null; nextLiked: boolean }) =>
      toggleCommentLike(vars),
    meta: { silent: true },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.comments.byPost(postId) });
    },
  });
}
