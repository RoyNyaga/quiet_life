-- Migration: 20261008143000_ensure_storage_buckets_and_policies.sql
-- Description: Create blog-images and avatars storage buckets and set permissive RLS policies for uploads

-- 1. Ensure 'blog-images' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'blog-images',
    'blog-images',
    true,
    15728640, -- 15 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Ensure 'avatars' bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Storage policies for 'blog-images'
DROP POLICY IF EXISTS "Public blog images are viewable by everyone" ON storage.objects;
CREATE POLICY "Public blog images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload blog images" ON storage.objects;
CREATE POLICY "Anyone can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update blog images" ON storage.objects;
CREATE POLICY "Anyone can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete blog images" ON storage.objects;
CREATE POLICY "Anyone can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images');

-- 4. Storage policies for 'avatars'
DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
CREATE POLICY "Anyone can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;
CREATE POLICY "Anyone can update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete avatars" ON storage.objects;
CREATE POLICY "Anyone can delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');
