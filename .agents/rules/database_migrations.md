# Database Operations & Migrations Rule

Whenever performing any database operation, schema update, table modification, or Row-Level Security (RLS) policy change:

1. **Always Write a Migration File**:
   - Create a new migration file inside `supabase/migrations/`.
   - Use the timestamp naming convention: `YYYYMMDDHHMMSS_<descriptive_name>.sql` (e.g. `20260927000000_fix_categories_tags_rls.sql`).
   - Write clear, idempotent SQL (e.g., using `IF EXISTS`, `IF NOT EXISTS`, or `OR REPLACE`).

2. **Sync the Migration**:
   - After writing the migration file, sync it to the database using the Supabase CLI (`npx supabase db push` or appropriate migration command).
   - If running in an environment where direct remote push requires login tokens or credentials, provide the exact sync command or migration SQL instructions.

3. **Never Make Ad-hoc Schema Changes**:
   - Do not bypass migrations by suggesting untracked manual edits without also committing the corresponding `.sql` migration file to `supabase/migrations/`.

4. **Keep TypeScript Definitions in Sync**:
   - Whenever table columns, enums, or relationships are altered in a migration, update `src/types/database.ts` accordingly.
