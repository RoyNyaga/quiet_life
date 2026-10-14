import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AppError, throwIfError } from '@/lib/query/errors';
import type { Profile } from '@/types/database';

function requireClient() {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase is not configured');
  return supabase;
}

/** Fetch the profile row for a user (null if not created yet). */
export async function fetchProfileRow(userId: string): Promise<Profile | null> {
  const supabase = requireClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  throwIfError(error);
  return (data as Profile | null) ?? null;
}

/** Merge the auth user and its profile row into the app's Profile shape. */
export function buildProfile(authUser: User, row: Profile | null): Profile {
  return {
    id: authUser.id,
    full_name: row?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Reader',
    avatar_url: row?.avatar_url || authUser.user_metadata?.avatar_url || null,
    role: row?.role === 'admin' ? 'admin' : 'user',
    onboarding_completed: row?.onboarding_completed ?? true,
    created_at: row?.created_at || authUser.created_at,
    updated_at: row?.updated_at || authUser.updated_at || authUser.created_at,
  };
}

export interface SignInInput {
  email: string;
  password: string;
}

export async function signIn({ email, password }: SignInInput) {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  throwIfError(error);
  if (!data.user) throw new AppError('generic', 'No user returned from sign in');
  return data;
}

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  avatarUrl?: string | null;
}

export async function signUp({ email, password, fullName, avatarUrl }: SignUpInput) {
  const supabase = requireClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim() || 'Mindful Reader',
        avatar_url: avatarUrl || null,
      },
    },
  });
  throwIfError(error);
  return data;
}

export async function signOut() {
  const supabase = requireClient();
  const { error } = await supabase.auth.signOut();
  throwIfError(error);
}
