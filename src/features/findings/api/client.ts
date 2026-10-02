import type { FindingFilters, FindingsPage } from './types';

/** Browser-side read client. Query functions must not invoke Server Actions during render. */
export async function fetchFindings(filters: FindingFilters): Promise<FindingsPage> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  const response = await fetch(`/api/findings?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Gagal memuat daftar temuan.');
  }

  return (await response.json()) as FindingsPage;
}
