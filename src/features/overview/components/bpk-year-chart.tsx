'use client';

import * as React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

import {
  EChartsBarChart,
  type ChartConfig
} from '@/components/evilcharts/charts/echarts-bar-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { findingsByYearQueryOptions } from '@/features/findings/api/queries';

const yearChartConfig = {
  jumlah: {
    label: 'Jumlah temuan',
    colors: {
      light: ['var(--chart-1)'],
      dark: ['var(--chart-1)']
    }
  }
} satisfies ChartConfig;

/** Bar chart of finding counts per examination year (computed in SQL). */
export function BpkYearChart() {
  const { data: findingsByYear } = useSuspenseQuery(findingsByYearQueryOptions());
  const yearChartData = React.useMemo(
    () => findingsByYear.map(({ tahun, jumlah }) => ({ tahun, jumlah })),
    [findingsByYear]
  );

  return (
    <Card className='lg:col-span-2'>
      <CardHeader>
        <CardTitle>Temuan per Tahun</CardTitle>
        <CardDescription>Jumlah temuan berdasarkan tahun pemeriksaan</CardDescription>
      </CardHeader>
      <CardContent>
        <div role='img' aria-label='Grafik batang jumlah temuan per tahun pemeriksaan'>
          <EChartsBarChart
            data={yearChartData}
            config={yearChartConfig}
            xDataKey='tahun'
            barRadius={4}
            className='h-56 w-full md:h-64'
          >
            <EChartsBarChart.Grid />
            <EChartsBarChart.XAxis dataKey='tahun' tickFormatter={(value) => String(value)} />
            <EChartsBarChart.YAxis />
            <EChartsBarChart.Tooltip />
            <EChartsBarChart.Bar dataKey='jumlah' variant='hatched' isClickable />
          </EChartsBarChart>
        </div>
      </CardContent>
    </Card>
  );
}
