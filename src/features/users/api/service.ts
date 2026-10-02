'use server';

import { and, asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';

import { activities, users } from '@/db/schema';
import { db } from '@/db/client';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { requireActorIdentity, requireRole } from '@/lib/rbac';
import type { AppRole } from '@/types';
import type { UserFilters, UsersResponse } from './types';

const MAX_PER_PAGE = 100;
const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toAppRole(value: string): AppRole {
  return value === 'admin' ? 'admin' : 'user';
}

function toUserDTO(row: typeof users.$inferSelect) {
  return {
    id: row.id,
    clerkUserId: row.clerkUserId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    name: row.name,
    role: toAppRole(row.role),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function normalizePagination(filters: UserFilters): {
  page: number;
  perPage: number;
  offset: number;
} {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(Math.max(1, filters.perPage ?? 10), MAX_PER_PAGE);
  return { page, perPage, offset: (page - 1) * perPage };
}

type UserSortColumn =
  | typeof users.email
  | typeof users.name
  | typeof users.firstName
  | typeof users.lastName
  | typeof users.role
  | typeof users.createdAt
  | typeof users.updatedAt;

function parseSort(sort: string | undefined): {
  column: UserSortColumn;
  descending: boolean;
} {
  const fallback = { column: users.email, descending: false };
  if (!sort) return fallback;

  try {
    const [item] = JSON.parse(sort) as { id?: string; desc?: boolean }[];
    const columns: Record<string, UserSortColumn> = {
      email: users.email,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    };
    const column = item?.id ? columns[item.id] : undefined;
    return column ? { column, descending: item?.desc === true } : fallback;
  } catch {
    return fallback;
  }
}

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  await requireRole('admin');

  const { page, perPage, offset } = normalizePagination(filters);
  const conditions: SQL[] = [];

  if (filters.search?.trim()) {
    const needle = `%${filters.search.trim()}%`;
    const searchCondition = or(
      ilike(users.email, needle),
      ilike(users.name, needle),
      ilike(users.firstName, needle),
      ilike(users.lastName, needle)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }
  if (filters.role) {
    conditions.push(eq(users.role, filters.role));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(users).where(where);
  const order = parseSort(filters.sort);
  const rows = await db
    .select()
    .from(users)
    .where(where)
    .orderBy(order.descending ? desc(order.column) : asc(order.column))
    .limit(perPage)
    .offset(offset);

  return {
    items: rows.map(toUserDTO),
    total: Number(total),
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(Number(total) / perPage))
  };
}

/** Delete only the local application row; Clerk identity is managed separately. */
export async function deleteUser(userId: string): Promise<{ deleted: boolean }> {
  await requireRole('admin');
  const actor = await requireActorIdentity();

  if (!USER_ID_PATTERN.test(userId)) {
    throw new ValidationError('ID pengguna tidak valid.');
  }
  if (actor.id === userId) {
    throw new ValidationError('Tidak bisa menghapus akun admin yang sedang digunakan.');
  }

  return db.transaction(async (tx) => {
    const [target] = await tx.select().from(users).where(eq(users.id, userId));
    if (!target) {
      throw new NotFoundError('Pengguna tidak ditemukan.');
    }

    await tx.insert(activities).values({
      entityType: 'user',
      entityId: target.id,
      action: 'Hapus Pengguna',
      metadata: { email: target.email },
      actorUserId: actor.id,
      actorEmail: actor.email
    });

    await tx.delete(users).where(eq(users.id, target.id));
    return { deleted: true };
  });
}
