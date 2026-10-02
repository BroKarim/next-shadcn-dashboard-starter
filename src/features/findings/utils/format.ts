/**
 * Presentation formatters for the findings feature.
 *
 * The DTO keeps money as an exact numeric string (D8/T3), so the formatters
 * accept both the string DTO value and plain numbers. Time formatting pins
 * the timezone to Asia/Jakarta so server/client markup stays identical.
 */

export function formatRupiah(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(numeric);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta'
  }).format(new Date(value));
}

/**
 * Compact rupiah for chart axes: `Rp7,5 M`, `Rp512,3 jt`, `Rp96 rb`.
 * Kept deterministic (no Intl currency) so SSR and client markup match.
 */
export function formatRupiahCompact(value: string | number): string {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return '—';
  }

  const abs = Math.abs(numeric);
  const sign = numeric < 0 ? '-' : '';
  const units: { limit: number; suffix: string }[] = [
    { limit: 1_000_000_000_000, suffix: ' T' },
    { limit: 1_000_000_000, suffix: ' M' },
    { limit: 1_000_000, suffix: ' jt' },
    { limit: 1_000, suffix: ' rb' }
  ];

  for (const { limit, suffix } of units) {
    if (abs >= limit) {
      const scaled = abs / limit;
      const rounded = scaled >= 100 ? Math.round(scaled) : Math.round(scaled * 10) / 10;
      return `${sign}Rp${rounded.toLocaleString('id-ID')}${suffix}`;
    }
  }

  return `${sign}Rp${abs.toLocaleString('id-ID')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = size >= 10 || Number.isInteger(size) ? Math.round(size) : size.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}
