-- Migration: Fix Row Level Security policies for categories and tags
-- Ensures admin profiles and service_role can manage categories and tags, and public can read

-- 1. Categories Table Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to categories" ON categories;
CREATE POLICY "Admins have full access to categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR (auth.jwt() ->> 'role') = 'service_role'
);

DROP POLICY IF EXISTS "Public categories are readable by everyone" ON categories;
CREATE POLICY "Public categories are readable by everyone" ON categories FOR SELECT USING (true);

-- 2. Tags Table Policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to tags" ON tags;
CREATE POLICY "Admins have full access to tags" ON tags FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR (auth.jwt() ->> 'role') = 'service_role'
);

DROP POLICY IF EXISTS "Public tags are readable by everyone" ON tags;
CREATE POLICY "Public tags are readable by everyone" ON tags FOR SELECT USING (true);
