import { describe, expect, test } from 'bun:test';

import { canViewComment } from './comment-visibility';

describe('canViewComment', () => {
  const viewer = { role: 'user' as const, userId: 'user-1', email: 'author@example.test' };

  test('admins can view every comment', () => {
    expect(
      canViewComment(
        { authorUserId: 'user-2', authorEmail: 'other@example.test' },
        { ...viewer, role: 'admin' }
      )
    ).toBe(true);
  });

  test('users can view their own comment by local user id', () => {
    expect(
      canViewComment({ authorUserId: 'user-1', authorEmail: 'old@example.test' }, viewer)
    ).toBe(true);
  });

  test('legacy comments can be viewed by the matching author email', () => {
    expect(canViewComment({ authorUserId: null, authorEmail: viewer.email }, viewer)).toBe(true);
  });

  test('users cannot view another users comment', () => {
    expect(
      canViewComment({ authorUserId: 'user-2', authorEmail: 'other@example.test' }, viewer)
    ).toBe(false);
  });
});
