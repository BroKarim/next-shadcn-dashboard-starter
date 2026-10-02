'use client';

import * as React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/features/findings/utils/format';
import { recentActivitiesQueryOptions } from '@/features/findings/api/queries';
import type { Activity } from '@/features/findings/api/types';

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <li className='flex flex-col gap-0.5 border-b pb-3 last:border-b-0 last:pb-0'>
      <div className='flex items-start justify-between gap-2'>
        <span className='text-sm font-medium'>{activity.action}</span>
        <span className='text-muted-foreground text-xs whitespace-nowrap tabular-nums'>
          {formatDateTime(activity.occurredAt)}
        </span>
      </div>
      <span className='text-muted-foreground truncate text-xs'>{activity.actorEmail}</span>
      {activity.findingKode && (
        <span className='text-muted-foreground text-xs'>Temuan {activity.findingKode}</span>
      )}
    </li>
  );
}

/**
 * Admin activity panel. Shows **every** activity in a scrollable area with a
 * hidden scrollbar — no limit and no "Lihat semua" button (D34). The before/
 * after diff inside `metadata` is rendered once the mutation features land.
 */
export function BpkActivityPanel() {
  const { data: activities } = useSuspenseQuery(recentActivitiesQueryOptions());

  return (
    <Card className='flex flex-col lg:col-span-2'>
      <CardHeader>
        <CardTitle>Aktivitas Admin</CardTitle>
        <CardDescription>Riwayat perubahan data temuan</CardDescription>
      </CardHeader>
      <CardContent className='min-h-0 flex-1'>
        <ul className='flex max-h-56 flex-col gap-3 overflow-y-auto pr-1 [scrollbar-width:none] md:max-h-64 [&::-webkit-scrollbar]:hidden'>
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
