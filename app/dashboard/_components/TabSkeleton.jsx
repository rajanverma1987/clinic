'use client';

/**
 * Skeleton shown while a dashboard tab (Appointments/Prescriptions) is lazy-loading.
 * Matches the tab card layout (Card p-6, header + table). Row count matches tab list limit for minimal CLS.
 */
import { Card } from '@/components/ui/Card';
import { TableSkeleton } from '@/components/ui/TableSkeleton';

const TAB_LIST_ROWS = 10;
const TAB_LIST_COLS = 4;

export function TabSkeleton() {
  return (
    <Card className='p-6' aria-busy='true' aria-label='Loading tab content' role='status'>
      <div className='flex items-center justify-between gap-4 mb-4'>
        <div className='h-6 w-32 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse' />
        <div className='flex gap-2'>
          <div className='h-10 w-24 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse' />
          <div className='h-10 w-36 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse' />
        </div>
      </div>
      <TableSkeleton rows={TAB_LIST_ROWS} cols={TAB_LIST_COLS} />
    </Card>
  );
}
