'use client';

import { ChevronRightIcon, RefreshCwIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';
import { useIncrementalAppointments } from '@/hooks/useIncrementalAppointments';
import { useVirtualizer } from '@tanstack/react-virtual';
import Link from 'next/link';
import { useRef } from 'react';
import { AppointmentListItem } from './AppointmentListItem';

const ITEM_HEIGHT = 80; // px — approximate height of each AppointmentListItem row

/**
 * AppointmentsList component
 * Displays a list of appointments using incremental updates
 */
export function AppointmentsList({
  appointments,
  loading,
  onRefresh,
  limit = 10,
  hideRefreshInList = false,
  /** When set, list is scrollable with this many items visible (e.g. 5); all up to limit are shown */
  visibleCount,
}) {
  const { t } = useI18n();

  if (loading && (!appointments || appointments.length === 0)) {
    return (
      <div className='appointments-list appointments-list-loading'>
        <div className='space-y-2'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='skeleton skeleton-list-item rounded-lg' />
          ))}
        </div>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[120px] text-center appointments-list-empty'>
        <p className='text-neutral-500 dark:text-neutral-400 mb-4'>
          {t('appointments.noAppointmentsFound')}
        </p>
        {onRefresh && !hideRefreshInList && (
          <Button
            variant='ghost'
            size='sm'
            iconOnly
            onClick={onRefresh}
            aria-label={t('common.refresh')}
          >
            <RefreshCwIcon className='icon icon-sm' ariaHidden />
          </Button>
        )}
      </div>
    );
  }

  const displayAppointments = limit ? appointments.slice(0, limit) : appointments;
  const isScrollable = visibleCount != null && displayAppointments.length > visibleCount;

  return (
    <div className='appointments-list'>
      {onRefresh && !hideRefreshInList && (
        <div className='flex justify-end mb-3'>
          <Button
            variant='ghost'
            size='sm'
            iconOnly
            onClick={onRefresh}
            aria-label={t('common.refresh')}
          >
            <RefreshCwIcon className='icon icon-sm' ariaHidden />
          </Button>
        </div>
      )}
      {isScrollable ? (
        <VirtualAppointmentsList appointments={displayAppointments} visibleCount={visibleCount} />
      ) : (
        <div className='space-y-2'>
          {displayAppointments.map((appointment) => (
            <AppointmentListItem
              key={appointment._id || appointment.id}
              appointment={appointment}
            />
          ))}
        </div>
      )}
      {appointments.length > limit && (
        <div className='mt-4 text-center'>
          <p className='text-sm text-neutral-500 dark:text-neutral-400'>
            {t('common.showing')} {limit} {t('common.of')} {appointments.length}
          </p>
        </div>
      )}
    </div>
  );
}

/** Virtualized list for scrollable appointment containers (visibleCount is set). */
function VirtualAppointmentsList({ appointments, visibleCount }) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: appointments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 3,
  });

  const containerHeight = visibleCount * ITEM_HEIGHT;

  return (
    <div
      ref={parentRef}
      className='appointments-list-scroll overflow-auto'
      style={{ height: containerHeight, maxHeight: containerHeight }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <div className='pb-2'>
              <AppointmentListItem appointment={appointments[virtualItem.index]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * AppointmentsListWithHook component
 * Wrapper that uses useIncrementalAppointments hook.
 * When title and seeAllHref are provided, renders the full card with header
 * (title, refresh icon, See all link) in one row.
 */
export function AppointmentsListWithHook({
  filters = {},
  limit = 10,
  visibleCount,
  title,
  seeAllHref,
  cardClassName,
}) {
  const { appointments, loading, error, refresh } = useIncrementalAppointments({
    ...filters,
    limit,
    status: filters.status || 'scheduled',
  });

  const { t } = useI18n();
  const renderCard = Boolean(title && seeAllHref);

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[120px] text-center'>
        <p className='text-status-error mb-4'>{error}</p>
        <Button variant='primary' size='sm' onClick={refresh}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  const listContent = (
    <AppointmentsList
      appointments={appointments}
      loading={loading}
      onRefresh={refresh}
      limit={limit}
      visibleCount={visibleCount}
      hideRefreshInList={renderCard}
    />
  );

  if (renderCard) {
    return (
      <div className={cardClassName}>
        <div className='section-header mb-4'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <div className='accent-bar accent-bar-primary' />
              <h2 className='section-title'>{title}</h2>
            </div>
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                iconOnly
                onClick={refresh}
                aria-label={t('common.refresh')}
              >
                <RefreshCwIcon className='icon icon-sm' ariaHidden />
              </Button>
              <Link
                href={seeAllHref}
                className='section-header-action inline-flex items-center justify-center gap-1.5 py-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-sm font-medium shrink-0'
                aria-label={t('dashboard.seeAll')}
              >
                <span className='text-sm'>{t('dashboard.seeAll')}</span>
                <ChevronRightIcon className='icon icon-xs' ariaHidden />
              </Link>
            </div>
          </div>
        </div>
        {listContent}
      </div>
    );
  }

  return listContent;
}
