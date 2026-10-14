-- Migration: Secure post_likes table, enforce authenticated user likes, and auto-sync post likes count
-- Generated: 2026-10-13

-- 1. Ensure RLS is active on post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy / overly-permissive policies
DROP POLICY IF EXISTS "Anyone can insert post likes" ON post_likes;
DROP POLICY IF EXISTS "Public can view post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can insert their own post likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete their own post likes" ON post_likes;

-- 3. Create strict RLS policies
-- Anyone can view post likes (useful for checking counts or if needed)
CREATE POLICY "Public can view post likes" 
ON post_likes 
FOR SELECT 
USING (true);

-- Authenticated users can only like as themselves
CREATE POLICY "Users can insert their own post likes" 
ON post_likes 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can only remove their own likes
CREATE POLICY "Users can delete their own post likes" 
ON post_likes 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Trigger Function to automatically keep posts.likes_count in sync
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE posts
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE posts
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to post_likes table
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();
