# Supabase production setup

This project uses Supabase as managed PostgreSQL while keeping Clerk as the
authentication provider and Drizzle as the data-access/migration layer.

## Environment variables

Copy `env.example.txt` to `.env.local` and set:

- `DATABASE_URL`: Supabase transaction pooler connection string (port `6543`)
  for the running Next.js application.
- `DATABASE_URL_MIGRATION`: Supabase direct/session connection string (port
  `5432`) for `bun run db:migrate` and other DDL commands.

These variables are server-only. Do not rename either one with a
`NEXT_PUBLIC_` prefix.

The application does not need a Supabase secret/service-role key for database
access. A secret key must never be exposed to browser code. If Supabase
Storage or another Supabase API is added later, it should use a separate
server-only integration with the narrowest key available.

## First deployment

1. Create a Supabase project and copy both connection strings from the
   Connect dialog.
2. Put them in the deployment environment as `DATABASE_URL` and
   `DATABASE_URL_MIGRATION`.
3. Run `bun run db:migrate` once against the empty project.
4. Run `bun run db:seed` only if the demo fixtures are wanted.
5. Set `INITIAL_ADMIN_EMAILS` before the first login if an initial admin is
   needed.

The existing `drizzle/` migrations are the canonical schema history. The
`supabase/config.toml` file is included for optional Supabase CLI workflows;
it does not introduce a second schema or migration history.

## Optional CLI linking

Install the Supabase CLI separately, then link this checkout after the project
exists:

```bash
supabase link --project-ref <PROJECT_REF>
```

Do not commit access tokens, database passwords, or service-role/secret keys.
