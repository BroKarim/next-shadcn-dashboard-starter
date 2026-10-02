import { listFindings } from '@/features/findings/api/service';
import {
  FINDING_STATUSES,
  type FindingFilters,
  type FindingSort
} from '@/features/findings/api/types';
import { ForbiddenError, UnauthenticatedError, toUserMessage } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const FINDING_SORTS: FindingSort[] = [
  'default',
  'nilai_asc',
  'nilai_desc',
  'tahun_asc',
  'tahun_desc',
  'update_asc',
  'update_desc'
];

function parsePositiveInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseFilters(request: Request): FindingFilters {
  const params = new URL(request.url).searchParams;
  const rawStatus = params.get('status');
  const rawSort = params.get('sort');

  return {
    page: parsePositiveInteger(params.get('page')),
    perPage: parsePositiveInteger(params.get('perPage')),
    q: params.get('q') || undefined,
    status:
      rawStatus && FINDING_STATUSES.includes(rawStatus as (typeof FINDING_STATUSES)[number])
        ? (rawStatus as FindingFilters['status'])
        : undefined,
    tahun: parsePositiveInteger(params.get('tahun')),
    kodeTemuan: params.get('kodeTemuan') || undefined,
    kodeRekomendasi: params.get('kodeRekomendasi') || undefined,
    judul: params.get('judul') || undefined,
    includeDeleted: params.get('includeDeleted') === 'true',
    sort:
      rawSort && FINDING_SORTS.includes(rawSort as FindingSort)
        ? (rawSort as FindingSort)
        : undefined
  };
}

export async function GET(request: Request) {
  try {
    return Response.json(await listFindings(parseFilters(request)));
  } catch (error) {
    const status =
      error instanceof ForbiddenError ? 403 : error instanceof UnauthenticatedError ? 401 : 500;
    return Response.json({ message: toUserMessage(error) }, { status });
  }
}
