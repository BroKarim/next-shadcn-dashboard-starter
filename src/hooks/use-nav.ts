'use client';

/**
 * Client-side navigation filtering by application role.
 *
 * Visibility only — this is a UX layer. Anything that changes state must be
 * authorized again on the server (server action / route handler).
 *
 * Roles are read from the Clerk user's server-controlled `publicMetadata.role`
 * and default to the least-privileged `user` role.
 */

import { useUser } from '@clerk/nextjs';
import { useMemo } from 'react';
import type { AppRole, NavGroup, NavItem } from '@/types';

const ROLE_RANK: Record<AppRole, number> = {
  user: 0,
  editor: 1,
  admin: 2
};

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
export function useFilteredNavItems(items: NavItem[]) {
  const role = useAppRole();

  return useMemo(() => {
    return items
      .filter((item) => isVisible(item, role))
      .map((item) =>
        item.items?.length
          ? { ...item, items: item.items.filter((child) => isVisible(child, role)) }
          : item
      );
  }, [items, role]);
}

/**
 * Filter navigation groups that the current application role may see.
 * Groups without visible items are dropped.
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  const role = useAppRole();

  return useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: group.items
            .filter((item) => isVisible(item, role))
            .map((item) =>
              item.items?.length
                ? { ...item, items: item.items.filter((child) => isVisible(child, role)) }
                : item
            )
        }))
        .filter((group) => group.items.length > 0),
    [groups, role]
  );
}
