'use client';

/**
 * Suspense fallbacks for the four overview regions (task_plan.md §7).
 * KPI/chart/activities have static query keys (they stay mounted across
 * filter changes); only the table re-suspends on filter changes.
 */

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-md ${className ?? ''}`} />;
}

export function BpkKpiCardsSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {[0, 1, 2, 3].map((index) => (
        <SkeletonBlock key={index} className='h-36 rounded-xl' />
      ))}
    </div>
  );
}

export function BpkYearChartSkeleton() {
  return <SkeletonBlock className='h-64 rounded-xl lg:col-span-2' />;
}

export function BpkActivityPanelSkeleton() {
  return <SkeletonBlock className='h-64 rounded-xl lg:col-span-2' />;
}

export function BpkTableSkeleton() {
  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <SkeletonBlock key={index} className='h-14 rounded-lg' />
        ))}
      </div>
      <SkeletonBlock className='h-96 rounded-lg' />
      <SkeletonBlock className='h-10 rounded-lg' />
    </div>
  );
}
