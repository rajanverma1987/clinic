'use client';

import { Card } from '@/components/ui/Card';

export function DashboardSkeleton() {
  return (
    <div style={{ padding: '0 10px' }}>
      {/* Dashboard Header Skeleton */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Card className='bg-white rounded-[10px] border-2 border-neutral-100'>
          <div style={{ padding: '12px 12px 12px 10px' }}>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='skeleton w-10 h-10 rounded-full' />
                  <div className='skeleton skeleton-text-lg w-64' />
                </div>
                <div className='skeleton skeleton-text w-48' style={{ marginLeft: '22px' }} />
              </div>
              <div className='flex items-center gap-3'>
                <div className='skeleton w-10 h-10 rounded-xl' />
                <div className='skeleton w-10 h-10 rounded-xl' />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions Skeleton */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Card className='border-2 border-neutral-100 bg-gradient-to-br from-white to-neutral-50'>
          <div style={{ padding: '24px 24px 24px 10px' }}>
            <div className='flex items-center mb-4' style={{ gap: 'var(--gap-2)' }}>
              <div className='skeleton w-2 h-2 rounded-full' />
              <div className='skeleton skeleton-text w-32' />
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className='quick-action-btn' style={{ pointerEvents: 'none' }}>
                  <div className='skeleton w-12 h-12 rounded-xl mb-2' />
                  <div className='skeleton skeleton-text w-20' />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Key Statistics Cards Skeleton */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' style={{ gap: 'var(--gap-4)' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className='stat-card'>
              <div className='relative z-10' style={{ padding: '24px 24px 24px 10px' }}>
                <div className='skeleton skeleton-text w-24 mb-4' />
                <div className='skeleton skeleton-text-lg w-32 mb-4' />
                <div className='flex justify-end'>
                  <div className='skeleton w-12 h-12 rounded-xl' />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts Section Skeleton */}
      <div style={{ marginBottom: 'var(--space-10)' }}>
        <div className='grid grid-cols-1 lg:grid-cols-2' style={{ gap: 'var(--gap-6)' }}>
          {[1, 2].map((i) => (
            <Card key={i} className='chart-card'>
              <div className='relative z-10' style={{ padding: '24px 24px 24px 10px' }}>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='skeleton w-4 h-6 rounded' />
                  <div className='skeleton skeleton-text w-48' />
                </div>
                <div className='skeleton' style={{ height: '220px', borderRadius: 'var(--radius-lg)' }} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Lists Section - 3 columns Skeleton */}
      <div
        className='grid grid-cols-1 lg:grid-cols-3'
        style={{ gap: 'var(--gap-6)', marginBottom: 'var(--space-10)' }}
      >
        {[1, 2, 3].map((i) => (
          <Card key={i} className='dashboard-list-card'>
            <div className='relative z-10' style={{ padding: '24px 24px 24px 10px' }}>
              <div className='flex items-center gap-3 mb-6'>
                <div className='skeleton w-4 h-6 rounded' />
                <div className='skeleton skeleton-text w-40' />
              </div>
              <div className='space-y-3'>
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className='skeleton' style={{ height: '80px', borderRadius: 'var(--radius-xl)' }} />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Second Row Lists - 2 columns Skeleton */}
      <div className='grid grid-cols-1 lg:grid-cols-2' style={{ gap: 'var(--gap-6)' }}>
        {[1, 2].map((i) => (
          <Card key={i} className='dashboard-list-card'>
            <div className='relative z-10' style={{ padding: '24px 24px 24px 10px' }}>
              <div className='flex items-center gap-3 mb-6'>
                <div className='skeleton w-4 h-6 rounded' />
                <div className='skeleton skeleton-text w-40' />
              </div>
              <div className='space-y-3'>
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className='skeleton' style={{ height: '80px', borderRadius: 'var(--radius-xl)' }} />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
