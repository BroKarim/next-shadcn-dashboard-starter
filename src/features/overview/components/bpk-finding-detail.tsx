'use client';

import * as React from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  BPK_ADMIN_ACTIVITIES,
  BPK_ATTACHMENTS,
  BPK_COMMENTS,
  formatDate,
  formatDateTime,
  formatFileSize,
  formatRupiah,
  getActivitiesForFinding,
  getAttachmentsForFinding,
  getCommentsForFinding,
  type BpkAttachment,
  type BpkFileType,
  type BpkFinding
} from './bpk-overview-data';
import { canManageFindings, MANAGE_ACTIONS_DISABLED_REASON } from '../permissions';

const FILE_ICONS: Record<BpkFileType, Icon> = {
  pdf: Icons.fileTypePdf,
  xlsx: Icons.fileTypeXls,
  docx: Icons.fileTypeDoc,
  image: Icons.media
};

const FILE_ICON_CLASS: Record<BpkFileType, string> = {
  pdf: 'text-destructive',
  xlsx: 'text-emerald-600 dark:text-emerald-500',
  docx: 'text-sky-600 dark:text-sky-500',
  image: 'text-violet-600 dark:text-violet-500'
};

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

function MockDocument({ attachment, finding }: { attachment: BpkAttachment; finding: BpkFinding }) {
  return (
    <div className='mx-auto flex w-full max-w-lg flex-col gap-4 rounded-md bg-background p-6 text-xs shadow-sm'>
      <div className='flex flex-col items-center gap-1 border-b pb-3 text-center'>
        <span className='text-[0.65rem] font-semibold tracking-widest uppercase'>
          Universitas Syiah Kuala
        </span>
        <span className='text-sm font-semibold'>Bukti Tindak Lanjut</span>
      </div>
      <dl className='flex flex-col gap-1'>
        <div className='flex gap-2'>
          <dt className='w-20 text-muted-foreground'>Nomor</dt>
          <dd>
            : {finding.id}/{finding.tahun}
          </dd>
        </div>
        <div className='flex gap-2'>
          <dt className='w-20 text-muted-foreground'>Perihal</dt>
          <dd>: Tindak Lanjut Temuan BPK</dd>
        </div>
        <div className='flex gap-2'>
          <dt className='w-20 text-muted-foreground'>Tanggal</dt>
          <dd>: {formatDate(attachment.uploadedAt)}</dd>
        </div>
      </dl>
      <p className='border-t pt-3 leading-relaxed text-muted-foreground'>
        {finding.deskripsiTindakLanjut}
      </p>
    </div>
  );
}

