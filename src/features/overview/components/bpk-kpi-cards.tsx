'use client';

import * as React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

import { Icons, type Icon } from '@/components/icons';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { formatRupiah } from '@/features/findings/utils/format';
import { overviewMetricsQueryOptions } from '@/features/findings/api/queries';
import type { OverviewMetric, OverviewMetricKey } from '@/features/findings/api/types';

const METRIC_ICONS: Record<OverviewMetricKey, Icon> = {
  total: Icons.page,
  sesuai: Icons.badgeCheck,
  belumSesuai: Icons.warning,
  belumDitindaklanjuti: Icons.alertCircle
};

/**
 * The four KPI cards. Metrics are computed in SQL over the whole dataset —
 * the table filters do not change their meaning (task_plan.md §5).
 */
export function BpkKpiCards() {
  const { data: metrics } = useSuspenseQuery(overviewMetricsQueryOptions());

  return (
    <div className='min-w-0 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
      {metrics.map((metric: OverviewMetric) => {
        const MetricIcon = METRIC_ICONS[metric.key];

        return (
          <Card key={metric.key} className='@container/card'>
            <CardHeader>
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {metric.count}
              </CardTitle>
              <CardAction>
                <div className='bg-muted text-muted-foreground rounded-md p-1.5'>
                  <MetricIcon className='size-4' />
                </div>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 font-medium tabular-nums'>
                {formatRupiah(metric.totalNilai)}
              </div>
              <div className='text-muted-foreground'>Total nilai temuan</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
