import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { createPost, updatePost, deletePost, incrementPostViews } from './api';
import type { Post } from '@/types/database';

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postData: Partial<Post>) => createPost(postData),
    meta: { successMessage: 'notifications.postCreated' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string } & Partial<Post>) => updatePost(vars),
    meta: { successMessage: 'notifications.postUpdated' },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: qk.posts.all });
      if (updated?.slug) {
        qc.invalidateQueries({ queryKey: qk.posts.detail(updated.slug) });
      }
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    meta: { successMessage: 'notifications.postDeleted' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}

export function useIncrementViews() {
  return useMutation({
    mutationFn: (postId: string) => incrementPostViews(postId),
    meta: { silent: true },
  });
}
