import { NavGroup } from '@/types';

/**
 * Navigation configuration
 *
 * This configuration is used for both the sidebar navigation and the Cmd+K bar.
 *
 * Access control:
 * An item can carry an `access` property with the minimum application role
 * required to see it (`user` < `admin`). This only hides items in
 * the UI — every mutation must still be authorized server-side.
 *
 * Example:
 *    access: { role: 'admin' }
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
      {
        title: 'Product',
        url: '/dashboard/product',
        icon: 'product',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      },
      {
        title: 'Akses & Peran',
        url: '/dashboard/access',
        icon: 'account',
        shortcut: ['a', 'a'],
        isActive: false,
        items: [],
        // Admin-only: the sidebar/KBar hide it for other roles (UX), and the
        // page + server actions enforce the same rule server-side.
        access: { role: 'admin' }
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: 'Account',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: 'Profile',
            url: '/dashboard/profile',
            icon: 'profile',
            shortcut: ['m', 'm']
          }
        ]
      }
    ]
  }
];
