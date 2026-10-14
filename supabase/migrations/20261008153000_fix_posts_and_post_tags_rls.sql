-- Migration: 20261008153000_fix_posts_and_post_tags_rls.sql
-- Description: Allow viewing, creating, updating, and deleting posts and post_tags across admin operations

-- 1. Posts Policies
DROP POLICY IF EXISTS "Published posts are readable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Admins have full access to posts" ON public.posts;
DROP POLICY IF EXISTS "Posts are readable by everyone" ON public.posts;
CREATE POLICY "Posts are readable by everyone" ON public.posts
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Permit posts insert" ON public.posts;
CREATE POLICY "Permit posts insert" ON public.posts
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update posts" ON public.posts;
DROP POLICY IF EXISTS "Permit posts update" ON public.posts;
CREATE POLICY "Permit posts update" ON public.posts
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete posts" ON public.posts;
DROP POLICY IF EXISTS "Permit posts delete" ON public.posts;
CREATE POLICY "Permit posts delete" ON public.posts
FOR DELETE USING (true);

-- 2. Post Tags Junction Policies
ALTER TABLE IF EXISTS public.post_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post tags are readable by everyone" ON public.post_tags;
CREATE POLICY "Post tags are readable by everyone" ON public.post_tags
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permit post tags management" ON public.post_tags;
CREATE POLICY "Permit post tags management" ON public.post_tags
FOR ALL USING (true);
