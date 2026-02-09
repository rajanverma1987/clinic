'use client';

import { Card } from '@/components/ui/Card';

/**
 * Full-dashboard skeleton matching real layout (enterprise-style: layout-preserving, shimmer).
 * Clinic: 4 stat cards → 2-col (Today's Appointments | Calendar) → 3-col (Summary, Next Patient, Review).
 * Doctor: 8 stat cards → 2-col → 3-col with more cells.
 * Uses same grid classes as real dashboard to avoid layout shift.
 */
export function DashboardSkeleton({ isDoctor = false }) {
  const statCount = isDoctor ? 8 : 4;
  const statGridClass = isDoctor
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 dashboard-grid'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 dashboard-grid';

  return (
    <div className='dashboard-container dashboard-skeleton-root'>
      {/* Stats row – matches StatsCard grid */}
      <div className='dashboard-section'>
        <div className={statGridClass}>
          {Array.from({ length: statCount }).map((_, i) => (
            <Card key={i} className='stat-card'>
              <div className='relative z-10 p-4 h-full flex flex-col justify-between'>
                <div className='skeleton skeleton-text w-24 mb-3' />
                <div className='skeleton skeleton-text-lg w-32 mb-3' />
                <div className='flex justify-end'>
                  <div className='skeleton skeleton-stat-icon' />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Main: 2-col – Today's Appointments | Calendar (same as real dashboard) */}
      <div className='dashboard-section'>
        <div className='grid grid-cols-1 lg:grid-cols-2 dashboard-grid items-stretch'>
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
                <div className='section-header'>
                  <div className='skeleton accent-bar-placeholder' />
                  <div className='skeleton skeleton-text w-40' />
                </div>
                <div className='space-y-2 flex-1 min-h-0'>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className='skeleton skeleton-list-item' />
                  ))}
                </div>
              </div>
            </Card>
          </div>
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary calendar-widget-card h-full flex flex-col'>
              <div className='relative z-10 flex-1 flex flex-col min-h-0 calendar-widget-inner'>
                <div className='calendar-widget-header'>
                  <div className='skeleton accent-bar-placeholder' />
                  <div className='skeleton skeleton-text w-24' />
                  <div className='flex items-center gap-1'>
                    <div className='skeleton w-7 h-7 rounded' />
                    <div className='skeleton w-7 h-7 rounded' />
                  </div>
                </div>
                <div className='skeleton flex-1 min-h-[220px] rounded-lg calendar-skeleton' />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 3-col: Summary, Next Patient / list, Patients Review */}
      <div className='dashboard-section'>
        <div className='grid grid-cols-1 lg:grid-cols-3 dashboard-grid items-stretch'>
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
                <div className='section-header'>
                  <div className='skeleton accent-bar-placeholder' />
                  <div className='skeleton skeleton-text w-36' />
                </div>
                <div className='skeleton skeleton-chart flex-1 min-h-[180px]' />
              </div>
            </Card>
          </div>
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
                <div className='section-header'>
                  <div className='skeleton accent-bar-placeholder' />
                  <div className='skeleton skeleton-text w-32' />
                </div>
                <div className='flex flex-col gap-3 flex-1 min-h-0'>
                  <div className='skeleton h-14 rounded-lg' />
                  <div className='skeleton h-10 rounded w-3/4' />
                  <div className='skeleton h-10 rounded w-1/2' />
                  <div className='flex gap-2 mt-auto'>
                    <div className='skeleton h-9 rounded w-24' />
                    <div className='skeleton h-9 rounded w-24' />
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
                <div className='section-header'>
                  <div className='skeleton accent-bar-placeholder' />
                  <div className='skeleton skeleton-text w-28' />
                </div>
                <div className='space-y-3 flex-1 min-h-0'>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className='skeleton skeleton-list-item-sm' />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
