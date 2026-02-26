'use client';

/**
 * Dashboard skeleton – 100% layout match to real Overview tab.
 * Clinic: Alerts → Key Metrics → Trends → Today's Schedule → Overview row → Charts → Critical Lists.
 * Doctor: Pending Tasks → Key Metrics → Overview (Today's Appointments, Next Patient, Earnings, Quick Stats, Recent Activity, Calendar, etc.).
 */

import { Card } from '@/components/ui/Card';

function SectionHeaderSkeleton({ titleWidth = 'w-40' }) {
  return (
    <div className='section-header mb-4'>
      <div className='skeleton accent-bar-placeholder' />
      <div className={`skeleton skeleton-text ${titleWidth}`} />
    </div>
  );
}

export function DashboardSkeleton({ isDoctor = false }) {
  const statCount = isDoctor ? 8 : 4;
  const kpiGridClass = isDoctor
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 dashboard-grid'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 dashboard-grid';

  return (
    <div className='dashboard-container dashboard-skeleton-root'>
      {/* 1. Alerts / Pending Tasks – same as real: grid 3 cols, one card spans 2 */}
      <div className='dashboard-section'>
        <div className='grid grid-cols-1 lg:grid-cols-3 dashboard-grid'>
          <div className='lg:col-span-2'>
            <Card className='p-6 h-full min-h-[140px]'>
              <div className='flex items-center gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-700'>
                <div className='skeleton w-3 h-3 rounded-full' />
                <div className='skeleton skeleton-text w-32' />
              </div>
              <div className='space-y-3'>
                {[1, 2, 3].map((j) => (
                  <div key={j} className='skeleton h-12 rounded-lg' />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 2. Actions – clinic only (same as real ActionsSection: flex wrap, button placeholders) */}
      {!isDoctor && (
        <div className='dashboard-section'>
          <div className='flex flex-wrap gap-3'>
            <div className='skeleton h-9 w-44 rounded-lg' />
          </div>
        </div>
      )}

      {/* 3. Key Metrics – section header + stat cards (same as real KPISection) */}
      <div className='dashboard-section dashboard-section-key-metrics'>
        <SectionHeaderSkeleton titleWidth='w-28' />
        <div className={kpiGridClass}>
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

      {/* 4. Trends – clinic only (same as real TrendsSection: grid-cols-1 sm:grid-cols-2, 2 cards) */}
      {!isDoctor && (
        <div className='dashboard-section'>
          <div className='grid grid-cols-1 sm:grid-cols-2 dashboard-grid gap-4 items-stretch'>
            {[1, 2].map((i) => (
              <div key={i} className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='skeleton w-5 h-5 rounded shrink-0' />
                    <div className='skeleton skeleton-text w-28' />
                  </div>
                  <div className='skeleton skeleton-chart flex-1 min-h-[80px]' />
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Today's Schedule – clinic only: section header + 2-col (Appointments list | Calendar) */}
      {!isDoctor && (
        <div className='dashboard-section'>
          <SectionHeaderSkeleton titleWidth='w-36' />
          <div className='grid grid-cols-1 lg:grid-cols-2 dashboard-grid items-stretch dashboard-today-schedule-grid'>
            <div className='dashboard-card-cell dashboard-today-schedule-cell'>
              <Card className='dashboard-list-card dashboard-list-card-primary dashboard-today-schedule-card p-6 h-full flex flex-col'>
                <div className='section-header mb-4'>
                  <div className='skeleton accent-bar-placeholder' />
                  <div className='skeleton skeleton-text w-40' />
                </div>
                <div className='space-y-2 flex-1 min-h-0'>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className='skeleton skeleton-list-item' />
                  ))}
                </div>
              </Card>
            </div>
            <div className='dashboard-card-cell dashboard-today-schedule-cell'>
              <Card
                className='dashboard-list-card dashboard-list-card-primary calendar-widget-card h-full flex flex-col'
                contentClassName='calendar-widget-card-body'
              >
                <div className='relative z-10 flex-1 flex flex-col min-h-0 calendar-widget-inner'>
                  <div className='calendar-widget-header flex items-center justify-between gap-2 mb-4'>
                    <div className='skeleton accent-bar-placeholder' />
                    <div className='skeleton skeleton-text w-24 flex-1' />
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
      )}

      {/* 6. Overview row – section header + 3-col. Clinic: Summary chart | Next Patient | Patients Review. Doctor: same grid with 8 cells to match real (Today's list, Next Patient, Earnings, Quick Stats, Recent Activity, optional list, Calendar, Feedback) */}
      <div className='dashboard-section'>
        <SectionHeaderSkeleton titleWidth='w-24' />
        <div className='grid grid-cols-1 lg:grid-cols-3 dashboard-grid items-stretch'>
          {/* Clinic: Summary chart | Next Patient | Patients Review (3 cells) */}
          {!isDoctor && (
            <>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='section-header mb-4'>
                    <div className='skeleton accent-bar-placeholder' />
                    <div className='skeleton skeleton-text w-36' />
                  </div>
                  <div className='skeleton skeleton-chart flex-1 min-h-[180px]' />
                </Card>
              </div>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='section-header mb-4'>
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
                </Card>
              </div>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='section-header mb-4'>
                    <div className='skeleton accent-bar-placeholder' />
                    <div className='skeleton skeleton-text w-28' />
                  </div>
                  <div className='space-y-3 flex-1 min-h-0'>
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className='skeleton skeleton-list-item-sm' />
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {/* Doctor: 8 cells to match real overview (Today's Appointments, Next Patient, Earnings, Quick Stats, Recent Activity, Upcoming list, Calendar, Patient Feedback) */}
          {isDoctor && (
            <>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='section-header mb-4'>
                    <div className='skeleton accent-bar-placeholder' />
                    <div className='skeleton skeleton-text w-40' />
                  </div>
                  <div className='space-y-2 flex-1 min-h-0'>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className='skeleton skeleton-list-item' />
                    ))}
                  </div>
                </Card>
              </div>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='section-header mb-4'>
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
                </Card>
              </div>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6 justify-center'>
                  <div className='skeleton skeleton-text w-28 mb-2' />
                  <div className='skeleton skeleton-text-lg w-24 mb-2' />
                  <div className='skeleton skeleton-text w-20' />
                </Card>
              </div>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='skeleton skeleton-text w-24 mb-4' />
                  <div className='space-y-3'>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className='flex justify-between'>
                        <div className='skeleton skeleton-text w-20' />
                        <div className='skeleton skeleton-text w-12' />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='skeleton skeleton-text w-28 mb-4' />
                  <div className='space-y-2'>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className='skeleton skeleton-text w-full h-8' />
                    ))}
                  </div>
                </Card>
              </div>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='section-header mb-4'>
                    <div className='skeleton accent-bar-placeholder' />
                    <div className='skeleton skeleton-text w-36' />
                  </div>
                  <div className='space-y-2 flex-1 min-h-0'>
                    {[1, 2, 3].map((j) => (
                      <div key={j} className='skeleton skeleton-list-item' />
                    ))}
                  </div>
                </Card>
              </div>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='section-header mb-4'>
                    <div className='skeleton accent-bar-placeholder' />
                    <div className='skeleton skeleton-text w-24' />
                  </div>
                  <div className='skeleton flex-1 min-h-[200px] rounded-lg calendar-skeleton' />
                </Card>
              </div>
              <div className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-700'>
                    <div className='skeleton skeleton-text w-28' />
                    <div className='skeleton h-8 w-16 rounded' />
                  </div>
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <div className='skeleton skeleton-text w-20' />
                      <div className='skeleton skeleton-text w-12' />
                    </div>
                    <div className='flex justify-between'>
                      <div className='skeleton skeleton-text w-24' />
                      <div className='skeleton skeleton-text w-8' />
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 7. Charts section – clinic only (no section header; 3 chart cards, same as real) */}
      {!isDoctor && (
        <div className='dashboard-section'>
          <div className='grid grid-cols-1 lg:grid-cols-3 dashboard-grid items-stretch'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='dashboard-card-cell'>
                <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                  <div className='flex items-center gap-2 mb-3'>
                    <div className='skeleton w-1 h-4 rounded-full shrink-0' />
                    <div className='skeleton skeleton-text w-32' />
                  </div>
                  <div className='skeleton skeleton-chart flex-1 min-h-[200px]' />
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Critical Lists – clinic only (Overdue Invoices | Low Stock, 2-col; 5 rows to match DashboardListCard loading) */}
      {!isDoctor && (
        <div className='dashboard-section'>
          <div className='grid grid-cols-1 lg:grid-cols-2 dashboard-grid items-stretch'>
            <div className='dashboard-card-cell'>
              <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                <div className='section-header mb-4'>
                  <div className='skeleton accent-bar-placeholder' />
                  <div className='skeleton skeleton-text w-36' />
                </div>
                <div className='space-y-2'>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className='skeleton skeleton-list-item' />
                  ))}
                </div>
              </Card>
            </div>
            <div className='dashboard-card-cell'>
              <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col p-6'>
                <div className='section-header mb-4'>
                  <div className='skeleton accent-bar-placeholder' />
                  <div className='skeleton skeleton-text w-28' />
                </div>
                <div className='space-y-2'>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className='skeleton skeleton-list-item' />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
