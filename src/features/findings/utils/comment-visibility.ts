import type { AppRole } from '@/types';

interface CommentAuthor {
  authorUserId: string | null;
  authorEmail: string;
}

export interface CommentViewer {
  role: AppRole;
  userId: string;
  email: string;
}

/** Admins see every comment; other users see only their own comments. */
export function canViewComment(comment: CommentAuthor, viewer: CommentViewer): boolean {
  return (
    viewer.role === 'admin' ||
    comment.authorUserId === viewer.userId ||
    comment.authorEmail === viewer.email
  );
}
