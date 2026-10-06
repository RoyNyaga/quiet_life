<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Database Operations & Migrations Rule

Whenever performing any database operation, schema update, table modification, or Row-Level Security (RLS) policy change:
1. **Always write a migration file**: Create a timestamped SQL migration in `supabase/migrations/` (format: `YYYYMMDDHHMMSS_<name>.sql`).
2. **Sync the migration**: Sync it to the database via Supabase CLI (`npx supabase db push`) or the project migration sync process.
3. **Never make untracked schema changes**: Never rely on uncommitted ad-hoc SQL without a corresponding migration file in `supabase/migrations/`.
4. **Keep TypeScript types in sync**: Update `src/types/database.ts` whenever table structures or columns change.
