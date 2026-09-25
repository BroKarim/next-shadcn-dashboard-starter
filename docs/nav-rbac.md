# Navigation Access Control (Application Roles)

## Overview

Navigation visibility is filtered client-side by **application role**. One institution, one tenant — there are no Clerk Organizations involved.

**Visibility is UX only, never security.** Anything that changes state must be re-authorized server-side (server action / route handler).

## Roles

| Role     | Meaning                             |
| -------- | ----------------------------------- |
| `user`   | Read-only (default for every user)  |
| `editor` | May edit operational finding data   |
| `admin`  | Full access, including user/role management |

Roles are stored in Clerk's server-controlled user metadata:

```json
{ "publicMetadata": { "role": "editor" } }
```

Only the backend (Clerk Dashboard or a protected server action) may write this field — a user must never be able to set their own role.

## Files

1. `src/hooks/use-nav.ts` — reads the role and filters nav items (client-side, instant)
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

`access.role` is a **minimum**: an `admin` sees items that require `editor` or `user`. Omit `access` for items everyone should see.

```tsx
// any client component
import { useFilteredNavGroups } from '@/hooks/use-nav';
import { navGroups } from '@/config/nav-config';

const groups = useFilteredNavGroups(navGroups);
```

## Server-side enforcement

Never rely on the nav hiding an item. Authorize every mutation:

```tsx
const { userId } = await auth();
if (!userId) redirect('/sign-in');

const user = await currentUser();
const role = user?.publicMetadata?.role === 'admin' ? 'admin' : 'user';
if (role !== 'admin') throw new Error('Forbidden');
```

See `AGENTS.md` → "Authentication Patterns" for a reusable `requireRole()` helper.

## Adding a new item

1. Add the item to `src/config/nav-config.ts` (with `access.role` when restricted)
2. Guard the page/route and its server actions with the same role check
