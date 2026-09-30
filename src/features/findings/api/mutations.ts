'use client';

import { mutationOptions } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/query-client';
import type { FindingFormValues } from '../schemas/finding';
import {
  checkImportFileHash,
  createComment,
  createFinding,
  deleteAttachment,
  deleteComment,
  importFindingsXlsx,
  restoreFinding,
  softDeleteFinding,
  updateFinding,
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

export const createFindingMutation = mutationOptions({
  mutationFn: (values: FindingFormValues) => createFinding(values),
  onSettled: invalidateFindings
});

export const updateFindingMutation = mutationOptions({
  mutationFn: ({ kodeDisplay, values }: { kodeDisplay: string; values: FindingFormValues }) =>
    updateFinding(kodeDisplay, values),
  onSettled: invalidateFindings
});

export const softDeleteFindingMutation = mutationOptions({
  mutationFn: (kodeDisplay: string) => softDeleteFinding(kodeDisplay),
  onSettled: invalidateFindings
});

export const restoreFindingMutation = mutationOptions({
  mutationFn: (kodeDisplay: string) => restoreFinding(kodeDisplay),
  onSettled: invalidateFindings
});

export const importFindingsXlsxMutation = mutationOptions({
  mutationFn: (formData: FormData) => importFindingsXlsx(formData),
  onSettled: invalidateFindings
});

/** Duplicate-file preflight: read-only, never invalidates anything. */
export const checkImportFileHashMutation = mutationOptions({
  mutationFn: (fileHash: string) => checkImportFileHash(fileHash)
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

export const uploadAttachmentMutation = mutationOptions({
  mutationFn: ({ kodeDisplay, formData }: { kodeDisplay: string; formData: FormData }) =>
    uploadAttachment(kodeDisplay, formData),
  onSettled: invalidateFindings
});

export const deleteAttachmentMutation = mutationOptions({
  mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
  onSettled: invalidateFindings
});
