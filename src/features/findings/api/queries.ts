import { queryOptions } from '@tanstack/react-query';

import { fetchFindings } from './client';
import {
  getFindingsByYear,
  getFindingsValueByYear,
  getFindingDetail,
  getFindingFilterOptions,
  getOverviewMetrics,
  listFindingActivities,
  listFindings,
  listRecentActivities
} from './service';
import type { FindingFilters } from './types';

export const findingKeys = {
  all: ['findings'] as const,
  list: (filters: FindingFilters) => [...findingKeys.all, 'list', filters] as const,
  detail: (id: string) => [...findingKeys.all, 'detail', id] as const,
  metrics: () => [...findingKeys.all, 'metrics'] as const,
  yearly: () => [...findingKeys.all, 'yearly'] as const,
  yearlyValue: () => [...findingKeys.all, 'yearly-value'] as const,
  filterOptions: () => [...findingKeys.all, 'filter-options'] as const,
  activities: (limit?: number) => [...findingKeys.all, 'activities', limit ?? 'all'] as const,
  findingActivities: (id: string, limit?: number) =>
    [...findingKeys.all, 'finding-activities', id, limit] as const
};

export const findingsQueryOptions = (filters: FindingFilters) =>
  queryOptions({
    queryKey: findingKeys.list(filters),
    queryFn: () => (typeof window === 'undefined' ? listFindings(filters) : fetchFindings(filters))
  });

export const overviewMetricsQueryOptions = () =>
  queryOptions({
    queryKey: findingKeys.metrics(),
    queryFn: getOverviewMetrics
  });

export const findingsByYearQueryOptions = () =>
  queryOptions({
    queryKey: findingKeys.yearly(),
    queryFn: getFindingsByYear
  });

export const findingsValueByYearQueryOptions = () =>
  queryOptions({
    queryKey: findingKeys.yearlyValue(),
    queryFn: getFindingsValueByYear
  });

/** Non-suspense — the filter selects read it while the card stays mounted. */
export const findingFilterOptionsQueryOptions = () =>
  queryOptions({
    queryKey: findingKeys.filterOptions(),
    queryFn: getFindingFilterOptions
  });

export const recentActivitiesQueryOptions = (limit?: number) =>
  queryOptions({
    queryKey: findingKeys.activities(limit),
    queryFn: () => listRecentActivities(limit)
  });

export const findingDetailOptions = (id: string) =>
  queryOptions({
    queryKey: findingKeys.detail(id),
    queryFn: () => getFindingDetail(id)
  });

/** Non-suspense (plain `useQuery`) — used by the summary drawer. */
export const findingActivitiesOptions = (id: string, limit?: number) =>
  queryOptions({
    queryKey: findingKeys.findingActivities(id, limit),
    queryFn: () => listFindingActivities(id, limit)
  });
