# AGENTS.md - AI Coding Agent Reference

This file provides essential information for AI coding agents working on this project. It contains project-specific details, conventions, and guidelines that complement the README.

---

## Project Overview

**Dashboard Tindak Lanjut Temuan BPK USK** is an internal dashboard built on the Next.js 16 App Router with:

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (New York style, Base UI primitives)
- **Authentication**: Clerk (single tenant, application roles)
- **Charts**: Recharts
- **Containerization**: Docker (Node.js & Bun Dockerfiles)
- **Package Manager**: Bun (preferred)

It grew out of the Next.js shadcn dashboard starter; the template demo features (Sentry, AI chat, kanban, messaging, notification center, product catalogue, Clerk Organizations/Billing, command palette, extra themes) have been removed. Product scope and the phased plan live in `task_plan.md` and `context.md` at the repo root.

---

## Technology Stack Details

### Core Framework & Runtime

- Next.js 16.0.10 with App Router
- React 19.2.0
- TypeScript 5.7.2 with strict mode enabled

### Styling & UI

- Tailwind CSS v4 (using `@import 'tailwindcss'` syntax)
- PostCSS with `@tailwindcss/postcss` plugin
- shadcn/ui component library (Base UI primitives)
- CSS custom properties for theming (OKLCH color format)

### State Management

- Nuqs for URL search params state management
- TanStack Form + Zod for form handling (`createFormHook` + shadcn `Field`-anatomy components)

### Data Fetching & Caching

- TanStack React Query for data fetching, caching, and mutations
- Server-side prefetching with `HydrationBoundary` + `dehydrate`
- Client-side `useSuspenseQuery` + nuqs `shallow: true` for tables (no RSC round-trips on pagination/filter)
- `useMutation` + `invalidateQueries` for form submissions
- Query client singleton in `src/lib/query-client.ts`

### Authentication & Authorization

- Clerk for authentication — single tenant (one institution), no Clerk Organizations or Billing
- Application roles: `user` (read everything + write comments) and `admin` (manage users, update `nilaiTemuan`, manage attachments, and reply to comments) — stored in the local `users` table (`users.role`); the database is the source of truth, Clerk only provides identity
- Roles must be enforced server-side (server action / route handler); client-side nav filtering is UX only — see `docs/nav-rbac.md`

### Data & APIs

- TanStack Table for data tables
- TanStack React Query for data fetching and mutations
- Recharts for analytics/charts
- Service layer per feature (`api/types.ts` → `api/service.ts` → `api/queries.ts`)
- Route handlers at `src/app/api/` (for Route Handler or BFF patterns)
- User data is sourced from the local PostgreSQL `users` table through `src/features/users/api/service.ts`; do not add mock user stores or import mock API data from components
- API client utility in `src/lib/api-client.ts` (for fetch-based patterns)

### Development Tools

- oxlint for linting (`.oxlintrc.json`)
- oxfmt for formatting (`.oxfmtrc.json`)
- Husky for git hooks
- lint-staged for pre-commit formatting

---

## Project Structure

