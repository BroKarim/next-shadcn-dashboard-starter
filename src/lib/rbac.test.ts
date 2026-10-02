/**
 * Integration test for actor identity resolution.
 *
 * Regression lock for the browser-verification bug where every write failed
 * with `invalid input syntax for type uuid: "user_..."`: the FK columns
 * (`activities.actor_user_id`, `comments.author_user_id`,
 * `attachments.uploaded_by_user_id`, `import_batches.uploaded_by_user_id`)
 * reference `users.id`, so the actor identity handed to the database must be
 * the local uuid — never the Clerk user id.
 *
 * Clerk is mocked so no session is needed; the database is the real local one.
 */

import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { eq, inArray } from 'drizzle-orm';

const CLERK_USER_ID = 'user_test_clerk_actor_id';
const EMAIL = 'rbac-actor-test@local';

mock.module('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: CLERK_USER_ID }),
  currentUser: async () => ({
    primaryEmailAddress: { emailAddress: EMAIL },
    firstName: 'Aktor',
    lastName: 'Uji'
  })
}));

const { db } = await import('@/db/client');
const { activities, attachments, comments, findings, users } = await import('@/db/schema');
const { requireActorIdentity } = await import('./rbac');

const TEST_SATKER = 'TSTACTOR';
const entityIds: string[] = [];

async function cleanup() {
  if (entityIds.length > 0) {
    await db.delete(activities).where(inArray(activities.entityId, entityIds));
  }
  // Comments and attachments cascade from the finding.
  await db.delete(findings).where(eq(findings.noSatker, TEST_SATKER));
  await db.delete(users).where(eq(users.clerkUserId, CLERK_USER_ID));
}

beforeAll(cleanup);
afterAll(cleanup);

describe('requireActorIdentity', () => {
  test('returns the local users.id (uuid), not the Clerk user id', async () => {
    const actor = await requireActorIdentity();

    const [row] = await db.select().from(users).where(eq(users.clerkUserId, CLERK_USER_ID));
    expect(row).toBeDefined();
    expect(actor.id).toBe(row!.id);
    expect(actor.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(actor.email).toBe(EMAIL);
    expect((actor as { userId?: unknown }).userId).toBeUndefined();
  });

  test('the returned id is accepted by a uuid FK column', async () => {
    const actor = await requireActorIdentity();
    const entityId = randomUUID();
    entityIds.push(entityId);

    await db.insert(activities).values({
      entityType: 'finding',
      entityId,
      action: 'Tambah Temuan',
      metadata: { source: 'rbac-test' },
      actorUserId: actor.id,
      actorEmail: actor.email
    });

    const [row] = await db.select().from(activities).where(eq(activities.entityId, entityId));
    expect(row?.actorUserId).toBe(actor.id);
  });

  /**
   * Reproduces the browser-verification failures verbatim: creating a comment
   * and uploading an attachment both insert the actor into a uuid FK column.
   */
  test('the returned id is accepted by comments.author_user_id and attachments.uploaded_by_user_id', async () => {
    const actor = await requireActorIdentity();

    const [finding] = await db
      .insert(findings)
      .values({
        kodeDisplay: 'TSTACTOR-1',
        noSatker: TEST_SATKER,
        tahun: 2036,
        kodeTemuan: 'T-ACT',
        kodeRekomendasi: 'R-ACT',
        judulPemeriksaan: 'Uji aktor',
        uraianTemuan: 'uraian',
        uraianRekomendasi: 'rekomendasi',
        status: 'Belum Ditindaklanjuti',
        deskripsiTindakLanjut: '',
        unitKerja: 'Biro Uji',
        tanggalTerakhirUpdate: new Date()
      })
      .returning({ id: findings.id });

    entityIds.push(finding.id);

    const [comment] = await db
      .insert(comments)
      .values({
        findingId: finding.id,
        authorUserId: actor.id,
        authorEmail: actor.email,
        authorName: actor.name,
        body: 'berhasil'
      })
      .returning({ id: comments.id, authorUserId: comments.authorUserId });
    expect(comment.authorUserId).toBe(actor.id);

    const [attachment] = await db
      .insert(attachments)
      .values({
        findingId: finding.id,
        fileName: 'bukti.pdf',
        storagePath: 'storage/attachments/test/bukti.pdf',
        fileType: 'pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        uploadedByUserId: actor.id,
        uploadedByEmail: actor.email
      })
      .returning({ uploadedByUserId: attachments.uploadedByUserId });
    expect(attachment.uploadedByUserId).toBe(actor.id);
  });
});
