import { createClient } from '@/lib/supabase/client';
import { AppError, throwIfError } from '@/lib/query/errors';
import type { Profile } from '@/types/database';

export async function fetchProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  throwIfError(error);
  return (data as Profile[]) ?? [];
}

export async function updateProfile({
  id,
  ...patch
}: { id: string } & Partial<Profile>): Promise<Profile> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  const cleanPatch: Record<string, unknown> = { ...patch };
  delete cleanPatch.id;
  delete cleanPatch.created_at;

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...cleanPatch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  return data as Profile;
}

export async function updateUserRole({
  id,
  role,
}: {
  id: string;
  role: 'admin' | 'user';
}): Promise<Profile> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  const { data, error } = await supabase
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  return data as Profile;
}
