'use client';

/**
 * Client-side navigation filtering by application role.
 *
 * Visibility only — this is a UX layer. Anything that changes state must be
 * authorized again on the server (server action / route handler).
 *
 * The application role comes from the database (`users.role`) and is passed
 * down from the dashboard server layout as `appRole` (D27).
 */

import { useMemo } from 'react';
import type { AppRole, NavGroup, NavItem } from '@/types';

const ROLE_RANK: Record<AppRole, number> = {
  user: 0,
  admin: 1
};

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
