'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function DashboardListCard({
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
  if (loading) {
    return (
      <Card
        className={`dashboard-list-card dashboard-list-card-${colorScheme} h-full flex flex-col ${compact ? 'dashboard-list-card--compact' : ''}`}
      >
        <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
          <div className='flex items-center gap-2 mb-4'>
            <div className='skeleton w-1 h-4 rounded-full shrink-0' />
            <div className='skeleton skeleton-text w-40' />
          </div>
          <div className='space-y-2 flex-1 min-h-0'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='skeleton skeleton-list-item' />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      elevated={true}
      className={`dashboard-list-card dashboard-list-card-${colorScheme} dashboard-card-gradient ${compact ? 'dashboard-list-card--compact' : ''}`}
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

      {/* Content */}
      <div className='relative z-10 p-4 flex-1 flex flex-col'>
        {/* Header */}
        <div className='section-header'>
          <div className={`accent-bar accent-bar-${colorScheme}`} />
          <h2 className='section-title'>{title}</h2>
        </div>

        {/* List */}
        <div
          className={`flex-1 overflow-y-auto ${compact ? 'dashboard-list-card__list--compact' : ''}`}
        >
          {data && data.length > 0 ? (
            <div className='space-y-2'>{data.map((item, index) => renderItem(item, index))}</div>
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
              See All
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
