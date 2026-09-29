'use client';

import { mutationOptions } from '@tanstack/react-query';

import { getQueryClient } from '@/lib/query-client';
import type { FindingFormValues } from '../schemas/finding';
import {
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
 */

const invalidateFindings = () => {
  getQueryClient().invalidateQueries({ queryKey: findingKeys.all });
};

export const createFindingMutation = mutationOptions({
  mutationFn: (values: FindingFormValues) => createFinding(values),
  onSuccess: invalidateFindings
});

export const updateFindingMutation = mutationOptions({
  mutationFn: ({ kodeDisplay, values }: { kodeDisplay: string; values: FindingFormValues }) =>
    updateFinding(kodeDisplay, values),
  onSuccess: invalidateFindings
});

export const softDeleteFindingMutation = mutationOptions({
  mutationFn: (kodeDisplay: string) => softDeleteFinding(kodeDisplay),
  onSuccess: invalidateFindings
});

export const restoreFindingMutation = mutationOptions({
  mutationFn: (kodeDisplay: string) => restoreFinding(kodeDisplay),
  onSuccess: invalidateFindings
});

export const importFindingsXlsxMutation = mutationOptions({
  mutationFn: (formData: FormData) => importFindingsXlsx(formData),
  onSuccess: invalidateFindings
});

export const createCommentMutation = mutationOptions({
  mutationFn: ({ kodeDisplay, body }: { kodeDisplay: string; body: string }) =>
    createComment(kodeDisplay, body),
  onSuccess: invalidateFindings
});

export const deleteCommentMutation = mutationOptions({
  mutationFn: (commentId: string) => deleteComment(commentId),
  onSuccess: invalidateFindings
});

export const uploadAttachmentMutation = mutationOptions({
  mutationFn: ({ kodeDisplay, formData }: { kodeDisplay: string; formData: FormData }) =>
    uploadAttachment(kodeDisplay, formData),
  onSuccess: invalidateFindings
});

export const deleteAttachmentMutation = mutationOptions({
  mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
  onSuccess: invalidateFindings
});
