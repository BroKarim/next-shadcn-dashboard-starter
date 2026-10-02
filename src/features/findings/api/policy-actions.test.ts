import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

const CLERK_USER_ID = 'user_policy_action_test';
const EMAIL = 'policy-admin@local';

mock.module('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: CLERK_USER_ID }),
  currentUser: async () => ({
    primaryEmailAddress: { emailAddress: EMAIL },
    firstName: 'Policy',
    lastName: 'Admin'
  })
}));

const { db } = await import('@/db/client');
const { activities, comments, findings, users } = await import('@/db/schema');
const { replyToComment, updateFindingValue } = await import('./actions');

const findingId = randomUUID();
const commentId = randomUUID();

beforeAll(async () => {
  await db.insert(users).values({
    id: randomUUID(),
    clerkUserId: CLERK_USER_ID,
    email: EMAIL,
    name: 'Policy Admin',
    role: 'admin'
  });

  await db.insert(findings).values({
    id: findingId,
    kodeDisplay: 'TSTPOLICY-1',
    noSatker: 'TSTPOLICY',
    tahun: 2037,
    kodeTemuan: 'T-POLICY',
    kodeRekomendasi: 'R-POLICY',
    judulPemeriksaan: 'Uji policy',
    uraianTemuan: 'Uraian tetap',
    uraianRekomendasi: 'Rekomendasi tetap',
    nilaiTemuan: '100.00',
    status: 'Belum Ditindaklanjuti',
    deskripsiTindakLanjut: 'Deskripsi tetap',
    unitKerja: 'Unit tetap',
    tanggalTerakhirUpdate: new Date()
  });

  await db.insert(comments).values({
    id: commentId,
    findingId,
    authorEmail: 'user@local',
    body: 'Komentar untuk ditanggapi'
  });
});

afterAll(async () => {
  await db.delete(activities).where(eq(activities.entityId, findingId));
  await db.delete(findings).where(eq(findings.id, findingId));
  await db.delete(users).where(eq(users.clerkUserId, CLERK_USER_ID));
});

describe('policy mutations', () => {
  test('updates only nilaiTemuan and records only that diff', async () => {
    const result = await updateFindingValue('TSTPOLICY-1', 250);
    expect(result.changed).toBe(true);
    expect(result.diff).toEqual({ nilaiTemuan: { from: '100.00', to: '250.00' } });

    const [finding] = await db.select().from(findings).where(eq(findings.id, findingId));
    expect(finding?.nilaiTemuan).toBe('250.00');
    expect(finding?.status).toBe('Belum Ditindaklanjuti');
    expect(finding?.unitKerja).toBe('Unit tetap');
  });

  test('allows an admin to save a response on a comment', async () => {
    await replyToComment(commentId, 'Tanggapan resmi admin.');

    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId));
    expect(comment?.adminReply).toBe('Tanggapan resmi admin.');
    expect(comment?.adminReplyByEmail).toBe(EMAIL);
    expect(comment?.adminReplyAt).toBeInstanceOf(Date);
  });
});
