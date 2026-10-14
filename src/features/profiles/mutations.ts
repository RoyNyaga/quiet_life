import { useMutation, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { updateProfile, updateUserRole } from './api';
import type { Profile } from '@/types/database';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string } & Partial<Profile>) => updateProfile(vars),
    meta: { successMessage: 'notifications.profileUpdated' },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: qk.auth.profile(updated.id) });
      qc.invalidateQueries({ queryKey: qk.profiles.all });
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; role: 'admin' | 'user' }) => updateUserRole(vars),
    meta: { successMessage: 'notifications.saved' },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: qk.auth.profile(updated.id) });
      qc.invalidateQueries({ queryKey: qk.profiles.all });
    },
  });
}
