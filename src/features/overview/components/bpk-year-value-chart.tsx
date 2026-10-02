'use client';

import * as React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

import {
  EChartsBarChart,
  type ChartConfig
} from '@/components/evilcharts/charts/echarts-bar-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { findingsValueByYearQueryOptions } from '@/features/findings/api/queries';
import { formatRupiah, formatRupiahCompact } from '@/features/findings/utils/format';

const valueChartConfig = {
  totalNilai: {
    label: 'Total nilai temuan (Rp)',
    colors: {
      light: ['var(--chart-2)'],
      dark: ['var(--chart-2)']
    }
  }
} satisfies ChartConfig;

/**
 * Money variant of the yearly chart, shown to non-admin users in place of the
 * admin activity panel: the bar value is `SUM(nilai_temuan)` per tahun
 * (money, not the number of findings).
 */
export function BpkYearValueChart() {
  const { data } = useSuspenseQuery(findingsValueByYearQueryOptions());
  const chartData = React.useMemo(
    () => data.map(({ tahun, totalNilai }) => ({ tahun, totalNilai: Number(totalNilai) })),
    [data]
  );

  return (
    <Card className='lg:col-span-2'>
      <CardHeader>
        <CardTitle>Nilai Temuan per Tahun</CardTitle>
        <CardDescription>Total nilai temuan berdasarkan tahun pemeriksaan</CardDescription>
      </CardHeader>
      <CardContent>
        <div role='img' aria-label='Grafik batang total nilai temuan per tahun pemeriksaan'>
          <EChartsBarChart
            data={chartData}
            config={valueChartConfig}
            xDataKey='tahun'
            barRadius={4}
            className='h-56 w-full md:h-64'
          >
            <EChartsBarChart.Grid />
            <EChartsBarChart.XAxis dataKey='tahun' tickFormatter={(value) => String(value)} />
            <EChartsBarChart.YAxis tickFormatter={(value) => formatRupiahCompact(value)} />
            <EChartsBarChart.Tooltip />
            <EChartsBarChart.Bar dataKey='totalNilai' variant='hatched' isClickable />
          </EChartsBarChart>
        </div>
        <p className='text-muted-foreground mt-2 text-xs'>
          Nilai tertinggi:{' '}
          {chartData.length > 0
            ? formatRupiah(
                chartData.reduce((max, item) => (item.totalNilai > max ? item.totalNilai : max), 0)
              )
            : '—'}
        </p>
      </CardContent>
    </Card>
  );
}
