import type { AppRole } from '@/types';

export type { AppRole };

export interface User {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  page?: number;
  perPage?: number;
  search?: string;
  role?: AppRole;
  sort?: string;
}

export interface UsersResponse {
  items: User[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}
