'use client';

import { Card } from '@/components/ui/Card';

/**
 * Full-dashboard skeleton matching real layout: header, stats row, then 3-col
 * content grid (Summary, Today, List, Patients Review, Calendar, Appointment Request).
 * Uses dashboard-container, dashboard-section, dashboard-card-cell and skeleton
 * utilities from dashboard.css for consistent heights and spacing.
 */
export function DashboardSkeleton() {
  return (
    <div className='dashboard-container'>
      {/* Header skeleton – matches PageHeader (title, subtitle, actions) */}
      <div
        className='sticky-header-bar rounded-lg border border-neutral-200 bg-white'
        style={{
          minHeight: 'var(--dashboard-header-height, 70px)',
          padding: 'var(--space-3) var(--dashboard-header-padding-x, 24px)',
          marginBottom: 'var(--dashboard-element-gap, 16px)',
        }}
      >
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='skeleton w-3 h-3 rounded-full shrink-0' />
              <div className='skeleton skeleton-text-lg w-48 sm:w-64' />
            </div>
            <div className='skeleton skeleton-text w-40' style={{ marginLeft: '22px' }} />
          </div>
          <div className='flex items-center gap-3 shrink-0'>
            <div className='skeleton w-10 h-10 rounded-xl' />
            <div className='skeleton w-10 h-10 rounded-xl' />
          </div>
        </div>
      </div>

      {/* Stats row – 4 cards, matches non-doctor layout */}
      <div className='dashboard-section'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className='stat-card'>
              <div className='relative z-10 p-4 flex flex-col justify-between h-full'>
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

      {/* Main content – 3-col grid, each cell full height */}
      <div className='dashboard-section'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 items-stretch'>
          {/* 1. Patients Summary chart */}
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='skeleton w-1 h-4 rounded-full shrink-0' />
                  <div className='skeleton skeleton-text w-40' />
                </div>
                <div className='skeleton skeleton-chart flex-1 min-h-[200px]' />
              </div>
            </Card>
          </div>

          {/* 2. Today Appointments list */}
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='skeleton w-1 h-4 rounded-full shrink-0' />
                  <div className='skeleton skeleton-text w-36' />
                </div>
                <div className='space-y-2 flex-1 min-h-0'>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className='skeleton skeleton-list-item' />
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* 3. List card placeholder */}
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='skeleton w-1 h-4 rounded-full shrink-0' />
                  <div className='skeleton skeleton-text w-32' />
                </div>
                <div className='space-y-2 flex-1 min-h-0'>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className='skeleton skeleton-list-item' />
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* 4. Patients Review */}
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='skeleton w-1 h-4 rounded-full shrink-0' />
                  <div className='skeleton skeleton-text w-28' />
                </div>
                <div className='space-y-3'>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className='skeleton skeleton-list-item-sm' />
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* 5. Calendar */}
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary calendar-widget-card h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0 calendar-widget-inner'>
                <div className='flex items-center gap-2 mb-3'>
                  <div className='skeleton w-1 h-4 rounded-full shrink-0' />
                  <div className='skeleton skeleton-text w-24' />
                </div>
                <div className='skeleton flex-1 min-h-[200px] rounded-lg' />
              </div>
            </Card>
          </div>

          {/* 6. Appointment Request */}
          <div className='dashboard-card-cell'>
            <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
              <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
                <div className='flex items-center gap-2 mb-4'>
                  <div className='skeleton w-1 h-4 rounded-full shrink-0' />
                  <div className='skeleton skeleton-text w-36' />
                </div>
                <div className='space-y-2'>
                  {[1, 2, 3].map((j) => (
                    <div key={j} className='skeleton' style={{ height: '60px', borderRadius: 'var(--radius-lg)' }} />
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
