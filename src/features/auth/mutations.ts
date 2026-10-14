import { useMutation, useQueryClient } from '@tanstack/react-query';
import { USER_SCOPED_ROOT_KEYS } from '@/lib/query/keys';
import { signIn, signUp, signOut, buildProfile } from './api';
import { profileQueryOptions } from './queries';

/**
 * Sign in. Errors are shown inline in the form (meta.silent),
 * so no global toast is raised for wrong credentials.
 * Resolves with the merged profile so callers can redirect by role.
 */
export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof signIn>[0]) => {
      const { user } = await signIn(input);
      const row = await qc.fetchQuery(profileQueryOptions(user.id));
      return { user, profile: buildProfile(user, row) };
    },
    meta: { silent: true, successMessage: 'auth.signedIn' },
  });
}

/**
 * Sign up. When email confirmation is enabled Supabase returns no session;
 * `needsEmailConfirmation` tells the UI to show the "check your email" message.
 */
export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof signUp>[0]) => {
      const { user, session } = await signUp(input);
      if (!user || !session) {
        return { needsEmailConfirmation: true as const, profile: null };
      }
      const row = await qc.fetchQuery(profileQueryOptions(user.id));
      return { needsEmailConfirmation: false as const, profile: buildProfile(user, row) };
    },
    meta: { silent: true },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSettled: () => {
      USER_SCOPED_ROOT_KEYS.forEach(queryKey => qc.removeQueries({ queryKey }));
    },
    meta: { successMessage: 'auth.signedOut' },
  });
}
