import { createClient } from '@/lib/supabase/client';
import { AppError, throwIfError } from '@/lib/query/errors';

export async function fetchUserLikes(userId: string): Promise<string[]> {
  const supabase = createClient();
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId);

  throwIfError(error);
  return (data || []).map((row: { post_id: string }) => row.post_id);
}

export async function togglePostLike({
  postId,
  userId,
  nextLiked,
}: {
  postId: string;
  userId: string;
  nextLiked: boolean;
}): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');
  if (!userId) throw new AppError('notAuthenticated', 'Must be signed in to like an article');

  if (nextLiked) {
    const { error } = await supabase.from('post_likes').insert({
      post_id: postId,
      user_id: userId,
    });
    throwIfError(error);
  } else {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    throwIfError(error);
  }
}
