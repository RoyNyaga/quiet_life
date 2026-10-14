-- Migration: Add likes_count column to posts table and fix increment_post_views RPC signature
-- Generated: 2026-10-14

-- 1. Add likes_count column to posts table if it doesn't already exist
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS likes_count BIGINT NOT NULL DEFAULT 0;

-- 2. Backfill existing likes count from post_likes table
UPDATE public.posts p
SET likes_count = COALESCE((
    SELECT COUNT(*) 
    FROM public.post_likes pl 
    WHERE pl.post_id = p.id
), 0);

-- 3. Ensure the likes count trigger function is up to date and definitions are robust
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.posts
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.posts
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on post_likes
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.post_likes;
CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- 4. Fix increment_post_views RPC
-- Drop existing variations so there is no signature ambiguity
DROP FUNCTION IF EXISTS public.increment_post_views(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.increment_post_views(UUID);

CREATE OR REPLACE FUNCTION public.increment_post_views(
    p_post_id UUID,
    p_session_identifier TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    IF p_session_identifier IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.post_views
            WHERE post_id = p_post_id
              AND session_identifier = p_session_identifier
              AND viewed_at > (NOW() - INTERVAL '24 hours')
        ) THEN
            INSERT INTO public.post_views (post_id, user_id, session_identifier)
            VALUES (p_post_id, p_user_id, p_session_identifier);

            UPDATE public.posts
            SET views_count = COALESCE(views_count, 0) + 1
            WHERE id = p_post_id;
        END IF;
    ELSE
        UPDATE public.posts
        SET views_count = COALESCE(views_count, 0) + 1
        WHERE id = p_post_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.increment_post_views(UUID, TEXT, UUID) TO anon, authenticated;

-- 5. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
