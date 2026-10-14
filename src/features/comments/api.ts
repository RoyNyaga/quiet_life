import { createClient } from '@/lib/supabase/client';
import { AppError, throwIfError } from '@/lib/query/errors';
import type { Comment } from '@/types/database';

export async function fetchComments(postId: string): Promise<Comment[]> {
  const supabase = createClient();
  if (!supabase || !postId) return [];

  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(*)')
    .eq('post_id', postId)
    .eq('is_approved', true)
    .order('created_at', { ascending: true });

  throwIfError(error);
  return (data as Comment[]) ?? [];
}

export async function createComment(commentData: Partial<Comment>): Promise<Comment> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  const cleanPayload = {
    post_id: commentData.post_id,
    user_id: commentData.user_id || null,
    guest_name: commentData.guest_name || 'Mindful Guest',
    guest_email: commentData.guest_email || null,
    content: commentData.content,
    parent_id: commentData.parent_id || null,
    is_approved: true,
  };

  const { data, error } = await supabase
    .from('comments')
    .insert(cleanPayload)
    .select('*, profiles(*)')
    .single();

  throwIfError(error);
  return data as Comment;
}

export async function toggleCommentLike({
  commentId,
  userId,
  nextLiked,
}: {
  commentId: string;
  userId?: string | null;
  nextLiked: boolean;
}): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  if (userId) {
    if (nextLiked) {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });
    } else {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId);
    }
  }
}
