import 'server-only';

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { users } from '@/db/schema';
import { UnauthenticatedError, ForbiddenError } from '@/lib/errors';
import type { AppRole } from '@/types';

/**
 * Server-side identity and application-role resolution (task_plan.md §6).
 *
 * `users.role` in the database is the source of truth for the application
 * role — Clerk metadata is no longer consulted (D15). The Clerk user id only
 * keys the row.
 *
 * `auth()` provides the `userId` only; it does not expose an email. Email and
 * name come from `currentUser()` (a Clerk Backend API call) and are therefore
 * only fetched on paths that need to create the row or record the actor.
 *
 * Lazy upsert (D16): the row is created the first time the user performs a
 * mutation, with role `user` — or `admin` when the email is listed in
 * `INITIAL_ADMIN_EMAILS`. An existing row's role is never rewritten here.
 */

const ROLE_RANK: Record<AppRole, number> = {
  user: 0,
  admin: 1
};

function parseInitialAdminEmails(): string[] {
  return (process.env.INITIAL_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

function toAppRole(value: string): AppRole {
  return value === 'admin' ? 'admin' : 'user';
}

export function isInitialAdminEmail(email: string): boolean {
  return parseInitialAdminEmails().includes(email.trim().toLowerCase());
}

/** Throws when there is no signed-in user. Never calls `currentUser()`. */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new UnauthenticatedError();
  }
  return userId;
}

export interface AppRoleInfo {
  role: AppRole;
  exists: boolean;
}

/**
 * Read the application role for the signed-in user.
 * Pure read: no row creation, no `currentUser()` API call (R2-15).
 */
export async function getAppRole(): Promise<AppRoleInfo> {
  const userId = await requireAuth();

  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.clerkUserId, userId));

  if (!row) {
    return { role: 'user', exists: false };
  }
  return { role: toAppRole(row.role), exists: true };
}

/**
 * Insert the current user's row if it does not exist yet (lazy upsert, D16).
 * The role is only decided at creation time; an existing row is returned
 * untouched so roles can never be silently elevated here.
 */
export async function ensureCurrentUser() {
  const userId = await requireAuth();

  const [existing] = await db.select().from(users).where(eq(users.clerkUserId, userId));
  if (existing) {
    return existing;
  }

  // `auth()` has no email — fetch identity only now that a row is needed.
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!clerkUser || !email) {
    throw new UnauthenticatedError('Identitas pengguna tidak lengkap.');
  }

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;
  const role = isInitialAdminEmail(email) ? 'admin' : 'user';

  // Insert-if-missing only; never overwrite the role of an existing row.
  await db
    .insert(users)
    .values({ clerkUserId: userId, email, name, role })
    .onConflictDoNothing({ target: users.clerkUserId });

  const [row] = await db.select().from(users).where(eq(users.clerkUserId, userId));
  if (!row) {
    throw new UnauthenticatedError('Gagal menyiapkan akun pengguna.');
  }
  return row;
}

/**
 * Identity for the actor of a mutation (comments, timeline entries).
 *
 * `id` is the **local `users.id`** (uuid): every FK column that records the
 * actor (`activities.actor_user_id`, `comments.author_user_id`,
 * `attachments.uploaded_by_user_id`, `import_batches.uploaded_by_user_id`)
 * references `users.id`, so the Clerk user id must never be handed to them.
 * `actor_email` / `author_email` snapshots always carry the Clerk email.
 */
export async function requireActorIdentity(): Promise<{
  id: string;
  email: string;
  name: string | null;
}> {
  await requireAuth();
  const row = await ensureCurrentUser();
  return { id: row.id, email: row.email, name: row.name };
}

/**
 * Read-only email for UI affordances (e.g. showing "delete" on own comments).
 * Never creates a row and never calls the Clerk Backend API. Returns `null`
 * when signed out — the dashboard layout owns the redirect.
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const [row] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.clerkUserId, userId));

  return row?.email ?? null;
}

/** Enforce the minimum application role; used by every mutation (D17). */
export async function requireRole(minimum: AppRole): Promise<string> {
  const userId = await requireAuth();

  const first = await getAppRole();
  if (ROLE_RANK[first.role] >= ROLE_RANK[minimum]) {
    return userId;
  }

  // The row may not exist yet (first action of a bootstrap admin) — create it
  // and re-read before deciding.
  await ensureCurrentUser();
  const second = await getAppRole();
  if (ROLE_RANK[second.role] < ROLE_RANK[minimum]) {
    throw new ForbiddenError();
  }
  return userId;
}

/**
 * Application role for server components, with the bootstrap exception (D36):
 * when the user has no row yet AND their Clerk email is listed in
 * `INITIAL_ADMIN_EMAILS`, the row is created immediately so the first admin
 * never appears as `user`. This is the only place a pure read may create a
 * user row, and it is gated by the env allowlist.
 */
export async function getAppRoleWithBootstrap(): Promise<AppRole> {
  // Read-side helper: pages render in parallel with the dashboard layout, which
  // owns the sign-in redirect. Return the lowest role instead of throwing so a
  // signed-out render never logs an UnauthenticatedError.
  const { userId } = await auth();
  if (!userId) {
    return 'user';
  }

  const { role, exists } = await getAppRole();
  if (exists) {
    return role;
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!clerkUser || !email || !isInitialAdminEmail(email)) {
    return role;
  }

  await ensureCurrentUser();
  return (await getAppRole()).role;
}
