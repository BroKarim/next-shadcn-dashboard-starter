import { Badge } from '@/components/ui/badge';
import type { FindingStatus } from '@/features/findings/api/types';
import { cn } from '@/lib/utils';

const STATUS_BADGE_VARIANT: Record<FindingStatus, 'default' | 'secondary' | 'outline'> = {
  'Belum Ditindaklanjuti': 'default',
  'Belum Sesuai': 'outline',
  'Sudah Ditindaklanjuti': 'secondary',
  'Sesuai Rekomendasi': 'secondary',
  'Tidak Dapat Ditindaklanjuti': 'outline'
};

const STATUS_BADGE_CLASS: Record<FindingStatus, string> = {
  'Belum Ditindaklanjuti': 'border-transparent',
  'Belum Sesuai': 'border-destructive/40 text-destructive',
  'Sudah Ditindaklanjuti': 'border-transparent',
  'Sesuai Rekomendasi': 'border-transparent',
  'Tidak Dapat Ditindaklanjuti': 'text-muted-foreground'
};

export function StatusBadge({ status, className }: { status: FindingStatus; className?: string }) {
  return (
    <Badge
      variant={STATUS_BADGE_VARIANT[status]}
      className={cn('gap-1.5', STATUS_BADGE_CLASS[status], className)}
    >
      <span aria-hidden='true' className='size-1.5 rounded-full bg-current' />
      {status}
    </Badge>
  );
}
