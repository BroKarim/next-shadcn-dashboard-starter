'use client';

import * as React from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Icons, type Icon } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from '@/components/ui/empty';
import { LoadingButton } from '@/components/ui/loading-button';
import { Textarea } from '@/components/ui/textarea';
import { toUserMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import {
  createCommentMutation,
  deleteAttachmentMutation,
  deleteCommentMutation,
  replyToCommentMutation,
  uploadAttachmentMutation
} from '@/features/findings/api/mutations';
import { findingDetailOptions } from '@/features/findings/api/queries';
import type { Activity, FindingAttachment, FindingComment } from '@/features/findings/api/types';
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatRupiah
} from '@/features/findings/utils/format';

const FILE_ICONS: Record<FindingAttachment['fileType'], Icon> = {
  pdf: Icons.fileTypePdf,
  xlsx: Icons.fileTypeXls,
  docx: Icons.fileTypeDoc,
  image: Icons.media
};

const FILE_ICON_CLASS: Record<FindingAttachment['fileType'], string> = {
  pdf: 'text-destructive',
  xlsx: 'text-emerald-600 dark:text-emerald-500',
  docx: 'text-sky-600 dark:text-sky-500',
  image: 'text-violet-600 dark:text-violet-500'
};

const ATTACHMENT_BASE = '/api/attachments';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function SummaryItem({
  icon: SummaryIcon,
  label,
  value
}: {
  icon: Icon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className='flex items-center gap-3'>
      <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'>
        <SummaryIcon className='size-4' />
      </div>
      <div className='min-w-0'>
        <div className='text-muted-foreground text-xs'>{label}</div>
        <div className='truncate text-sm font-medium tabular-nums'>{value}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4'>
      <dt className='text-muted-foreground text-sm'>{label}</dt>
      <dd className='text-sm leading-relaxed'>{children}</dd>
    </div>
  );
}

