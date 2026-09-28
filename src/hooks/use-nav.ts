'use client';

/**
 * Client-side navigation filtering by application role.
 *
 * Visibility only — this is a UX layer. Anything that changes state must be
 * authorized again on the server (server action / route handler).
 *
 * The application role comes from the database (`users.role`) and is passed
 * down from the dashboard server layout as `appRole` (D27). The Clerk
 * `useAppRole()` helper below is deprecated and kept only for call sites that
 * have not been migrated yet.
 */

import { useUser } from '@clerk/nextjs';
import { useMemo } from 'react';
import type { AppRole, NavGroup, NavItem } from '@/types';

const ROLE_RANK: Record<AppRole, number> = {
  user: 0,
  editor: 1,
  admin: 2
};

/**
 * @deprecated Roles are now resolved server-side from `users.role` and passed
 * to the client as `appRole`. Kept temporarily until every consumer is
 * migrated (task_plan.md §7).
 */
export function useAppRole(): AppRole {
  const { user } = useUser();
  const role = user?.publicMetadata?.role;
  return role === 'admin' || role === 'editor' ? role : 'user';
}

function isVisible(item: NavItem, role: AppRole): boolean {
  if (!item.access?.role) {
    return true;
  }
  return ROLE_RANK[role] >= ROLE_RANK[item.access.role];
}

/**
 * Filter navigation items that the current application role may see.
 */
export function useFilteredNavItems(items: NavItem[], appRole: AppRole) {
  return useMemo(() => {
    return items
      .filter((item) => isVisible(item, appRole))
      .map((item) =>
        item.items?.length
          ? { ...item, items: item.items.filter((child) => isVisible(child, appRole)) }
          : item
      );
  }, [items, appRole]);
}

/**
 * Filter navigation groups that the current application role may see.
 * Groups without visible items are dropped.
 */
export function useFilteredNavGroups(groups: NavGroup[], appRole: AppRole) {
  return useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items
            .filter((item) => isVisible(item, appRole))
            .map((item) =>
              item.items?.length
                ? { ...item, items: item.items.filter((child) => isVisible(child, appRole)) }
                : item
            )
        }))
        .filter((group) => group.items.length > 0),
    [groups, appRole]
  );
}
