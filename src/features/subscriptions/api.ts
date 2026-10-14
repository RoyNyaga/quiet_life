import { createClient } from '@/lib/supabase/client';
import { AppError, throwIfError } from '@/lib/query/errors';
import type { Subscription } from '@/types/database';

export async function fetchSubscriptions(): Promise<Subscription[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function createSubscription({
  email,
  origin_post_id,
}: {
  email: string;
  origin_post_id?: string | null;
}): Promise<Subscription> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      email: email.trim().toLowerCase(),
      origin_post_id: origin_post_id || null,
      status: 'active',
    })
    .select()
    .single();

  throwIfError(error);
  return data as Subscription;
}
