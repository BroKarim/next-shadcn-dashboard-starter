/**
 * Pure diff helper for the activity log (task_plan.md D13/D18).
 *
 * `metadata` on an `activities` row stores the before/after state per changed
 * field, e.g. `{ status: { from: 'Belum Sesuai', to: 'Sesuai Rekomendasi' } }`.
 * Kept free of Drizzle so it can be unit tested without a database.
 */

export interface FieldChange {
  from: string | null;
  to: string | null;
}

export type FieldDiff = Record<string, FieldChange>;

function stringify(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

/**
 * Compare only the given keys, returning a diff of everything that changed.
 * Values are normalised to strings so numeric/date columns compare predictably.
 */
export function diffFields<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: readonly (keyof T)[]
): FieldDiff {
  const diff: FieldDiff = {};

  for (const field of fields) {
    const from = stringify(before[field]);
    const to = stringify(after[field]);
    if (from !== to) {
      diff[String(field)] = { from, to };
    }
  }

  return diff;
}

/** True when the diff contains at least one changed field. */
export function hasChanges(diff: FieldDiff): boolean {
  return Object.keys(diff).length > 0;
}
