import { config } from 'dotenv';

// The Drizzle Kit CLI does not read `.env.local` on its own, so load it
// explicitly here (task_plan.md §8). Runtime Next.js and `bun run` load
// `.env.local` themselves; the CLI must not depend on a duplicate `.env`.
config({ path: '.env.local' });

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    // Use Supabase's direct/session connection for DDL when provided. The
    // transaction pooler remains the runtime default for the app.
    url: process.env.DATABASE_URL_MIGRATION ?? process.env.DATABASE_URL ?? ''
  }
});
