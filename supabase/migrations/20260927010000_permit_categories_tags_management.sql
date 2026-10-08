-- Migration: Permit categories and tags management
-- Allows full access to categories and tags so Next.js admin endpoints can execute CRUD operations
-- (Application-level security is enforced by /api/categories and /api/tags verifyIsAdmin guards)

DROP POLICY IF EXISTS "Admins have full access to categories" ON categories;
CREATE POLICY "Admins have full access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to tags" ON tags;
CREATE POLICY "Admins have full access to tags" ON tags FOR ALL USING (true) WITH CHECK (true);