function AttachmentPreview({
  attachment,
  finding
}: {
  attachment: BpkAttachment | null;
  finding: BpkFinding;
}) {
  if (!attachment) {
    return (
      <Empty className='h-full border'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Icons.paperclip />
          </EmptyMedia>
          <EmptyTitle>Belum ada berkas dipilih</EmptyTitle>
          <EmptyDescription>
            Pilih salah satu dokumen pendukung di samping untuk melihat pratinjaunya.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className='flex h-full min-h-64 flex-col overflow-hidden rounded-lg border'>
      <div className='bg-muted/50 flex items-center gap-1 border-b px-2 py-1.5'>
        <Button
          variant='ghost'
          size='icon-xs'
          disabled
          aria-label='Halaman sebelumnya'
          title='Navigasi halaman tersedia setelah integrasi berkas.'
        >
          <Icons.chevronLeft />
        </Button>
        <Button
          variant='ghost'
          size='icon-xs'
          disabled
          aria-label='Halaman berikutnya'
          title='Navigasi halaman tersedia setelah integrasi berkas.'
        >
          <Icons.chevronRight />
        </Button>
        <span className='text-muted-foreground ml-1 text-xs tabular-nums'>1 / 1</span>
        <span className='ml-auto flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon-xs'
            disabled
            aria-label='Perkecil'
            title='Zoom tersedia setelah integrasi berkas.'
          >
            <Icons.minus />
          </Button>
          <span className='text-muted-foreground text-xs tabular-nums'>100%</span>
          <Button
            variant='ghost'
            size='icon-xs'
            disabled
            aria-label='Perbesar'
            title='Zoom tersedia setelah integrasi berkas.'
          >
            <Icons.add />
          </Button>
          <Button
            variant='ghost'
            size='icon-xs'
            disabled
            aria-label='Buka di tab baru'
            title='Buka di tab baru tersedia setelah integrasi berkas.'
          >
            <Icons.externalLink />
          </Button>
        </span>
      </div>
      <div className='bg-muted/30 flex-1 overflow-auto p-4'>
        {attachment.fileType === 'pdf' ? (
          <MockDocument attachment={attachment} finding={finding} />
        ) : (
          <div className='flex h-full flex-col items-center justify-center gap-2 text-center'>
            <span className={cn(FILE_ICON_CLASS[attachment.fileType])}>
              {React.createElement(FILE_ICONS[attachment.fileType], { className: 'size-8' })}
            </span>
            <span className='text-sm font-medium'>{attachment.fileName}</span>
            <span className='text-muted-foreground text-xs'>
              Pratinjau tidak tersedia untuk tipe berkas ini.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  authorName,
  createdAt,
  body
}: {
  authorName: string;
  createdAt: string;
  body: string;
}) {
  return (
    <li className='flex gap-3'>
      <Avatar size='sm' className='mt-0.5'>
        <AvatarFallback>{initials(authorName)}</AvatarFallback>
      </Avatar>
      <div className='flex min-w-0 flex-col gap-0.5'>
        <div className='flex flex-wrap items-center gap-x-2'>
          <span className='text-sm font-medium'>{authorName}</span>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {formatDateTime(createdAt)}
          </span>
        </div>
        <p className='text-sm leading-relaxed'>{body}</p>
      </div>
    </li>
  );
}

export function BpkFindingDetail({ finding }: { finding: BpkFinding }) {
  const attachments = React.useMemo(
    () => getAttachmentsForFinding(BPK_ATTACHMENTS, finding.id),
    [finding.id]
  );
  const comments = React.useMemo(
    () => getCommentsForFinding(BPK_COMMENTS, finding.id),
    [finding.id]
  );
  const activities = React.useMemo(
    () => getActivitiesForFinding(BPK_ADMIN_ACTIVITIES, finding.id),
    [finding.id]
  );
  const [selectedAttachmentId, setSelectedAttachmentId] = React.useState<string | null>(
    () => attachments[0]?.id ?? null
  );

  const selectedAttachment =
    attachments.find((attachment) => attachment.id === selectedAttachmentId) ??
    attachments[0] ??
    null;

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
            {finding.alasanDitolak && (
              <InfoRow label='Alasan Tidak Dapat Ditindaklanjuti'>{finding.alasanDitolak}</InfoRow>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumen Pendukung</CardTitle>
          <CardAction>
            <Button
              variant='outline'
              size='sm'
              disabled={!canManageFindings}
              title={MANAGE_ACTIONS_DISABLED_REASON}
            >
              <Icons.upload className='size-4' />
              Unggah Berkas
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {attachments.length > 0 ? (
            <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'>
              <ul className='flex flex-col gap-2'>
                {attachments.map((attachment) => {
                  const isSelected = attachment.id === selectedAttachment?.id;
                  return (
                    <li key={attachment.id}>
                      <button
                        type='button'
                        aria-pressed={isSelected}
                        onClick={() => setSelectedAttachmentId(attachment.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
                          isSelected && 'border-primary/50 bg-primary/5'
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-md bg-muted',
                            FILE_ICON_CLASS[attachment.fileType]
                          )}
                        >
                          {React.createElement(FILE_ICONS[attachment.fileType], {
                            className: 'size-5'
                          })}
                        </span>
                        <span className='min-w-0 flex-1'>
                          <span className='block truncate text-sm font-medium'>
                            {attachment.fileName}
                          </span>
                          <span className='text-muted-foreground block text-xs'>
                            {formatFileSize(attachment.sizeBytes)} &middot;{' '}
                            {formatDate(attachment.uploadedAt)}
                          </span>
                        </span>
                        <span className='text-muted-foreground text-xs font-medium whitespace-nowrap'>
                          {attachment.fileType === 'pdf' ? 'Lihat PDF' : 'Pratinjau'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <AttachmentPreview attachment={selectedAttachment} finding={finding} />
            </div>
          ) : (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <Icons.paperclip />
                </EmptyMedia>
                <EmptyTitle>Belum ada dokumen pendukung</EmptyTitle>
                <EmptyDescription>
                  Unggah berkas pendukung tindak lanjut setelah hak akses pengelolaan disiapkan.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diskusi</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          {comments.length > 0 ? (
            <ul className='flex flex-col gap-4'>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  authorName={comment.authorName}
                  createdAt={comment.createdAt}
                  body={comment.body}
                />
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground text-sm'>Belum ada komentar pada temuan ini.</p>
          )}

          <div className='flex items-start gap-3 border-t pt-4'>
            <Avatar size='sm' className='mt-0.5'>
              <AvatarFallback>
                <Icons.user2 className='size-3.5' />
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-1 flex-col gap-2 sm:flex-row sm:items-center'>
              <Textarea
                disabled={!canManageFindings}
                placeholder='Tulis komentar...'
                title={MANAGE_ACTIONS_DISABLED_REASON}
                className='min-h-10 flex-1 py-2'
                rows={1}
              />
              <Button
                disabled={!canManageFindings}
                title={MANAGE_ACTIONS_DISABLED_REASON}
                className='sm:self-stretch'
              >
                <Icons.send className='size-4' />
                Kirim Komentar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <ol className='relative flex flex-col'>
              {activities.map((activity, index) => (
                <li key={activity.id} className='relative flex gap-3 pb-5 last:pb-0'>
                  {index < activities.length - 1 && (
                    <span
                      aria-hidden='true'
                      className='bg-border absolute top-3 left-[5px] h-full w-px'
                    />
                  )}
                  <span className='bg-primary relative mt-1 size-2.5 shrink-0 rounded-full ring-4 ring-background' />
                  <div className='flex min-w-0 flex-col gap-0.5'>
                    <div className='flex flex-wrap items-center gap-x-2'>
                      <span className='text-xs text-muted-foreground tabular-nums'>
                        {formatDate(activity.occurredAt)}
                      </span>
                      <span className='text-sm font-medium'>{activity.actorEmail}</span>
                      <span className='text-muted-foreground text-xs'>&bull;</span>
                      <span className='text-sm font-medium'>{activity.action}</span>
                    </div>
                    {activity.detail && (
                      <p className='text-muted-foreground text-sm leading-relaxed'>
                        {activity.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className='text-muted-foreground text-sm'>
              Belum ada aktivitas admin untuk temuan ini.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
