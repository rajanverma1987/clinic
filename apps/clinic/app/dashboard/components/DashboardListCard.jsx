'use client';

import TodayAppointments from '@/components/dashboard/TodayAppointments';
import { ChevronRightIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React from 'react';

function DashboardListCardInner({
  title,
  data = [],
  loading = false,
  colorScheme = 'primary',
  renderItem,
  emptyMessage = 'No items to display',
  EmptyIcon,
  showSeeAll = false,
  seeAllLink,
  onSeeAll,
  compact = false,
  /** Optional: call when row is hovered for prefetch (item) => void */
  onRowMouseEnter,
  /** When set, lists with data.length >= this value use a virtualized list (e.g. 15) */
  virtualizeAbove = null,
  /** Height of virtualized list area in px (used when virtualizeAbove is set) */
  virtualListHeight = 400,
}) {
  const { t } = useI18n();
  const router = useRouter();
  if (loading) {
    return (
      <Card
        className={`dashboard-list-card dashboard-list-card-${colorScheme} h-full flex flex-col ${compact ? 'dashboard-list-card--compact' : ''}`}
      >
        <motion.div
          className='relative z-10 p-4 flex-1 flex flex-col min-h-0'
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className='section-header'>
            <div
              className='skeleton w-1 h-4 rounded-full shrink-0'
              style={{ width: '3px', height: '16px' }}
            />
            <div className='skeleton skeleton-text w-40' />
          </div>
          <div className='space-y-2 flex-1 min-h-0'>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className='skeleton skeleton-list-item' />
            ))}
          </div>
        </motion.div>
      </Card>
    );
  }

  return (
    <Card
      elevated={true}
      className={`dashboard-list-card dashboard-list-card-${colorScheme} dashboard-card-gradient h-full flex flex-col min-h-0 ${compact ? 'dashboard-list-card--compact' : ''}`}
    >
      {/* Decorative orb */}
      <div
        className={`radial-orb radial-orb-${colorScheme}`}
        style={{
          width: '300px',
          height: '300px',
          top: '-120px',
          right: '-120px',
        }}
      />

      {/* Content – skeleton morphs into real content (AnimatePresence) */}
      <AnimatePresence mode='wait'>
        <motion.div
          key='content'
          className='relative z-10 p-4 flex-1 flex flex-col'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header – alignment from dashboard.css .section-header */}
          <div className='section-header mb-3'>
            <div className={`accent-bar accent-bar-${colorScheme}`} />
            <h2 className='section-title'>{title}</h2>
          </div>

          {/* List – virtualized when long (virtualizeAbove), otherwise layout animation */}
          <div className={`flex-1 min-h-0 ${compact ? 'dashboard-list-card__list--compact' : ''}`}>
            {data && data.length > 0 ? (
              virtualizeAbove != null && data.length >= virtualizeAbove ? (
                <TodayAppointments
                  appointments={data}
                  renderItem={(item, index) =>
                    onRowMouseEnter ? (
                      <div onMouseEnter={() => onRowMouseEnter(item)} style={{ height: '100%' }}>
                        {renderItem(item, index)}
                      </div>
                    ) : (
                      renderItem(item, index)
                    )
                  }
                  listHeight={virtualListHeight}
                  estimateSize={80}
                  overscan={5}
                  className='rounded'
                />
              ) : (
                <div className='overflow-y-auto'>
                  <motion.div
                    className='space-y-2'
                    layout
                    transition={{ type: 'layout', duration: 0.2 }}
                  >
                    {data.map((item, index) => (
                      <motion.div
                        key={item._id || item.id || index}
                        layout
                        transition={{ type: 'layout', duration: 0.2 }}
                        className={item._updated ? 'data-row-updated rounded' : ''}
                        onMouseEnter={onRowMouseEnter ? () => onRowMouseEnter(item) : undefined}
                      >
                        {renderItem(item, index)}
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )
            ) : (
              <div className='empty-state'>
                {EmptyIcon && <div className='empty-state-icon'>{EmptyIcon}</div>}
                <p className='text-neutral-500 dark:text-neutral-400 text-body-sm'>
                  {emptyMessage}
                </p>
              </div>
            )}
          </div>

          {/* See All Link - positioned at bottom for better UX */}
          {showSeeAll && data && data.length > 0 && (
            <div className='pt-3 border-t border-neutral-200 dark:border-neutral-700 mt-auto'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                fullWidth
                onClick={() => {
                  if (onSeeAll) {
                    onSeeAll();
                  } else if (seeAllLink) {
                    router.push(seeAllLink);
                  }
                }}
                className='section-header-action text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30'
                aria-label={t('dashboard.seeAll')}
              >
                <span>{t('dashboard.seeAll')}</span>
                <ChevronRightIcon
                  className='icon icon-xs group-hover:translate-x-0.5 transition-transform'
                  ariaHidden
                />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}

export const DashboardListCard = React.memo(DashboardListCardInner);
