import { queryOptions } from '@tanstack/react-query';

import {
  getFindingsByYear,
  getFindingDetail,
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
  activities: (limit?: number) => [...findingKeys.all, 'activities', limit ?? 'all'] as const,
  findingActivities: (id: string, limit?: number) =>
    [...findingKeys.all, 'finding-activities', id, limit] as const
};

export const findingsQueryOptions = (filters: FindingFilters) =>
  queryOptions({
    queryKey: findingKeys.list(filters),
    queryFn: () => listFindings(filters)
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
