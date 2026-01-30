'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';
import { AnimatePresence, motion } from 'framer-motion';

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
}) {
  const { t } = useI18n();
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
          <div className='flex items-center gap-2 mb-4'>
            <div className='skeleton w-1 h-4 rounded-full shrink-0' />
            <div className='skeleton skeleton-text w-40' />
          </div>
          <div className='space-y-2 flex-1 min-h-0'>
            {[1, 2, 3, 4].map((i) => (
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
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          className='relative z-10 p-4 flex-1 flex flex-col'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
        {/* Header */}
        <div className='section-header' style={{ alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div className={`accent-bar accent-bar-${colorScheme}`} style={{ flexShrink: 0, height: '20px', width: '4px' }} />
          <h2 className='section-title' style={{ margin: 0, fontSize: '16px', fontWeight: '600', lineHeight: '20px' }}>{title}</h2>
        </div>

        {/* List – layout animation for reordering (Framer Motion) */}
        <div
          className={`flex-1 overflow-y-auto ${compact ? 'dashboard-list-card__list--compact' : ''}`}
        >
          {data && data.length > 0 ? (
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
                >
                  {renderItem(item, index)}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className='empty-state'>
              {EmptyIcon && <div className='empty-state-icon'>{EmptyIcon}</div>}
              <p className='text-neutral-500 text-body-sm'>{emptyMessage}</p>
            </div>
          )}
        </div>

        {/* See All Link */}
        {showSeeAll && data && data.length > 0 && (
          <div className='pt-3 border-t border-neutral-200 mt-3'>
            <Button
              variant='link'
              size='sm'
              className='w-full justify-center'
              onClick={() => {
                if (onSeeAll) {
                  onSeeAll();
                } else if (seeAllLink) {
                  window.location.href = seeAllLink;
                }
              }}
            >
              {t('dashboard.seeAll')}
            </Button>
          </div>
        )}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}

export const DashboardListCard = React.memo(DashboardListCardInner);
