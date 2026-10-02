'use server';

/**
 * Access management (task_plan.md Phase 5): list application users and change
 * their role. Admin-only — `requireRole('admin')` runs on the server for both
 * functions, never trusting the UI.
 */

import { asc, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { activities, users } from '@/db/schema';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { requireActorIdentity, requireRole } from '@/lib/rbac';
import type { AppRole } from '@/types';
import type { AppUser, AppUsersPage } from './types';

function toAppRole(value: string): AppRole {
  return value === 'admin' ? 'admin' : 'user';
}

function toAppUser(row: typeof users.$inferSelect): AppUser {
  return {
    id: row.id,
    clerkUserId: row.clerkUserId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    name: row.name,
    role: toAppRole(row.role),
    createdAt: row.createdAt.toISOString()
  };
}

export async function listAppUsers(): Promise<AppUsersPage> {
  await requireRole('admin');

  const rows = await db.select().from(users).orderBy(asc(users.email));

  return { items: rows.map(toAppUser), total: rows.length };
}

/**
 * Change a user's application role. The actor cannot demote themselves — that
 * is the classic way to lock everyone out of the admin area.
 */
export async function setUserRole(userId: string, role: AppRole): Promise<{ updated: boolean }> {
  await requireRole('admin');
  const actor = await requireActorIdentity();

  if (!['user', 'admin'].includes(role)) {
    throw new ValidationError('Role tidak dikenal.');
  }

  return db.transaction(async (tx) => {
    const [target] = await tx.select().from(users).where(eq(users.id, userId));
    if (!target) {
      throw new NotFoundError('Pengguna tidak ditemukan.');
    }

    const previousRole = toAppRole(target.role);
    if (target.id === actor.id && role !== 'admin') {
      throw new ValidationError('Tidak bisa menurunkan role akun Anda sendiri.');
    }
    if (previousRole === role) {
      return { updated: false };
    }

    await tx.update(users).set({ role }).where(eq(users.id, userId));

    // `users` is the role source of truth (D15); the change is audited here.
    await tx.insert(activities).values({
      entityType: 'user',
      entityId: target.id,
      action: 'Perbarui Peran Pengguna',
      metadata: { email: target.email, from: previousRole, to: role },
      actorUserId: actor.id,
      actorEmail: actor.email
    });

    return { updated: true };
  });
}