```
/src
├── app/                    # Next.js App Router
│   ├── dashboard/         # Protected dashboard shell (Clerk auth.protect())
│   │   ├── overview/      # Dashboard Temuan BPK (KPI, chart, filter, drawer)
│   │   ├── product/       # Product CRUD demo (React Query + nuqs)
│   │   ├── users/         # User/role management (React Query + nuqs)
│   │   └── profile/       # Clerk user profile
│   ├── api/               # Route handlers (users)
│   ├── sign-in/           # Clerk sign-in page
│   ├── sign-up/           # Clerk sign-up page
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Redirects to dashboard (or sign-in)
│   ├── global-error.tsx   # Global error boundary
│   └── not-found.tsx      # 404 page
│
├── components/
│   ├── ui/                # shadcn/ui components (Base UI primitives)
│   ├── layout/            # Layout components (sidebar, header, providers)
│   ├── forms/             # Field components (shadcn TanStack Form anatomy)
│   ├── themes/            # Theme provider, selector + mode toggle
│   ├── kbar/              # Cmd+K command palette
│   ├── icons.tsx          # Icon registry
│   └── ...
│
├── features/              # Feature-based modules
│   ├── overview/          # BPK finding dashboard (dummy data + pure helpers)
│   ├── products/          # Product demo: api layer, table, form
│   ├── users/             # User management (React Query + nuqs)
│   │   ├── api/           # types.ts → service.ts → queries.ts
│   │   ├── components/    # Listing, table, form sheet
│   │   └── schemas/       # Zod schemas
│   └── profile/           # Clerk UserProfile wrapper
│
├── config/                # Configuration files
│   ├── nav-config.ts      # Navigation with RBAC
│   └── ...
│
├── hooks/                 # Custom React hooks
│   ├── use-nav.ts         # Application-role nav filtering
│   ├── use-data-table.ts  # Data table state
│   └── ...
│
├── lib/                   # Utility functions
│   ├── utils.ts           # cn() and formatters
│   ├── searchparams.ts    # Search param utilities
│   └── ...
│
├── types/                 # TypeScript type definitions
│   └── index.ts           # Core types (NavItem, etc.)
│
└── styles/                # Global styles
    ├── globals.css        # Tailwind imports + view transitions
    ├── theme.css          # Theme imports
    └── themes/            # Individual theme files

/docs                      # Documentation
│   ├── clerk_setup.md     # Clerk configuration guide (single tenant)
│   ├── nav-rbac.md        # Navigation access control (application roles)
│   ├── forms.md           # Form system guide
│   ├── themes.md          # Theme customization guide
│   └── deployment.md      # Deploy guide (Vercel, Docker)

Dockerfile                 # Node.js production Dockerfile
Dockerfile.bun             # Bun production Dockerfile
.dockerignore              # Docker build exclusions
```

---

## Build & Development Commands

```bash
# Install dependencies
bun install

# Development server
bun run dev          # Starts at http://localhost:3000

# Build for production
bun run build

# Start production server
bun run start

# Linting (oxlint)
bun run lint         # Run oxlint
bun run lint:fix     # Fix issues and format
bun run lint:strict  # Zero warnings tolerance

bun run typecheck    # tsc --noEmit

# Formatting (oxfmt)
bun run format       # Format the repo
bun run format:check # Check formatting

# Git hooks
bun run prepare      # Install Husky hooks
```

---

## Environment Configuration

Copy `env.example.txt` to `.env.local` and configure:

