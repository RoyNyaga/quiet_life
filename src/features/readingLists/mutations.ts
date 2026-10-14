import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import {
  createReadingList,
  updateReadingList,
  deleteReadingList,
  toggleReadingListItem,
  removeReadingListItem,
} from './api';
import type { ReadingList } from '@/types/database';

export function useCreateReadingList(userId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      description,
      is_private,
    }: {
      name: string;
      description?: string | null;
      is_private?: boolean;
    }) => {
      if (!userId) throw new Error('Must be signed in');
      return createReadingList({ name, description, is_private, userId });
    },
    meta: { successMessage: 'notifications.readingListCreated' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.readingLists.all });
    },
  });
}

export function useUpdateReadingList(userId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string } & Partial<ReadingList>) => updateReadingList(vars),
    meta: { successMessage: 'notifications.readingListUpdated' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.readingLists.all });
    },
  });
}

export function useDeleteReadingList(userId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReadingList(id),
    meta: { successMessage: 'notifications.readingListDeleted' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.readingLists.all });
    },
  });
}

export function useToggleReadingListItem(userId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      postId,
      isSaved,
    }: {
      listId: string;
      postId: string;
      isSaved: boolean;
    }) => toggleReadingListItem({ listId, postId, isSaved }),
    meta: { silent: true },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.readingLists.items(userId) });
    },
  });
}

export function useRemoveReadingListItem(userId?: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, postId }: { listId: string; postId: string }) =>
      removeReadingListItem({ listId, postId }),
    meta: { silent: true },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.readingLists.items(userId) });
    },
  });
}
