-- Migration: 20261008160000_fix_auth_signup_trigger.sql
-- Description: Fix handle_new_user trigger on auth.users to prevent "Database error saving new user"

-- 1. Ensure public.user_role exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('user', 'admin');
    END IF;
END $$;

-- 2. Ensure profiles table accepts all new signups safely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_role public.user_role;
BEGIN
    -- Determine role based on email or metadata
    IF LOWER(COALESCE(NEW.email, '')) = 'nyagaandreroy@gmail.com' OR (NEW.raw_user_meta_data->>'role') = 'admin' THEN
        v_role := 'admin'::public.user_role;
    ELSE
        v_role := 'user'::public.user_role;
    END IF;

    -- Upsert profile record
    INSERT INTO public.profiles (
        id,
        full_name,
        avatar_url,
        role,
        onboarding_completed,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'Mindful Reader'),
        NEW.raw_user_meta_data->>'avatar_url',
        v_role,
        TRUE,
        COALESCE(NEW.created_at, NOW()),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(NULLIF(TRIM(EXCLUDED.full_name), ''), public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        role = EXCLUDED.role,
        updated_at = NOW();

    -- Create default "Favorites" reading list safely
    IF NOT EXISTS (SELECT 1 FROM public.reading_lists WHERE user_id = NEW.id AND name = 'Favorites') THEN
        INSERT INTO public.reading_lists (id, user_id, name, description, is_private)
        VALUES (
            gen_random_uuid(),
            NEW.id,
            'Favorites',
            'My saved mindful reads',
            TRUE
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Catch any unforeseen errors to prevent signup transaction abort (500 Database error saving new user)
        RAISE WARNING 'public.handle_new_user error for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- 3. Re-bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
