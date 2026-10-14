-- Migration: 20261008151500_fix_reading_lists_and_profiles_rls.sql
-- Description: Allow all user types (admin and readers) to manage reading lists and profiles

-- 1. Ensure public profiles table allows insertion and flexible user management
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

DROP POLICY IF EXISTS "Anyone can insert profiles" ON public.profiles;
CREATE POLICY "Anyone can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
CREATE POLICY "Profiles are readable by everyone" ON public.profiles
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can update profiles" ON public.profiles;
CREATE POLICY "Anyone can update profiles" ON public.profiles
FOR UPDATE USING (true);

-- 2. Reading Lists Policies: allow all user types to view, create, update, and delete reading lists
DROP POLICY IF EXISTS "Users can view own reading lists" ON public.reading_lists;
DROP POLICY IF EXISTS "Public reading lists are viewable by everyone" ON public.reading_lists;
DROP POLICY IF EXISTS "Reading lists are viewable by everyone or owner" ON public.reading_lists;
CREATE POLICY "Reading lists are viewable by everyone or owner" ON public.reading_lists
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own reading list" ON public.reading_lists;
DROP POLICY IF EXISTS "Anyone can insert reading list" ON public.reading_lists;
CREATE POLICY "Anyone can insert reading list" ON public.reading_lists
FOR INSERT WITH CHECK (user_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own reading list" ON public.reading_lists;
DROP POLICY IF EXISTS "Anyone can update reading list" ON public.reading_lists;
CREATE POLICY "Anyone can update reading list" ON public.reading_lists
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own reading list" ON public.reading_lists;
DROP POLICY IF EXISTS "Anyone can delete reading list" ON public.reading_lists;
CREATE POLICY "Anyone can delete reading list" ON public.reading_lists
FOR DELETE USING (true);

-- 3. Reading List Items Policies: allow managing items in reading lists
DROP POLICY IF EXISTS "Users can manage items in own reading list" ON public.reading_list_items;
DROP POLICY IF EXISTS "Anyone can manage reading list items" ON public.reading_list_items;
CREATE POLICY "Anyone can manage reading list items" ON public.reading_list_items
FOR ALL USING (true);
