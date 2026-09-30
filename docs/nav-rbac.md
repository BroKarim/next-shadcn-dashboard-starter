# Navigation Access Control (Application Roles)

## Overview

Navigation visibility is filtered client-side by **application role**. One institution, one tenant — there are no Clerk Organizations involved.

**Visibility is UX only, never security.** Anything that changes state must be re-authorized server-side (server action / route handler).

## Roles

| Role     | Meaning                             |
| -------- | ----------------------------------- |
| `user`   | Read-only (default for every user)  |
| `admin`  | Full access, including user/role management |

Roles live in the local `users` table of the PostgreSQL database — the database is the source of truth, not Clerk metadata (task_plan.md D15):

| Column          | Notes                                            |
| --------------- | ------------------------------------------------ |
| `clerk_user_id` | Keys the row against the signed-in Clerk user    |
| `role`          | `user` \| `admin`, default `user`    |

- The row is created lazily by `ensureCurrentUser()` (`src/lib/rbac.ts`) the first time the user performs a mutation; an existing role is never rewritten there.
- `INITIAL_ADMIN_EMAILS` (comma-separated) elevates a user to `admin` only when their row is first created. As a bootstrap exception, the dashboard layout may create the row on first visit for allowlisted emails so the first admin never appears as `user`.
- Only a protected, admin-gated server action (Phase 5) may change a role; a user must never be able to set their own role.

## Files

1. `src/lib/rbac.ts` — `requireAuth()`, `requireRole()`, `getAppRoleWithBootstrap()` (server-side, security boundary)
2. `src/hooks/use-nav.ts` — filters nav items using the `appRole` passed from the dashboard server layout (client-side, instant)
2. `src/types/index.ts` — `AppRole` and `PermissionCheck`
3. `src/config/nav-config.ts` — per-item `access` declarations

## Usage

```typescript
// src/config/nav-config.ts
{
  title: 'Users',
  url: '/dashboard/users',
  icon: 'teams',
  access: { role: 'admin' } // minimum role
}
```

`access.role` is a **minimum**: an `admin` sees items that require `user`. Omit `access` for items everyone should see.

```tsx
// any client component
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { navGroups } from '@/config/nav-config';

const groups = useFilteredNavGroups(navGroups);
```

## Server-side enforcement

Never rely on the nav hiding an item. Authorize every mutation:

```ts
import { requireRole } from '@/lib/rbac';

await requireRole('admin'); // throws ForbiddenError when the role is insufficient
```

Roles come from the local `users.role` column, resolved by `src/lib/rbac.ts` —
never from Clerk `publicMetadata`. See `AGENTS.md` → "Authentication Patterns".

## Adding a new item

1. Add the item to `src/config/nav-config.ts` (with `access.role` when restricted)
2. Guard the page/route and its server actions with the same role check
