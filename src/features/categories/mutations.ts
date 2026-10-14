import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { createCategory, updateCategory, deleteCategory } from './api';
import type { Category } from '@/types/database';

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cat: Partial<Category>) => createCategory(cat),
    meta: { successMessage: 'notifications.categoryCreated' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categories.all });
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string } & Partial<Category>) => updateCategory(vars),
    meta: { successMessage: 'notifications.categoryUpdated' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categories.all });
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    meta: { successMessage: 'notifications.categoryDeleted' },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.categories.all });
      qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}