### Required for Authentication (Clerk)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard/overview"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard/overview"
```

Optional: `WEBHOOK_SECRET` (Clerk webhooks) and `BUILD_STANDALONE=true` when building the Docker images.

## Code Style Guidelines

### TypeScript

- Strict mode enabled
- Use explicit return types for public functions
- Prefer interface over type for object definitions
- Use `@/*` alias for imports from src

### Formatting (oxfmt)

Configured in `.oxfmtrc.json`: single quotes, JSX single quotes, semicolons, no trailing comma, 2-space indent, LF.

### Linting (oxlint)

Configured in `.oxlintrc.json`. Notable rules: `no-console` warns (allows `warn`/`error`), unused vars warn (`_`-prefixed ignored), `react-hooks/exhaustive-deps` warn, plus the jsx-a11y set.

### Component Conventions

- Use function declarations for components: `function ComponentName() {}`
- Props interface named `{ComponentName}Props`
- shadcn/ui components use `cn()` utility for class merging
- Server components by default, `'use client'` only when needed

---

## Theming System

The project ships 10 built-in themes plus light/dark mode:

- `vercel` (default), `claude`, `discord`, `supabase`, `mono`, `notebook`, `light-green`, `zen`, `astro-vista`, `whatsapp`

### Theme Files

- CSS files: `src/styles/themes/{theme-name}.css` (`[data-theme='…']`, OKLCH tokens)
- Theme registry: `src/components/themes/theme.config.ts` (`DEFAULT_THEME`, `THEMES`)
- Fonts: `src/components/themes/font.config.ts` (`next/font` variables per theme)
- Active theme provider: `src/components/themes/active-theme.tsx`
- Theme selector: `src/components/themes/theme-selector.tsx` (header)
- Light/dark toggle: `src/components/themes/theme-mode-toggle.tsx`

### Theme Files

- CSS files: `src/styles/themes/{theme-name}.css`
- Theme registry: `src/components/themes/theme.config.ts`
- Font config: `src/components/themes/font.config.ts`
- Active theme provider: `src/components/themes/active-theme.tsx`

### Adding a New Theme

1. Create `src/styles/themes/your-theme.css` with `[data-theme='your-theme']` selector
2. Import in `src/styles/theme.css`
3. Add to `THEMES` array in `src/components/themes/theme.config.ts`
4. (Optional) Add fonts in `font.config.ts`
5. (Optional) Set as default in `theme.config.ts`

See `docs/themes.md` for detailed theming guide.

---

## Navigation & RBAC System

### Navigation Configuration

Navigation is organized into groups in `src/config/nav-config.ts`:

```typescript
import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        shortcut: ['d', 'd'],
        items: [],
        access: { role: 'admin' } // minimum application role
      }
    ]
  }
];
```

### Access Control Property

- `role: 'user' | 'admin'` — minimum application role required to see the item (`user` < `admin`)

### Client-Side Filtering

The dashboard server layout resolves the role from the database (`getAppRoleWithBootstrap()` in `src/lib/rbac.ts`) and passes `appRole` down to `AppSidebar` and `KBar`; the filtering hooks in `src/hooks/use-nav.ts` use that value to hide items above the current role. This is UX only — actual security checks happen server-side via `requireRole()`.

---

## Authentication Patterns

### Protected Routes

The whole `/dashboard` segment is gated in `src/app/dashboard/layout.tsx`:

```tsx
import { auth } from '@clerk/nextjs/server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Redirects to the sign-in URL when signed out.
  await auth.protect();
  return <>{children}</>;
}
```

### Role Checks (server-side)

Application roles live in the `users.role` column of the local PostgreSQL database (`user` | `admin`). Clerk provides the identity only.

The real implementation lives in `src/lib/rbac.ts` — use it, do not re-implement:

```ts
import { requireRole, requireActorIdentity } from '@/lib/rbac';
import type { AppRole } from '@/types';

// Inside a server action that mutates data:
await requireRole('admin' as AppRole); // throws ForbiddenError when insufficient
const actor = await requireActorIdentity(); // { id: users.id, email, name } for actor snapshots / FK columns
```

- `requireAuth()` → Clerk `userId` (`auth()` does not expose an email).
- `ensureCurrentUser()` lazily creates the `users` row (role `user`, or `admin` for emails in `INITIAL_ADMIN_EMAILS`) and never rewrites an existing role.
- `getAppRoleWithBootstrap()` is the read-side helper used by the dashboard layout.
- Domain errors come from `src/lib/errors.ts`; translate them with `toUserMessage()` for toasts — never leak raw database errors to the UI.

---

## Data Fetching Patterns

### Service Layer Architecture

Each feature has a three-file API layer:

```
src/features/<name>/api/
  types.ts      ← Type contract (response shapes, filters, payloads)
  service.ts    ← Data access functions (the ONE file to swap for your backend)
  queries.ts    ← React Query options + query key factories (stable, never changes)
  mutations.ts  ← Client mutationOptions (invalidate keys) when the feature writes
  actions.ts    ← 'use server' write actions (requireRole + transaction + activity log)
```

**`service.ts` is the only file you modify when connecting to a real backend.** Queries and components import from it — they never change.

Live example (findings feature, PostgreSQL + Drizzle): `src/features/findings/api/` — `service.ts` reads, `actions.ts` server actions, `import-core.ts` the testable transactional core, `queries.ts` + `mutations.ts` for React Query. See `docs/data.md`.

#### Backend Patterns

| Pattern                                            | How to implement                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Server Actions + ORM** (Prisma/Drizzle/Supabase) | Add `'use server'` at top of `service.ts`, call ORM directly                                |
| **Route Handlers + ORM**                           | `service.ts` calls `/api/` routes via `apiClient`, route handlers call ORM                  |
| **BFF** (Next.js proxies to Laravel/Go/etc.)       | `service.ts` calls `/api/` routes via `apiClient`, route handlers proxy to external backend |
| **Direct external API** (frontend-only)            | `service.ts` calls external URL via `fetch()`                                               |
| **Mock** (default)                                 | `service.ts` calls in-memory fake data stores                                               |

Route handlers at `src/app/api/` are ready for patterns 2 and 3. `src/lib/api-client.ts` provides a typed `fetch` wrapper.

### Query Key Factories

Each feature defines a key factory in `queries.ts` for type-safe, hierarchical cache invalidation:

```tsx
export const entityKeys = {
  all: ['entities'] as const,
  list: (filters: EntityFilters) => [...entityKeys.all, 'list', filters] as const,
  detail: (id: number) => [...entityKeys.all, 'detail', id] as const
};

// Usage in queryOptions
queryKey: entityKeys.list(filters);

// Usage in mutations — invalidate all entity queries
queryClient.invalidateQueries({ queryKey: entityKeys.all });
```

### React Query (Default for all new pages)

The project uses TanStack React Query with server-side prefetching and client-side cache management:

1. **Query options** defined in `queries.ts` — shared between server prefetch and client hooks
2. **Server prefetch** using `void queryClient.prefetchQuery()` + `HydrationBoundary` + `dehydrate` — `void` (fire-and-forget) is the standard TanStack pattern for Next.js App Router
3. **Client fetch** using `useSuspenseQuery()` — integrates with React Suspense so prefetched data streams in without showing a loading skeleton on first load
4. **Suspense boundary** wraps the client component — shows a fallback skeleton only on subsequent client-side navigations when cache is empty

```tsx
// Server component: prefetch + dehydrate
const queryClient = getQueryClient();
void queryClient.prefetchQuery(entitiesQueryOptions(filters)); // void, not await

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <Suspense fallback={<Skeleton />}>
      <EntityTable />
    </Suspense>
  </HydrationBoundary>
);

// Client component: useSuspenseQuery (not useQuery)
const { data } = useSuspenseQuery(entitiesQueryOptions(filters));
```

**Why `void` + `useSuspenseQuery`:**

- `void` fires the prefetch without blocking the server component
- `useSuspenseQuery` integrates with React Suspense — the pending query streams in via Next.js streaming SSR
- With `<Suspense fallback={<Skeleton />}>`: skeleton shows immediately while data streams in — this is expected behavior, the skeleton IS the Suspense fallback during streaming
- Without `<Suspense>` wrapper: no skeleton, but the previous page stays visible until data fully resolves (feels like a slow navigation)
- Once data is cached (within `staleTime`), subsequent visits are instant — no skeleton

**Why NOT `useQuery`:**

- `useQuery` doesn't integrate with Suspense — returns `isLoading: true` and you must handle loading state manually
- Hydrated pending queries from `void` prefetch won't prevent the loading state
- Results in skeleton flash even when data is prefetched

### Mutations

Components import service functions for mutations. Use query key factories for invalidation:

```tsx
import { createEntity } from '../api/service';
import { entityKeys } from '../api/queries';

const mutation = useMutation({
  mutationFn: (data) => createEntity(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: entityKeys.all });
    toast.success('Created');
  }
});
```

### URL State Management

Use `nuqs` for search params state:

- `searchParamsCache` (server) — reads params in server components
- `useQueryState` (client) — reads/writes params in client components with `shallow: true`

### Data Tables

Tables use TanStack Table with React Query:

- Query options in `features/*/api/queries.ts`
- Column definitions in `features/*/components/*-tables/columns.tsx`
- Table component in `src/components/ui/table/data-table.tsx`
- Column pinning via `initialState.columnPinning` in `useDataTable`

Exception: the BPK overview table (`features/overview/components/bpk-overview.tsx`) has no backend yet, so it drives `useReactTable` directly from local dummy data (`bpk-overview-data.ts`, pure helpers) with controlled `columnFilters` and no React Query. Migrate it to the service/query layer when the finding API exists. Remember that TanStack's `filterFn: 'auto'` on a `number` column resolves to `inNumberRange` (`[min, max]` tuple) — number columns filtered by a `Select`/`Input` string need an explicit `filterFn`.

---

## Error Handling

### Error Boundaries

- Parallel route `error.tsx` files for specific sections

---

## Testing Strategy

The project uses **Bun's built-in test runner** (`bun run test` → `bun test --conditions=react-server`):

- `src/test-setup.ts` is preloaded via `bunfig.toml` and loads `.env.local`, so DB integration tests can run.
- `--conditions=react-server` makes the `server-only` guard (used by `src/db/client.ts`) resolve to its no-op build outside Next.js.
- Unit tests are colocated next to the code they cover (`*.test.ts`), e.g. `src/features/findings/utils/*.test.ts`.
- `src/features/findings/api/import-core.test.ts` is an **integration test**: it runs the real import transaction against the local database and cleans up after itself (it needs `DATABASE_URL`).

Prefer testing pure helpers (mapping, diffing, parsing, file sniffing) and the transactional core behind server actions; server actions themselves are thin auth wrappers.

Component/E2E coverage (React Testing Library, Playwright) is still open — recommended locations remain `/src/__tests__` and `/e2e`.

---

## Deployment

Canonical guide: [docs/deployment.md](./docs/deployment.md) (Vercel, production environment variables, Docker).

### Vercel (Recommended)

1. Connect repository to Vercel
2. Add environment variables in dashboard
3. Deploy

### Environment Variables for Production

Ensure these are set in your deployment platform:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- All `NEXT_PUBLIC_*` variables for client-side access

### Docker

Production-ready Dockerfiles are included:

- `Dockerfile` — Node.js-based
- `Dockerfile.bun` — Bun-based

Both use `output: 'standalone'` in `next.config.ts`. Pass `NEXT_PUBLIC_*` vars as `--build-arg` at build time, and runtime secrets via `-e` at run time.

### Build Considerations

- Output: `standalone` (optimized for Docker/self-hosting)
- Images: configured for `img.clerk.com` and `clerk.com`

---

## Icon System

**All icons come from a single source: `src/components/icons.tsx`.**

The project uses `@tabler/icons-react` as the sole icon package. Every icon is re-exported through a centralized `Icons` object — **never import directly from `@tabler/icons-react` or any other icon package**.

### Usage

```tsx
import { Icons } from '@/components/icons';

// In JSX
<Icons.search className='h-4 w-4' />
<Icons.chevronRight className='h-4 w-4' />

// Passing as a prop
icon={Icons.check}
```

### Adding a New Icon

1. Import the tabler icon in `src/components/icons.tsx`
2. Add a semantic key to the `Icons` object
3. Use `Icons.yourKey` everywhere — never the raw import

```tsx
// In src/components/icons.tsx
import { IconNewIcon } from '@tabler/icons-react';

export const Icons = {
  // ...existing icons
  newIcon: IconNewIcon
};
```

### Available Icon Categories

| Category        | Example Keys                                                                  |
| --------------- | ----------------------------------------------------------------------------- |
| General         | `check`, `close`, `search`, `settings`, `trash`, `spinner`, `info`, `warning` |
| Navigation      | `chevronDown`, `chevronLeft`, `chevronRight`, `chevronUp`, `chevronsUpDown`   |
| Layout          | `dashboard`, `kanban`, `panelLeft`                                            |
| User            | `user`, `account`, `profile`, `teams`                                         |
| Communication   | `chat`, `notification`, `phone`, `video`, `send`                              |
| Files           | `page`, `post`, `media`, `fileTypePdf`, `fileTypeDoc`                         |
| Actions         | `add`, `edit`, `upload`, `share`, `login`, `logout`                           |
| Theme           | `sun`, `moon`, `brightness`, `laptop`, `palette`                              |
| Text formatting | `bold`, `italic`, `underline`, `text`                                         |
| Data / Charts   | `trendingUp`, `trendingDown`, `eyeOff`, `adjustments`                         |

### Why This Pattern?

- **Single source of truth** — swap icon packages by editing one file
- **Semantic naming** — `Icons.trash` is clearer than `IconTrash` scattered across files
- **Discoverability** — autocomplete on `Icons.` shows every available icon
- **No direct dependencies** — components never couple to a specific icon package

---

## Common Development Tasks

### Adding a New Feature (End-to-End)

1. Create `src/features/<name>/api/types.ts` — response types, filter types, mutation payloads
2. Create `src/features/<name>/api/service.ts` — data access functions (mock by default)
3. Create `src/features/<name>/api/queries.ts` — query key factory + `queryOptions`
4. Create page route: `src/app/dashboard/<name>/page.tsx`
5. Create feature components in `src/features/<name>/components/`
6. Add navigation item in `src/config/nav-config.ts`
7. (Optional) Add route handlers in `src/app/api/<name>/` for REST API patterns
8. (Optional) Register new icon in `src/components/icons.tsx`

### Adding a New API Route

1. Create: `src/app/api/my-route/route.ts`
2. Export HTTP method handlers: `GET`, `POST`, etc.
3. For BFF pattern: proxy requests to your external backend

### Adding a shadcn Component

```bash
npx shadcn add component-name
```

### Adding a New Theme

See "Theming System" section above or `docs/themes.md`.

---

## Troubleshooting

### Common Issues

**Build fails with Tailwind errors**

- Ensure using Tailwind CSS v4 syntax (`@import 'tailwindcss'`)
- Check `postcss.config.js` uses `@tailwindcss/postcss`

**Clerk keyless mode popup**

- Run `npx clerk@latest init` to provision a dev instance in seconds (no account needed)
- It writes keys to `.env.local`; later you can claim application or set env variables

**Theme not applying**

- Check theme name matches in CSS `[data-theme]` and `theme.config.ts`
- Verify theme CSS is imported in `theme.css`

**Navigation items not showing**

- Check the item's `access.role` in `src/config/nav-config.ts`
- Verify the signed-in user's `users.role` row in the database (roles are never read from Clerk metadata)

---

## External Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Clerk Next.js SDK](https://clerk.com/docs/references/nextjs)
- [shadcn/ui](https://ui.shadcn.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [TanStack Table](https://tanstack.com/table/latest)

---

## Notes for AI Agents

1. **Always use `cn()` for className merging** - never concatenate strings manually
2. **Respect the feature-based structure** - put new feature code in `src/features/`
3. **Server components by default** - only add `'use client'` when using browser APIs or React hooks
4. **Type safety first** - avoid `any`, prefer explicit types
5. **Follow existing patterns** - look at similar components before creating new ones
6. **Environment variables** - prefix with `NEXT_PUBLIC_` for client-side access
7. **shadcn components** - don't modify files in `src/components/ui/` directly; extend them instead
8. **Icons** - NEVER import icons directly from `@tabler/icons-react` or any other icon package. All icons must be registered in `src/components/icons.tsx` and imported as `import { Icons } from '@/components/icons'`. To add a new icon: add the tabler import to `icons.tsx`, add a semantic key to the `Icons` object, then use `Icons.keyName` in your component.
9. **Page headers** - Always use `PageContainer` props (`pageTitle`, `pageDescription`, `pageHeaderAction`) for page headers. Never import `<Heading>` manually in pages — `PageContainer` handles that internally.
10. **Forms** - Use `useAppForm` from `@/lib/form` with `form.AppField` rendering the shared field components (`field.TextField`, `field.SelectField`, …) from `@/components/forms/fields`. Each component follows the official shadcn TanStack Form anatomy; drop down to raw `form.Field` render props for one-off custom fields. Never use `useState` inside a render prop — extract stateful controls into components.
11. **Button loading** - Use `<Button isLoading={isPending}>` for loading states. Uses CSS Grid overlap trick for zero layout shift. When `isLoading` is not passed, button behaves as default shadcn. `SubmitButton` in forms handles this automatically via form `isSubmitting` state.
12. **Data layer** - Always go through the service layer: `types.ts` → `service.ts` → `queries.ts`. Components import types from `types.ts`, functions from `service.ts`, query options from `queries.ts`. Never import from `@/constants/mock-api*` directly in components.
