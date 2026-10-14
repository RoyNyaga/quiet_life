import { createClient } from '@/lib/supabase/client';
import { AppError, throwIfError } from '@/lib/query/errors';
import type { Post } from '@/types/database';

export async function fetchPublishedPosts(): Promise<Post[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('*, categories(*), profiles(*), post_tags(*, tags(*))')
    .order('created_at', { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('posts')
    .select('*, categories(*), profiles(*), post_tags(*, tags(*))')
    .eq('slug', slug)
    .maybeSingle();

  throwIfError(error);
  return (data as Post | null) ?? null;
}

export async function fetchAdminPosts(): Promise<Post[]> {
  const supabase = createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('*, categories(*), profiles(*), post_tags(*, tags(*))')
    .order('created_at', { ascending: false });

  throwIfError(error);
  return data ?? [];
}

export async function createPost(postData: Partial<Post>): Promise<Post> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  const { data: sessionData } = await supabase.auth.getSession();
  const authorId = sessionData.session?.user?.id || '22388a63-3518-45cd-b195-5fb7cdb0f871';

  const cleanPayload = {
    slug: postData.slug || `article-${Date.now()}`,
    slug_source_locale: postData.slug_source_locale || 'en',
    category_id: postData.category_id || null,
    author_id: authorId,
    status: postData.status || 'published',
    cover_image_url: postData.cover_image_url || null,
    read_time_minutes: postData.read_time_minutes || 5,
    views_count: 0,
    title_en: postData.title_en || 'Untitled Article',
    title_fr: postData.title_fr || '',
    excerpt_en: postData.excerpt_en || '',
    excerpt_fr: postData.excerpt_fr || '',
    content_markdown_en: postData.content_markdown_en || '',
    content_markdown_fr: postData.content_markdown_fr || '',
    published_at: postData.published_at || (postData.status === 'published' ? new Date().toISOString() : null),
  };

  const { data, error } = await supabase
    .from('posts')
    .insert(cleanPayload)
    .select('*, categories(*), profiles(*)')
    .single();

  throwIfError(error);

  if (data && postData.post_tags && postData.post_tags.length > 0) {
    const tagRows = postData.post_tags
      .map(pt => pt.tags?.id)
      .filter(Boolean)
      .map(tagId => ({ post_id: data.id, tag_id: tagId }));
    if (tagRows.length > 0) {
      await supabase.from('post_tags').insert(tagRows);
    }
  }

  return data as Post;
}

export async function updatePost({ id, ...patch }: { id: string } & Partial<Post>): Promise<Post> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');

  const cleanFields: Record<string, unknown> = { ...patch };
  delete cleanFields.categories;
  delete cleanFields.profiles;
  delete cleanFields.post_tags;
  delete cleanFields.user_has_liked;
  delete cleanFields.likes_count;

  const { data, error } = await supabase
    .from('posts')
    .update({ ...cleanFields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, categories(*), profiles(*)')
    .single();

  throwIfError(error);

  if (patch.post_tags !== undefined) {
    await supabase.from('post_tags').delete().eq('post_id', id);
    const tagRows = patch.post_tags
      .map(pt => pt.tags?.id)
      .filter(Boolean)
      .map(tagId => ({ post_id: id, tag_id: tagId }));
    if (tagRows.length > 0) {
      await supabase.from('post_tags').insert(tagRows);
    }
  }

  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new AppError('network', 'Supabase not configured');
  const { error } = await supabase.from('posts').delete().eq('id', id);
  throwIfError(error);
}

export async function incrementPostViews(postId: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  try {
    await supabase.rpc('increment_post_views', { p_post_id: postId });
  } catch {
    // Non-fatal if rpc doesn't exist yet
  }
}
