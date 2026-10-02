# Dashboard Tindak Lanjut Temuan BPK — USK

Internal dashboard for monitoring the follow-up of BPK audit findings at Universitas Syiah Kuala. The official source of data stays in SILAHAP; this app consumes its XLSX exports so leadership, SPI, finance, and work units can track follow-up progress without direct SILAHAP access.

Scope decisions, domain rules, and the phased build plan live in:

- [`context.md`](./context.md) — product context and agreed decisions
- [`task_plan.md`](./task_plan.md) — phased plan and current status

**Current state:** the starter template has been simplified into a single-tenant base — Clerk auth with application roles, no Sentry/AI chat/kanban/messaging/notification center/Organizations/Billing. The product CRUD demo, the Cmd+K command palette, the info sidebar, and the users mock demo have been removed; the Users page now reads the local PostgreSQL user store and is admin-only. `/dashboard/overview` is the **Dashboard Temuan BPK** driven by PostgreSQL + Drizzle (KPI cards, findings-per-year chart, admin activity panel, six filters, paginated table, summary drawer); the finding detail route, XLSX import, attachments, comments and admin actions are implemented and documented in [`task_plan.md`](./task_plan.md) / [`docs/data.md`](./docs/data.md).

## Stack

| Area         | Choice                                                            |
| ------------ | ----------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router), React 19, TypeScript 5.7 (strict)        |
| Styling      | Tailwind CSS v4, shadcn/ui (Base UI primitives), OKLCH theme vars |
| Auth         | Clerk — single tenant, application roles `user`/`admin`           |
| Data         | TanStack Query (SSR prefetch + `useSuspenseQuery`), nuqs, TanStack Table |
| Forms        | TanStack Form + Zod, sonner for feedback                          |
| Charts       | Recharts                                                         |
| Tooling      | oxlint, oxfmt, Husky + lint-staged; Bun as package manager        |

## Getting started

```bash
bun install
cp env.example.txt .env.local
npx clerk@latest init   # provisions a dev Clerk instance and fills the keys
bun run dev             # http://localhost:3000
```

Required env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. Optional: `WEBHOOK_SECRET`, `BUILD_STANDALONE=true` (Docker builds). See [`env.example.txt`](./env.example.txt) and [`docs/clerk_setup.md`](./docs/clerk_setup.md).

## Authentication and roles

- `/dashboard` is protected with `await auth.protect()` in `src/app/dashboard/layout.tsx`.
- Access levels are application roles stored in the local `users.role` column (the database is the source of truth): `user` (read everything + write comments) and `admin` (user management, finding value updates, attachments, and comment replies). Clerk only provides identity.
- Roles must be enforced in every server action / route handler. Client-side navigation filtering (`src/hooks/use-nav.ts`) is UX only — see [`docs/nav-rbac.md`](./docs/nav-rbac.md).

## Scripts

| Command                | What it does                    |
| ---------------------- | ------------------------------- |
| `bun run dev`          | Development server              |
| `bun run build`        | Production build                |
| `bun run start`        | Start the production server     |
| `bun run typecheck`    | `tsc --noEmit`                  |
| `bun run lint`         | oxlint                          |
| `bun run lint:strict`  | oxlint with zero warnings        |
| `bun run format`       | oxfmt                           |
| `bun run format:check` | Format check                    |

## Project structure

```plaintext
src/
├── app/                     # App Router
│   ├── dashboard/           # Protected shell (overview, access, users, profile)
│   ├── sign-in/ sign-up/    # Clerk auth pages
│   └── api/                 # Route handlers (authenticated attachment downloads)
├── components/              # ui/ primitives, layout/, forms/ fields, themes/
├── features/                # Feature modules: api (types → service → queries) + components
├── config/                  # nav-config, data-table
├── hooks/                   # use-data-table, use-nav, …
├── lib/                     # query-client, form, searchparams, utils
└── styles/                  # globals.css, theme.css, themes/*.css
```

Conventions and patterns for adding pages, features, tables, and forms are documented in [`AGENTS.md`](./AGENTS.md) (also readable by AI coding agents):

- [`docs/forms.md`](./docs/forms.md) — form system (TanStack Form + Zod)
- [`docs/nav-rbac.md`](./docs/nav-rbac.md) — navigation access control
- [`docs/themes.md`](./docs/themes.md) — theme tokens and adding a theme
- [`docs/deployment.md`](./docs/deployment.md) — Vercel and Docker deployment

## Deployment

Vercel works out of the box. For self-hosting, `Dockerfile` (Node.js) and `Dockerfile.bun` (Bun) build a `standalone` output; pass `NEXT_PUBLIC_*` variables as build args and secrets at run time. Full guide: [`docs/deployment.md`](./docs/deployment.md).

## Credits and license

Built on the [Next.js shadcn dashboard starter](https://github.com/Kiranism/next-shadcn-dashboard-starter) by Kiran (MIT). See [`LICENSE`](./LICENSE).
