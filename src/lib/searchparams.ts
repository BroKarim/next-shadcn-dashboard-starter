import {
  createSearchParamsCache,
  createSerializer,
  parseAsBoolean,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  name: parseAsString,
  gender: parseAsString,
  category: parseAsString,
  role: parseAsString,
  sort: parseAsString,
  // --- BPK finding dashboard filters (task_plan.md §7) ---
  q: parseAsString,
  status: parseAsString,
  tahun: parseAsInteger,
  kodeTemuan: parseAsString,
  kodeRekomendasi: parseAsString,
  judul: parseAsString,
  includeDeleted: parseAsBoolean
  // advanced filter
  // filters: getFiltersStateParser().withDefault([]),
  // joinOperator: parseAsStringEnum(['and', 'or']).withDefault('and')
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
