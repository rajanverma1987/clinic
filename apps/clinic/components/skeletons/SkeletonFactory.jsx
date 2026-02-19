'use client';

/**
 * Skeleton component library per CursorMD/CLAUDE-AI.md (Complete Enterprise Dashboard Loading Strategy).
 * Renders route-appropriate loading placeholders; uses neutral/dark classes for theme consistency.
 */

import { Card } from '@/components/ui/Card';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useI18n } from '@/contexts/I18nContext';
import { SKELETON_TYPES } from '@/lib/loading/loading-states';

const pulse = 'animate-pulse';
const bg2 = 'bg-neutral-200 dark:bg-neutral-600';
const bg3 = 'bg-neutral-300 dark:bg-neutral-500';
const bg1 = 'bg-neutral-100 dark:bg-neutral-700';

/** One row of stat cards – for dynamic() loading fallback (e.g. dashboard stats). */
export function StatsCardsSkeleton() {
  return (
    <div className={`content-grid-4 ${pulse}`}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className='bg-white dark:bg-neutral-800 rounded-lg p-6 shadow'>
          <div className={`h-4 ${bg2} rounded w-1/2 mb-3`} />
          <div className={`h-8 ${bg3} rounded w-3/4 mb-2`} />
          <div className={`h-3 ${bg2} rounded w-1/3`} />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className={`space-y-6 ${pulse}`}>
      <StatsCardsSkeleton />
      <div className='bg-white dark:bg-neutral-800 rounded-lg p-6 shadow'>
        <div className={`h-6 ${bg3} rounded w-1/4 mb-4`} />
        <div className='content-grid-4 content-grid-gap-3'>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-20 ${bg2} rounded`} />
          ))}
        </div>
      </div>
      <div className='content-grid-3 content-grid-gap-6'>
        <div className='lg:col-span-2 bg-white dark:bg-neutral-800 rounded-lg p-6 shadow'>
          <div className={`h-6 ${bg3} rounded w-1/3 mb-4`} />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className='flex items-center space-x-4 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-600'
            >
              <div className='w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-600' />
              <div className='flex-1'>
                <div className={`h-4 ${bg3} rounded w-3/4 mb-2`} />
                <div className={`h-3 ${bg2} rounded w-1/2`} />
              </div>
              <div className={`h-8 w-20 ${bg2} rounded`} />
            </div>
          ))}
        </div>
        <div className='space-y-6'>
          <div className='bg-white dark:bg-neutral-800 rounded-lg p-6 shadow'>
            <div className={`h-6 ${bg3} rounded w-1/2 mb-4`} />
            <div className={`h-48 ${bg2} rounded`} />
          </div>
          <div className='bg-white dark:bg-neutral-800 rounded-lg p-6 shadow'>
            <div className={`h-6 ${bg3} rounded w-2/3 mb-4`} />
            <div className='space-y-3'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-10 ${bg2} rounded`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSkeleton({ fields = 6 }) {
  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg p-6 shadow space-y-6 ${pulse}`}>
      <div className={`h-8 ${bg3} rounded w-1/3 mb-6`} />
      {[...Array(fields)].map((_, i) => (
        <div key={i}>
          <div className={`h-4 ${bg3} rounded w-1/4 mb-2`} />
          <div className={`h-10 ${bg2} rounded w-full`} />
        </div>
      ))}
      <div className='flex space-x-4 pt-4'>
        <div className={`h-10 ${bg3} rounded w-32`} />
        <div className={`h-10 ${bg2} rounded w-32`} />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className={`space-y-6 ${pulse}`}>
      <div className='bg-white dark:bg-neutral-800 rounded-lg p-6 shadow'>
        <div className='flex items-start justify-between'>
          <div className='flex items-center space-x-4'>
            <div className='w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-600' />
            <div>
              <div className={`h-8 ${bg3} rounded w-48 mb-2`} />
              <div className={`h-4 ${bg2} rounded w-32`} />
            </div>
          </div>
          <div className='flex space-x-2'>
            <div className={`h-10 w-24 ${bg2} rounded`} />
            <div className={`h-10 w-24 ${bg3} rounded`} />
          </div>
        </div>
      </div>
      <div className='bg-white dark:bg-neutral-800 rounded-lg shadow'>
        <div className='border-b border-neutral-200 dark:border-neutral-600 px-6'>
          <div className='flex space-x-8 py-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-4 ${bg3} rounded w-20`} />
            ))}
          </div>
        </div>
        <div className='p-6 space-y-6'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='content-grid-2 content-grid-gap-6'>
              <div>
                <div className={`h-4 ${bg3} rounded w-1/3 mb-2`} />
                <div className={`h-6 ${bg2} rounded w-2/3`} />
              </div>
              <div>
                <div className={`h-4 ${bg3} rounded w-1/3 mb-2`} />
                <div className={`h-6 ${bg2} rounded w-2/3`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChartSkeleton({ variant = 'line' }) {
  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg p-6 shadow ${pulse}`}>
      <div className={`h-6 ${bg3} rounded w-1/3 mb-6`} />
      {variant === 'line' && (
        <div className='relative h-64 flex items-end justify-around gap-1'>
          {[40, 65, 45, 80, 55, 70, 50, 90, 60, 75, 48, 82].map((h, i) => (
            <div
              key={i}
              className={`flex-1 max-w-8 ${bg2} rounded-t`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      )}
      {variant === 'pie' && (
        <div className='flex justify-center'>
          <div className={`w-64 h-64 ${bg2} rounded-full`} />
        </div>
      )}
      {variant === 'bar' && (
        <div className='space-y-4'>
          {[70, 45, 85, 55, 90, 60].map((w, i) => (
            <div key={i} className='flex items-center space-x-4'>
              <div className={`h-4 ${bg3} rounded w-20`} />
              <div className={`h-8 ${bg2} rounded`} style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className='content-grid-3'>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`bg-white dark:bg-neutral-800 rounded-lg p-6 shadow ${pulse}`}>
          <div className='flex items-center justify-between mb-4'>
            <div className={`h-6 ${bg3} rounded w-1/2`} />
            <div className='w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-600' />
          </div>
          <div className={`h-10 ${bg3} rounded w-3/4 mb-2`} />
          <div className={`h-4 ${bg2} rounded w-1/3`} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 8 }) {
  return (
    <div
      className={`bg-white dark:bg-neutral-800 rounded-lg shadow divide-y divide-neutral-200 dark:divide-neutral-600 ${pulse}`}
    >
      {[...Array(items)].map((_, i) => (
        <div key={i} className='px-6 py-4 flex items-center space-x-4'>
          <div className='w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-600' />
          <div className='flex-1 space-y-2'>
            <div className={`h-4 ${bg3} rounded w-2/3`} />
            <div className={`h-3 ${bg2} rounded w-1/2`} />
          </div>
          <div className={`h-8 w-16 ${bg2} rounded`} />
        </div>
      ))}
    </div>
  );
}

/** Queue / waiting list placeholder for dynamic() loading. */
export function QueueSkeleton() {
  return <ListSkeleton items={5} />;
}

function GridSkeleton({ items = 9 }) {
  return (
    <div className='content-grid-3 content-grid-gap-6'>
      {[...Array(items)].map((_, i) => (
        <div
          key={i}
          className={`bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden ${pulse}`}
        >
          <div className={`h-48 ${bg2}`} />
          <div className='p-4 space-y-3'>
            <div className={`h-5 ${bg3} rounded w-3/4`} />
            <div className={`h-4 ${bg2} rounded w-full`} />
            <div className={`h-4 ${bg2} rounded w-5/6`} />
            <div className='flex justify-between items-center pt-2'>
              <div className={`h-6 ${bg3} rounded w-1/4`} />
              <div className={`h-8 w-20 ${bg3} rounded`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow p-6 ${pulse}`}>
      <div className='flex items-center justify-between mb-6'>
        <div className={`h-8 ${bg3} rounded w-1/4`} />
        <div className='flex space-x-2'>
          <div className='h-10 w-10 rounded bg-neutral-200 dark:bg-neutral-600' />
          <div className='h-10 w-10 rounded bg-neutral-200 dark:bg-neutral-600' />
        </div>
      </div>
      <div className='grid grid-cols-7 gap-2 mb-4'>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
          <div key={d} className={`h-8 ${bg2} rounded text-center`} />
        ))}
      </div>
      <div className='grid grid-cols-7 gap-2'>
        {[...Array(35)].map((_, i) => (
          <div
            key={i}
            className={`h-24 ${bg1} rounded border-2 border-neutral-200 dark:border-neutral-600`}
          >
            <div className={`h-5 ${bg3} rounded m-1 w-1/3`} />
            <div className='space-y-1 p-1'>
              <div className={`h-3 ${bg2} rounded`} />
              <div className={`h-3 ${bg2} rounded`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanSkeleton({ columns = 3 }) {
  return (
    <div className={`flex space-x-4 overflow-x-auto ${pulse}`}>
      {[...Array(columns)].map((_, i) => (
        <div
          key={i}
          className='flex-shrink-0 w-80 bg-neutral-100 dark:bg-neutral-700/50 rounded-lg p-4'
        >
          <div className={`h-6 ${bg3} rounded w-1/2 mb-4`} />
          <div className='space-y-3'>
            {[...Array(4)].map((_, j) => (
              <div key={j} className='bg-white dark:bg-neutral-800 rounded-lg p-4 shadow'>
                <div className={`h-4 ${bg3} rounded w-3/4 mb-2`} />
                <div className={`h-3 ${bg2} rounded w-1/2 mb-3`} />
                <div className='flex items-center space-x-2'>
                  <div className='w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-600' />
                  <div className={`h-3 ${bg2} rounded w-16`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VideoPlaceholderSkeleton() {
  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden ${pulse}`}>
      <div className='aspect-video bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center'>
        <div className='w-20 h-20 rounded-full border-4 border-neutral-300 dark:border-neutral-500 flex items-center justify-center'>
          <div className={`w-10 h-10 ${bg3} rounded`} />
        </div>
      </div>
      <div className='p-4 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-600'>
        <div className='flex gap-2'>
          <div className={`h-10 w-10 ${bg2} rounded`} />
          <div className={`h-10 w-10 ${bg2} rounded`} />
          <div className={`h-10 w-10 ${bg2} rounded`} />
        </div>
        <div className={`h-10 w-24 ${bg2} rounded`} />
      </div>
    </div>
  );
}

function GenericSkeleton() {
  return (
    <div className={`space-y-4 ${pulse}`}>
      <div className={`h-8 ${bg3} rounded w-1/3`} />
      <div className={`h-32 ${bg2} rounded w-full`} />
      <div className={`h-4 ${bg2} rounded w-2/3`} />
      <div className={`h-4 ${bg2} rounded w-1/2`} />
    </div>
  );
}

/**
 * Report tab content skeleton – 100% layout match to reports tab (summary cards, chart card, table card).
 * Same structure as revenue/patients/appointments tabs: content-grid-4, Card chart, Card table.
 */
export function ReportTabSkeleton() {
  const { t } = useI18n();
  return (
    <div
      className={`space-y-6 ${pulse}`}
      aria-busy='true'
      aria-label={t('common.ariaLabelLoadingReport')}
    >
      {/* Summary cards – same as real reports: content-grid-4, Card with p-4 */}
      <div className='content-grid-4'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className='p-4'>
              <div className={`h-4 ${bg2} rounded w-1/2 mb-3`} />
              <div className={`h-8 ${bg3} rounded w-3/4 mb-2`} />
              <div className={`h-3 ${bg2} rounded w-1/3`} />
            </div>
          </Card>
        ))}
      </div>
      {/* Chart card – same as real: Card, header row (title + button), chart area */}
      <Card>
        <div className='flex items-center justify-between mb-4'>
          <div className={`h-6 ${bg3} rounded w-1/4`} />
          <div className={`h-9 ${bg2} rounded w-28`} />
        </div>
        <div className={`h-64 ${bg2} rounded`} />
      </Card>
      {/* Table card – same as real: Card, header row, table rows */}
      <Card className='overflow-hidden'>
        <div className='px-6 py-4 border-b border-neutral-200 dark:border-neutral-600'>
          <div className={`h-6 ${bg3} rounded w-1/3`} />
        </div>
        <div className='divide-y divide-neutral-200 dark:divide-neutral-600'>
          {[...Array(6)].map((_, i) => (
            <div key={i} className='px-6 py-4 flex items-center gap-4'>
              <div className={`h-4 ${bg2} rounded flex-1 max-w-[120px]`} />
              <div className={`h-4 ${bg2} rounded flex-1 max-w-[80px]`} />
              <div className={`h-4 ${bg2} rounded flex-1 max-w-[100px]`} />
              <div className={`h-8 w-16 ${bg2} rounded`} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** Default list page size; keep in sync with dashboard tab limits for consistent skeleton row count. */
const DEFAULT_LIST_PAGE_SIZE = 10;

/**
 * Appointments list skeleton – 100% layout match to dashboard AppointmentsTab (Card, section header, stats grid, table).
 */
export function AppointmentsListSkeleton() {
  return (
    <Card
      className={`dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col ${pulse}`}
      aria-busy='true'
    >
      {/* Section Header – same as real: accent bar + title + filter/export buttons */}
      <div className='section-header flex items-center gap-3 mb-4'>
        <div className={`w-1 h-4 ${bg3} rounded-full flex-shrink-0`} />
        <div className={`h-6 ${bg3} rounded w-32`} />
        <div className='flex gap-2 ml-auto'>
          <div className={`h-10 w-24 ${bg2} rounded`} />
          <div className={`h-10 w-36 ${bg2} rounded`} />
        </div>
      </div>

      {/* Stats Bar – same grid as real: grid-cols-2 sm:grid-cols-4 */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='text-center'>
            <div className={`h-8 ${bg3} rounded w-16 mx-auto mb-2`} />
            <div className={`h-3 ${bg2} rounded w-20 mx-auto`} />
          </div>
        ))}
      </div>

      {/* Table – same wrapper as real */}
      <div className='flex-1 overflow-auto'>
        <TableSkeleton rows={DEFAULT_LIST_PAGE_SIZE} cols={4} />
      </div>
    </Card>
  );
}

/**
 * Prescriptions list skeleton – 100% layout match to dashboard PrescriptionsTab (Card, section header, stats grid, table).
 */
export function PrescriptionsListSkeleton() {
  return (
    <Card
      className={`dashboard-list-card dashboard-list-card-primary p-6 h-full flex flex-col ${pulse}`}
      aria-busy='true'
    >
      {/* Section Header – same as real */}
      <div className='section-header flex items-center gap-3 mb-4'>
        <div className={`w-1 h-4 ${bg3} rounded-full flex-shrink-0`} />
        <div className={`h-6 ${bg3} rounded w-32`} />
        <div className='flex gap-2 ml-auto'>
          <div className={`h-10 w-24 ${bg2} rounded`} />
          <div className={`h-10 w-36 ${bg2} rounded`} />
        </div>
      </div>

      {/* Stats Bar – same grid as real */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-700'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='text-center'>
            <div className={`h-8 ${bg3} rounded w-16 mx-auto mb-2`} />
            <div className={`h-3 ${bg2} rounded w-20 mx-auto`} />
          </div>
        ))}
      </div>

      {/* Table – same wrapper as real */}
      <div className='flex-1 overflow-auto'>
        <TableSkeleton rows={DEFAULT_LIST_PAGE_SIZE} cols={4} />
      </div>
    </Card>
  );
}

/**
 * Patients list skeleton – list of items (avatar + lines). Use for patients list views.
 */
export function PatientsListSkeleton({ items = 10 }) {
  return <ListSkeleton items={items} />;
}

/**
 * Tab panel content skeleton – for patient detail, settings, or any tabbed detail view while tab is pending.
 */
export function TabContentSkeleton() {
  return (
    <div className={`space-y-6 ${pulse}`} aria-busy='true'>
      <div className='content-grid-2 content-grid-gap-6'>
        <div className={`bg-white dark:bg-neutral-800 rounded-lg p-6 shadow`}>
          <div className={`h-6 ${bg3} rounded w-1/3 mb-4`} />
          <div className='space-y-4'>
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className={`h-4 ${bg2} rounded w-1/4 mb-2`} />
                <div className={`h-5 ${bg2} rounded w-2/3`} />
              </div>
            ))}
          </div>
        </div>
        <div className={`bg-white dark:bg-neutral-800 rounded-lg p-6 shadow`}>
          <div className={`h-6 ${bg3} rounded w-1/3 mb-4`} />
          <div className='space-y-3'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-10 ${bg2} rounded`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders a skeleton by type. Use for progressive loading fallbacks.
 * @param {string} type - SKELETON_TYPES.DASHBOARD | TABLE | FORM | DETAIL | CHART | CARD | LIST | GRID | CALENDAR | KANBAN
 * @param {number} count - Optional count for TABLE rows, CARD/LIST/GRID items, KANBAN columns, FORM fields
 * @param {string} variant - Optional variant for CHART ('line' | 'pie' | 'bar')
 */
export function SkeletonFactory({ type, count = 1, variant = 'default' }) {
  const skeletons = {
    [SKELETON_TYPES.DASHBOARD]: <DashboardSkeleton />,
    [SKELETON_TYPES.TABLE]: <TableSkeleton rows={count >= 1 ? count : 10} cols={5} />,
    [SKELETON_TYPES.FORM]: <FormSkeleton fields={count >= 1 ? count : 6} />,
    [SKELETON_TYPES.DETAIL]: <DetailSkeleton />,
    [SKELETON_TYPES.CHART]: (
      <ChartSkeleton variant={variant === 'bar' || variant === 'pie' ? variant : 'line'} />
    ),
    [SKELETON_TYPES.CARD]: <CardSkeleton count={count >= 1 ? count : 3} />,
    [SKELETON_TYPES.LIST]: <ListSkeleton items={count >= 1 ? count : 8} />,
    [SKELETON_TYPES.GRID]: <GridSkeleton items={count >= 1 ? count : 9} />,
    [SKELETON_TYPES.CALENDAR]: <CalendarSkeleton />,
    [SKELETON_TYPES.KANBAN]: <KanbanSkeleton columns={count >= 1 ? count : 3} />,
    'video-placeholder': <VideoPlaceholderSkeleton />,
  };
  return skeletons[type] ?? <GenericSkeleton />;
}

export { SKELETON_TYPES };
