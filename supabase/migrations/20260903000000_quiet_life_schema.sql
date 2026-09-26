-- Quiet Life Database Schema Migration
-- Includes ENUMs, localized fields (_en, _fr), RLS policies, RPCs, and Seed Data

-- 1. Create Custom ENUM Types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE subscription_status AS ENUM ('active', 'unsubscribed');

-- 2. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT NULL,
    role user_role NOT NULL DEFAULT 'user',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories Table (Localized)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    description_en TEXT NULL,
    description_fr TEXT NULL,
    icon TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tags Table (Localized)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_fr TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Interests (Category Preferences selected during onboarding)
CREATE TABLE IF NOT EXISTS user_interests (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, category_id)
);

-- 6. Posts Table (Direct Localization Attributes)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status post_status NOT NULL DEFAULT 'draft',
    cover_image_url TEXT NULL,
    read_time_minutes INT DEFAULT 5,
    views_count BIGINT DEFAULT 0,
    published_at TIMESTAMPTZ NULL,
    title_en TEXT NOT NULL,
    title_fr TEXT NULL,
    excerpt_en TEXT NULL,
    excerpt_fr TEXT NULL,
    content_markdown_en TEXT NOT NULL,
    content_markdown_fr TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Post Tags (Junction)
CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- 8. Comments Table (Supports both auth users and unauth guests, plus nested replies)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    guest_name TEXT NULL,
    guest_email TEXT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Post Likes (Auth Users or Guest Sessions)
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NULL,
    session_identifier TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_post_like_user UNIQUE (post_id, user_id),
    CONSTRAINT unique_post_like_session UNIQUE (post_id, session_identifier)
);

-- 10. Comment Likes
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NULL,
    session_identifier TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_comment_like_user UNIQUE (comment_id, user_id),
    CONSTRAINT unique_comment_like_session UNIQUE (comment_id, session_identifier)
);

-- 11. Post Views Analytics (Deduplicated view tracking)
CREATE TABLE IF NOT EXISTS post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    session_identifier TEXT NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Reading Lists
CREATE TABLE IF NOT EXISTS reading_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Reading List Items
CREATE TABLE IF NOT EXISTS reading_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES reading_lists(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_list_item UNIQUE (list_id, post_id)
);

-- 14. Subscriptions (Newsletter Subscribers)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    origin_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    status subscription_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- RPC FUNCTIONS & TRIGGERS
-- -------------------------------------------------------------

-- Increment view count with 24-hour deduplication
CREATE OR REPLACE FUNCTION increment_post_views(p_post_id UUID, p_session_identifier TEXT, p_user_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_recent_view INT;
BEGIN
    SELECT COUNT(*) INTO v_recent_view
    FROM post_views
    WHERE post_id = p_post_id
      AND session_identifier = p_session_identifier
      AND viewed_at > (NOW() - INTERVAL '24 hours');

    IF v_recent_view = 0 THEN
        INSERT INTO post_views (post_id, user_id, session_identifier)
        VALUES (p_post_id, p_user_id, p_session_identifier);

        UPDATE posts
        SET views_count = views_count + 1
        WHERE id = p_post_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Mindful Reader'),
        NEW.raw_user_meta_data->>'avatar_url',
        'user'::user_role
    );
    
    -- Create default "Favorites" reading list for new user
    INSERT INTO public.reading_lists (user_id, name, description)
    VALUES (NEW.id, 'Favorites', 'My saved mindful reads');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Public Read Access
CREATE POLICY "Public categories are readable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Public tags are readable by everyone" ON tags FOR SELECT USING (true);
CREATE POLICY "Published posts are readable by everyone" ON posts FOR SELECT USING (status = 'published' OR (auth.jwt() ->> 'role') = 'service_role');
CREATE POLICY "Approved comments are readable by everyone" ON comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Profiles are readable by everyone" ON profiles FOR SELECT USING (true);

-- User Profiles & Security
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Reading Lists Access
CREATE POLICY "Users can view own reading lists" ON reading_lists FOR SELECT USING (auth.uid() = user_id OR is_private = false);
CREATE POLICY "Users can insert own reading list" ON reading_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reading list" ON reading_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reading list" ON reading_lists FOR DELETE USING (auth.uid() = user_id);

-- Reading List Items Access
CREATE POLICY "Users can manage items in own reading list" ON reading_list_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM reading_lists
            WHERE reading_lists.id = reading_list_items.list_id
              AND reading_lists.user_id = auth.uid()
        )
    );

-- Commenting & Liking Access (Auth & Unauth)
CREATE POLICY "Anyone can create a comment" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert post likes" ON post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert comment likes" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can subscribe to newsletter" ON subscriptions FOR INSERT WITH CHECK (true);

-- Admin Full Access Policies
CREATE POLICY "Admins have full access to posts" ON posts FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to tags" ON tags FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins have full access to subscriptions" ON subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- -------------------------------------------------------------
-- 15. STORAGE BUCKETS (Avatars & Blog Media)
-- -------------------------------------------------------------

