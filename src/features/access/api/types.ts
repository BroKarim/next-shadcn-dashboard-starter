/** Types for application-role management (Phase 5). */

import type { AppRole } from '@/types';

export type { AppRole };

export interface AppUser {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  role: AppRole;
  createdAt: string;
}

export interface AppUsersPage {
  items: AppUser[];
  total: number;
}