function AttachmentPreview({ attachment }: { attachment: FindingAttachment | null }) {
  if (!attachment) {
    return (
      <Empty className='h-full border'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.paperclip />
          </EmptyMedia>
          <EmptyTitle>Belum ada berkas</EmptyTitle>
          <EmptyDescription>
            Unggah dokumen pendukung (PDF, XLSX, DOCX, atau gambar, maks 10 MB).
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const src = `${ATTACHMENT_BASE}/${attachment.id}`;

  return (
    <div className='flex h-full min-h-64 flex-col overflow-hidden rounded-lg border'>
      <div className='bg-muted/50 flex items-center gap-1 border-b px-2 py-1.5'>
        <span className='text-muted-foreground ml-1 truncate text-xs'>{attachment.fileName}</span>
        <Button
          variant='ghost'
          size='icon-xs'
          className='ml-auto'
          aria-label='Buka di tab baru'
          title='Buka di tab baru'
          onClick={() => window.open(src, '_blank', 'noopener')}
        >
          <Icons.externalLink />
        </Button>
      </div>
      <div className='bg-muted/30 flex-1 overflow-auto p-4'>
        {attachment.fileType === 'pdf' ? (
          <iframe
            src={src}
            title={`Pratinjau ${attachment.fileName}`}
            // Fully sandboxed: the file comes from an authenticated route and
            // is user-uploaded. If the viewer refuses to render, the toolbar
            // offers "Buka di tab baru".
            sandbox=''
            className='h-96 w-full rounded-md bg-background'
          />
        ) : attachment.fileType === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated route handler, not a static asset
          <img
            src={src}
            alt={`Pratinjau ${attachment.fileName}`}
            className='mx-auto max-h-96 rounded-md bg-background object-contain'
          />
        ) : (
          <div className='flex h-full flex-col items-center justify-center gap-2 text-center'>
            <span className={cn(FILE_ICON_CLASS[attachment.fileType])}>
              {React.createElement(FILE_ICONS[attachment.fileType], { className: 'size-8' })}
            </span>
            <span className='text-sm font-medium'>{attachment.fileName}</span>
            <span className='text-muted-foreground text-xs'>
              Pratinjau tidak tersedia untuk tipe berkas ini.
            </span>
            <Button
              variant='outline'
              size='sm'
              onClick={() => window.open(src, '_blank', 'noopener')}
            >
              <Icons.upload className='size-4' />
              Unduh berkas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <li className='flex flex-col gap-0.5 border-b pb-3 last:border-b-0 last:pb-0'>
      <div className='flex items-start justify-between gap-2'>
        <span className='text-sm font-medium'>{activity.action}</span>
        <span className='text-muted-foreground text-xs whitespace-nowrap tabular-nums'>
          {formatDateTime(activity.occurredAt)}
        </span>
      </div>
      <span className='text-muted-foreground truncate text-xs'>{activity.actorEmail}</span>
    </li>
  );
}

function AdminReplyBox({ comment }: { comment: FindingComment }) {
  const [body, setBody] = React.useState(comment.adminReply ?? '');
  const mutation = useMutation({
    ...replyToCommentMutation,
    onSuccess: () => toast.success('Tanggapan admin disimpan.'),
    onError: (error) => toast.error(toUserMessage(error))
  });

  return (
    <div className='bg-muted/40 mt-3 rounded-lg border-l-2 px-3 py-3'>
      <div className='flex items-center justify-between gap-2'>
        <span className='text-xs font-semibold'>
          {comment.adminReply ? 'Tanggapan Admin' : 'Tanggapi Komentar'}
        </span>
        {comment.adminReply && comment.adminReplyByEmail && (
          <span className='text-muted-foreground text-xs'>{comment.adminReplyByEmail}</span>
        )}
      </div>
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder='Tulis tanggapan resmi dari admin…'
        aria-label={`Tanggapan admin untuk komentar ${comment.id}`}
        rows={2}
        className='mt-2 bg-background'
      />
      <div className='mt-2 flex justify-end'>
        <LoadingButton
          size='sm'
          variant='outline'
          loading={mutation.isPending}
          disabled={mutation.isPending || body.trim().length === 0}
          onClick={() => mutation.mutate({ commentId: comment.id, body })}
        >
          <Icons.send className='size-4' />
          Simpan Tanggapan
        </LoadingButton>
      </div>
    </div>
  );
}

export function BpkFindingDetail({
  kodeDisplay,
  canManage,
  canDeleteComment,
  currentUserId
}: {
  kodeDisplay: string;
  /** Admin-only data management (attachments upload/delete). */
  canManage: boolean;
  /** Admin may delete any comment; every author may delete their own. */
  canDeleteComment: boolean;
  /** Local `users.id` of the viewer, compared against the comment author. */
  currentUserId: string | null;
}) {
  const { data } = useSuspenseQuery(findingDetailOptions(kodeDisplay));
  const { finding, attachments, comments, activities } = data;

  const [selectedAttachmentId, setSelectedAttachmentId] = React.useState<string | null>(null);
  const [commentBody, setCommentBody] = React.useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const selectedAttachment =
    attachments.find((attachment) => attachment.id === selectedAttachmentId) ??
    attachments[0] ??
    null;

  const commentMutation = useMutation({
    ...createCommentMutation,
    onSuccess: () => {
      setCommentBody('');
      toast.success('Komentar dikirim.');
    },
    onError: (error) => toast.error(toUserMessage(error))
  });

  const deleteComment = useMutation({
    ...deleteCommentMutation,
    onSuccess: () => toast.success('Komentar dihapus.'),
    onError: (error) => toast.error(toUserMessage(error))
  });

  const uploadMutation = useMutation({
    ...uploadAttachmentMutation,
    onSuccess: (result) => toast.success(`Berkas ${result.fileName} diunggah.`),
    onError: (error) => toast.error(toUserMessage(error))
  });

  const deleteAttachment = useMutation({
    ...deleteAttachmentMutation,
    onSuccess: () => toast.success('Lampiran dihapus.'),
    onError: (error) => toast.error(toUserMessage(error))
  });

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Temuan</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6'>
          <SummaryItem icon={Icons.calendar} label='Tahun' value={finding.tahun} />
          <SummaryItem icon={Icons.page} label='Kode Temuan' value={finding.kodeTemuan} />
          <SummaryItem
            icon={Icons.badgeCheck}
            label='Kode Rekomendasi'
            value={finding.kodeRekomendasi}
          />
          <SummaryItem
            icon={Icons.creditCard}
            label='Nilai Temuan'
            value={formatRupiah(finding.nilaiTemuan)}
          />
          <SummaryItem icon={Icons.workspace} label='Unit Kerja' value={finding.unitKerja} />
          <SummaryItem
            icon={Icons.clock}
            label='Update Terakhir'
            value={formatDate(finding.tanggalTerakhirUpdate)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Pemeriksaan</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className='divide-y'>
            <InfoRow label='Judul Pemeriksaan'>{finding.judulPemeriksaan}</InfoRow>
            <InfoRow label='Uraian Temuan'>{finding.uraianTemuan}</InfoRow>
            <InfoRow label='Uraian Rekomendasi'>{finding.uraianRekomendasi}</InfoRow>
            <InfoRow label='Deskripsi Tindak Lanjut'>{finding.deskripsiTindakLanjut}</InfoRow>
            {finding.tanggalTindakLanjut && (
              <InfoRow label='Tanggal Tindak Lanjut'>
                {formatDate(finding.tanggalTindakLanjut)}
              </InfoRow>
            )}
            {finding.alasanDitolak && (
              <InfoRow label='Alasan Tidak Dapat Ditindaklanjuti'>{finding.alasanDitolak}</InfoRow>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumen Pendukung</CardTitle>
          <CardAction className='flex items-center gap-2'>
            <input
              ref={fileInputRef}
              type='file'
              accept='.pdf,.xlsx,.docx,image/*'
              className='hidden'
              aria-label='Pilih berkas lampiran'
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                uploadMutation.mutate({ kodeDisplay, formData });
              }}
            />
            <LoadingButton
              variant='outline'
              size='sm'
              loading={uploadMutation.isPending}
              disabled={!canManage}
              title={canManage ? undefined : 'Perlu hak akses admin.'}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icons.upload className='size-4' />
              Unggah Berkas
            </LoadingButton>
          </CardAction>
        </CardHeader>
        <CardContent className='grid gap-4 lg:grid-cols-[20rem_1fr]'>
          <div className='flex flex-col gap-2'>
            {attachments.length === 0 ? (
              <p className='text-muted-foreground text-sm'>Belum ada lampiran.</p>
            ) : (
              attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-2',
                    attachment.id === selectedAttachment?.id && 'border-primary'
                  )}
                >
                  <button
                    type='button'
                    className='flex min-w-0 flex-1 items-center gap-3 text-left'
                    onClick={() => setSelectedAttachmentId(attachment.id)}
                  >
                    <span className={cn('shrink-0', FILE_ICON_CLASS[attachment.fileType])}>
                      {React.createElement(FILE_ICONS[attachment.fileType], {
                        className: 'size-6'
                      })}
                    </span>
                    <span className='min-w-0'>
                      <span className='block truncate text-sm font-medium'>
                        {attachment.fileName}
                      </span>
                      <span className='text-muted-foreground block text-xs'>
                        {formatFileSize(attachment.sizeBytes)} · {attachment.uploadedByEmail}
                      </span>
                    </span>
                  </button>
                  {canManage && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-8 text-destructive'
                      aria-label={`Hapus lampiran ${attachment.fileName}`}
                      title='Hapus lampiran'
                      disabled={deleteAttachment.isPending}
                      onClick={() => deleteAttachment.mutate(attachment.id)}
                    >
                      <Icons.trash className='size-4' />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
          <AttachmentPreview attachment={selectedAttachment} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diskusi</CardTitle>
          <p className='text-muted-foreground text-sm'>
            Komentar hanya dapat dilihat oleh admin dan orang yang menulis komentar tersebut.
          </p>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {comments.length === 0 ? (
            <p className='text-muted-foreground text-sm'>Belum ada komentar.</p>
          ) : (
            <ul className='flex flex-col gap-4'>
              {comments.map((comment) => (
                <li key={comment.id} className='flex gap-3'>
                  <Avatar size='sm' className='mt-0.5'>
                    <AvatarFallback>
                      {initials(comment.authorName ?? comment.authorEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                    <div className='flex flex-wrap items-center gap-x-2'>
                      <span className='text-sm font-medium'>
                        {comment.authorName ?? comment.authorEmail}
                      </span>
                      <span className='text-muted-foreground text-xs tabular-nums'>
                        {formatDateTime(comment.createdAt)}
                      </span>
                      {(canDeleteComment ||
                        (currentUserId !== null && comment.authorUserId === currentUserId)) && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='ml-auto size-7 text-destructive'
                          aria-label='Hapus komentar'
                          title='Hapus komentar'
                          disabled={deleteComment.isPending}
                          onClick={() => deleteComment.mutate(comment.id)}
                        >
                          <Icons.trash className='size-3.5' />
                        </Button>
                      )}
                    </div>
                    <p className='text-sm leading-relaxed'>{comment.body}</p>
                    {comment.adminReply && !canManage && (
                      <div className='bg-muted/40 mt-3 rounded-lg border-l-2 px-3 py-2'>
                        <div className='flex items-center justify-between gap-2'>
                          <span className='text-xs font-semibold'>Tanggapan Admin</span>
                          {comment.adminReplyByEmail && (
                            <span className='text-muted-foreground text-xs'>
                              {comment.adminReplyByEmail}
                            </span>
                          )}
                        </div>
                        <p className='mt-1 text-sm leading-relaxed'>{comment.adminReply}</p>
                        {comment.adminReplyAt && (
                          <p className='text-muted-foreground mt-1 text-xs'>
                            {formatDateTime(comment.adminReplyAt)}
                          </p>
                        )}
                      </div>
                    )}
                    {canManage && <AdminReplyBox comment={comment} />}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className='flex flex-col gap-2 border-t pt-4'>
            <Textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder='Tulis komentar tindak lanjut…'
              aria-label='Tulis komentar'
              rows={3}
            />
            <div className='flex justify-end'>
              <LoadingButton
                size='sm'
                loading={commentMutation.isPending}
                disabled={commentMutation.isPending || commentBody.trim().length === 0}
                onClick={() => commentMutation.mutate({ kodeDisplay, body: commentBody })}
              >
                <Icons.send className='size-4' />
                Kirim Komentar
              </LoadingButton>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className='text-muted-foreground text-sm'>Belum ada aktivitas.</p>
          ) : (
            <ul className='flex flex-col gap-3'>
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