-- Create 'avatars' bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create 'blog-images' bucket for cover images & markdown rich text editor uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'blog-images',
    'blog-images',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -------------------------------------------------------------
-- STORAGE POLICIES: AVATARS
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Public avatars are viewable by everyone" ON storage.objects;
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- -------------------------------------------------------------
-- STORAGE POLICIES: BLOG IMAGES (Markdown & Covers)
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Public blog images are viewable by everyone" ON storage.objects;
CREATE POLICY "Public blog images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'blog-images'
    AND (auth.role() = 'authenticated' OR (auth.jwt() ->> 'role') = 'service_role')
);

DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'blog-images'
    AND (auth.role() = 'authenticated' OR (auth.jwt() ->> 'role') = 'service_role')
);

DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'blog-images'
    AND (auth.role() = 'authenticated' OR (auth.jwt() ->> 'role') = 'service_role')
);

-- -------------------------------------------------------------
-- 16. SEED DATA & INITIAL ADMIN SETUP
-- -------------------------------------------------------------

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed Default Categories
INSERT INTO categories (id, slug, name_en, name_fr, description_en, description_fr, icon)
VALUES
    ('c1111111-1111-1111-1111-111111111111', 'mindfulness', 'Mindfulness & Meditation', 'Pleine Conscience & Méditation', 'Cultivate presence, calmness, and mental clarity in your daily routine.', 'Cultivez la présence, le calme et la clarté mentale dans votre quotidien.', 'SelfImprovement'),
    ('c2222222-2222-2222-2222-222222222222', 'wellness', 'Holistic Wellness', 'Bien-être Global', 'Nurture physical, emotional, and spiritual balance for sustainable vitality.', 'Nourrissez l’équilibre physique, émotionnel et spirituel pour une vitalité durable.', 'Spa'),
    ('c3333333-3333-3333-3333-333333333333', 'personal-growth', 'Personal Development', 'Développement Personnel', 'Unlock potential, build resilient habits, and design a purposeful life.', 'Libérez votre potentiel, créez des habitudes résilientes et façonnez une vie pleine de sens.', 'Psychology'),
    ('c4444444-4444-4444-4444-444444444444', 'motivation', 'Motivation & Purpose', 'Motivation & Intention', 'Ignite inner drive, overcome burnout, and stay grounded in goals.', 'Rallumez votre élan intérieur, surmontez le surmenage et restez ancré.', 'Bolt'),
    ('c5555555-5555-5555-5555-555555555555', 'healthy-living', 'Healthy Living', 'Vie Saine & Alimentation', 'Nourishing recipes, restorative sleep, and energizing daily rituals.', 'Recettes nourrissantes, sommeil réparateur et rituels quotidiens vivifiants.', 'EmojiFoodBeverage')
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_fr = EXCLUDED.name_fr,
    description_en = EXCLUDED.description_en,
    description_fr = EXCLUDED.description_fr,
    icon = EXCLUDED.icon;

-- Seed Default Tags
INSERT INTO tags (id, slug, name_en, name_fr)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'morning-routine', 'Morning Rituals', 'Rituels du Matin'),
    ('b2222222-2222-2222-2222-222222222222', 'inner-peace', 'Inner Peace', 'Paix Intérieure'),
    ('b3333333-3333-3333-3333-333333333333', 'habit-building', 'Habits', 'Habitudes'),
    ('b4444444-4444-4444-4444-444444444444', 'stress-relief', 'Stress Relief', 'Gestion du Stress'),
    ('b5555555-5555-5555-5555-555555555555', 'mindful-eating', 'Nutrition', 'Alimentation Consciente')
ON CONFLICT (slug) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_fr = EXCLUDED.name_fr;

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Insert Admin User: nyagaandreroy@gmail.com / 123456
DO $$
DECLARE
    v_admin_id UUID;
BEGIN
    PERFORM set_config('search_path', 'public, extensions, auth', true);

    -- Check if user already exists in auth.users
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'nyagaandreroy@gmail.com';

    IF v_admin_id IS NULL THEN
        v_admin_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_admin_id,
            'authenticated',
            'authenticated',
            'nyagaandreroy@gmail.com',
            extensions.crypt('123456', extensions.gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Andre Roy Nyaga"}'::jsonb,
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
    ELSE
        -- Update password and ensure email confirmed if user exists
        UPDATE auth.users
        SET encrypted_password = extensions.crypt('123456', extensions.gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            updated_at = NOW()
        WHERE id = v_admin_id;
    END IF;

    -- Ensure profile exists with role 'admin'
    INSERT INTO public.profiles (id, full_name, avatar_url, role, onboarding_completed, created_at, updated_at)
    VALUES (
        v_admin_id,
        'Andre Roy Nyaga',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        'admin',
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        full_name = EXCLUDED.full_name,
        onboarding_completed = TRUE,
        updated_at = NOW();

    -- Ensure default Favorites reading list exists
    INSERT INTO public.reading_lists (user_id, name, description)
    VALUES (v_admin_id, 'Favorites', 'My saved mindful reads')
    ON CONFLICT DO NOTHING;
END $$;


