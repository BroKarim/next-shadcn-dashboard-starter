'use client';

import * as React from 'react';

import type { AppRole } from '@/types';
import { BpkActivityPanel } from './bpk-activity-panel';
import { BpkFindingsTable } from './bpk-findings-table';
import { BpkKpiCards } from './bpk-kpi-cards';
import { BpkYearChart } from './bpk-year-chart';
import { BpkYearValueChart } from './bpk-year-value-chart';
import {
  BpkActivityPanelSkeleton,
  BpkKpiCardsSkeleton,
  BpkYearChartSkeleton
} from './bpk-overview-skeletons';

/**
 * Dashboard Temuan BPK composition (task_plan.md §7).
 *
 * Data comes from the database via React Query (server-prefetched in
 * `overview/page.tsx`). Each region owns its own query and Suspense boundary:
 * the KPI/chart/activity regions have static query keys and stay mounted
 * across filter changes; only the table re-suspends.
 *
 * Role split: the admin activity panel is shown to `admin` only. Every other
 * role gets the money-per-year chart in that slot instead (same layout,
 * `SUM(nilai_temuan)` rather than the finding count).
 */
export function BpkOverview({ appRole }: { appRole: AppRole }) {
  const isAdmin = appRole === 'admin';

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <React.Suspense fallback={<BpkKpiCardsSkeleton />}>
        <BpkKpiCards />
      </React.Suspense>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-4'>
        <React.Suspense fallback={<BpkYearChartSkeleton />}>
          <BpkYearChart />
        </React.Suspense>
        {isAdmin ? (
          <React.Suspense fallback={<BpkActivityPanelSkeleton />}>
            <BpkActivityPanel />
          </React.Suspense>
        ) : (
          <React.Suspense fallback={<BpkActivityPanelSkeleton />}>
            <BpkYearValueChart />
          </React.Suspense>
        )}
      </div>

      <BpkFindingsTable canManage={appRole !== 'user'} canRestore={isAdmin} />
    </div>
  );
}
