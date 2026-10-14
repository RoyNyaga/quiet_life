import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { createTag, updateTag, deleteTag } from './api';
import type { Tag } from '@/types/database';

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tag: Partial<Tag>) => createTag(tag),
    meta: { successMessage: 'notifications.tagCreated' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tags.all });
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string } & Partial<Tag>) => updateTag(vars),
    meta: { successMessage: 'notifications.tagUpdated' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tags.all });
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    meta: { successMessage: 'notifications.tagDeleted' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.tags.all });
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}
