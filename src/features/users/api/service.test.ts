import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

const CLERK_USER_ID = 'user_users_service_test';
const ADMIN_EMAIL = 'users-admin@local';
const TARGET_EMAIL = 'users-target@local';
const ADMIN_ID = randomUUID();
const TARGET_ID = randomUUID();

mock.module('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: CLERK_USER_ID }),
  currentUser: async () => ({
    primaryEmailAddress: { emailAddress: ADMIN_EMAIL },
    firstName: 'Users',
    lastName: 'Admin'
  })
}));

const { db } = await import('@/db/client');
const { activities, users } = await import('@/db/schema');
const { setUserRole } = await import('@/features/access/api/service');
const { deleteUser, getUsers } = await import('./service');

beforeAll(async () => {
  await db.delete(activities).where(eq(activities.entityId, TARGET_ID));
  await db.delete(users).where(eq(users.clerkUserId, CLERK_USER_ID));
  await db.delete(users).where(eq(users.email, TARGET_EMAIL));

  await db.insert(users).values([
    {
      id: ADMIN_ID,
      clerkUserId: CLERK_USER_ID,
      email: ADMIN_EMAIL,
      name: 'Users Admin',
      role: 'admin'
    },
    {
      id: TARGET_ID,
      clerkUserId: 'user_users_target_test',
      email: TARGET_EMAIL,
      name: 'Target User',
      role: 'user'
    }
  ]);
});

afterAll(async () => {
  await db.delete(activities).where(eq(activities.entityId, TARGET_ID));
  await db.delete(users).where(eq(users.id, TARGET_ID));
  await db.delete(users).where(eq(users.id, ADMIN_ID));
});

describe('database users service', () => {
  test('lists users from PostgreSQL with search and role filters', async () => {
    const result = await getUsers({ search: 'target', role: 'user' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe(TARGET_ID);
    expect(result.items[0]?.email).toBe(TARGET_EMAIL);
  });

  test('allows an admin to promote a user to admin', async () => {
    const result = await setUserRole(TARGET_ID, 'admin');

    expect(result.updated).toBe(true);
    const [target] = await db.select().from(users).where(eq(users.id, TARGET_ID));
    expect(target?.role).toBe('admin');
  });

  test('deletes a target user and records an audit activity', async () => {
    const result = await deleteUser(TARGET_ID);

    expect(result.deleted).toBe(true);
    const [target] = await db.select().from(users).where(eq(users.id, TARGET_ID));
    expect(target).toBeUndefined();

    const [activity] = await db
      .select()
      .from(activities)
      .where(and(eq(activities.entityId, TARGET_ID), eq(activities.action, 'Hapus Pengguna')));
    expect(activity?.action).toBe('Hapus Pengguna');
    expect(activity?.actorEmail).toBe(ADMIN_EMAIL);
  });

  test('cannot delete the currently signed-in admin', async () => {
    await expect(deleteUser(ADMIN_ID)).rejects.toThrow('Tidak bisa menghapus akun');
  });
});
