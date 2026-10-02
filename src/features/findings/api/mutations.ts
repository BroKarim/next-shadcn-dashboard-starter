'use client';

import { mutationOptions } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/query-client';
import {
  createComment,
  deleteAttachment,
  deleteComment,
  replyToComment,
  updateFindingValue,
  uploadAttachment
} from './actions';
import { findingKeys } from './queries';

/**
 * Client-side mutation options for finding writes. Invalidating
 * `findingKeys.all` refreshes the table, KPI, charts, activity panel and any
 * open detail query after a mutation.
 *
 * Invalidation hangs off `onSettled`, not `onSuccess`: call sites spread these
 * options and override `onSuccess` with their own toast, which would silently
 * drop an `onSuccess` defined here (the comments list never refreshing).
 */

const invalidateFindings = () => {
  getQueryClient().invalidateQueries({ queryKey: findingKeys.all });
};

export const updateFindingValueMutation = mutationOptions({
  mutationFn: ({ kodeDisplay, nilaiTemuan }: { kodeDisplay: string; nilaiTemuan: number }) =>
    updateFindingValue(kodeDisplay, nilaiTemuan),
  onSettled: invalidateFindings
});

export const createCommentMutation = mutationOptions({
  mutationFn: ({ kodeDisplay, body }: { kodeDisplay: string; body: string }) =>
    createComment(kodeDisplay, body),
  onSettled: invalidateFindings
});

export const deleteCommentMutation = mutationOptions({
  mutationFn: (commentId: string) => deleteComment(commentId),
  onSettled: invalidateFindings
});

export const replyToCommentMutation = mutationOptions({
  mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
    replyToComment(commentId, body),
  onSettled: invalidateFindings
});

export const uploadAttachmentMutation = mutationOptions({
  mutationFn: ({ kodeDisplay, formData }: { kodeDisplay: string; formData: FormData }) =>
    uploadAttachment(kodeDisplay, formData),
  onSettled: invalidateFindings
});

export const deleteAttachmentMutation = mutationOptions({
  mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
  onSettled: invalidateFindings
});
