import { createClient } from '@/lib/supabase/client';
import { AppError, throwIfError } from '@/lib/query/errors';
import type { ReadingList, ReadingListItem, Post } from '@/types/database';

export async function fetchReadingLists(userId: string): Promise<ReadingList[]> {
  const supabase = createClient();
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('reading_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function fetchReadingListItems(userId: string): Promise<ReadingListItem[]> {
  const supabase = createClient();
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('reading_list_items')
    .select('*, reading_lists!inner(user_id)')
    .eq('reading_lists.user_id', userId);

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('reading_list_items')
      .select('*');
    throwIfError(fallbackError);
    return fallbackData ?? [];
  }

  return data ?? [];
}

export async function createReadingList({
  name,
  description,
  is_private = true,
  userId,
}: {
  name: string;
  description?: string | null;
  is_private?: boolean;
  userId: string;
}): Promise<ReadingList> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');
  if (!userId) throw new AppError('notAuthenticated', 'Must be signed in to create a reading list');

  const { data, error } = await supabase
    .from('reading_lists')
    .insert({
      name,
      description: description || null,
      is_private,
      user_id: userId,
    })
    .select()
    .single();

  throwIfError(error);
  return data as ReadingList;
}

export async function updateReadingList({
  id,
  ...patch
}: { id: string } & Partial<ReadingList>): Promise<ReadingList> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  const cleanPatch: Record<string, unknown> = { ...patch };
  delete cleanPatch.item_count;

  const { data, error } = await supabase
    .from('reading_lists')
    .update({ ...cleanPatch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  throwIfError(error);
  return data as ReadingList;
}

export async function deleteReadingList(id: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  const { error } = await supabase.from('reading_lists').delete().eq('id', id);
  throwIfError(error);
}

export async function toggleReadingListItem({
  listId,
  postId,
  isSaved,
}: {
  listId: string;
  postId: string;
  isSaved: boolean;
}): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  if (isSaved) {
    const { error } = await supabase
      .from('reading_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('post_id', postId);
    throwIfError(error);
  } else {
    const { error } = await supabase
      .from('reading_list_items')
      .insert({ list_id: listId, post_id: postId });
    throwIfError(error);
  }
}

export async function removeReadingListItem({
  listId,
  postId,
}: {
  listId: string;
  postId: string;
}): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  const { error } = await supabase
    .from('reading_list_items')
    .delete()
    .eq('list_id', listId)
    .eq('post_id', postId);
  throwIfError(error);
}

export async function fetchReadingListById(id: string): Promise<ReadingList | null> {
  const supabase = createClient();
  if (!supabase || !id) return null;

  const { data, error } = await supabase
    .from('reading_lists')
    .select('*, profiles(*)')
    .eq('id', id)
    .maybeSingle();

  throwIfError(error);
  return (data as ReadingList | null) ?? null;
}

export async function fetchArticlesForReadingList(listId: string): Promise<Post[]> {
  const supabase = createClient();
  if (!supabase || !listId) return [];

  const { data, error } = await supabase
    .from('reading_list_items')
    .select('post_id, created_at, posts(*, categories(*), profiles(*), post_tags(*, tags(*)))')
    .eq('list_id', listId)
    .order('created_at', { ascending: false });

  throwIfError(error);
  if (!data) return [];
  return data
    .map((item: any) => item.posts)
    .filter((p: any): p is Post => Boolean(p));
}
