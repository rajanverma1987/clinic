'use client';

import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';

export function PatientsSummaryChart({ data, loading = false }) {
  const { t, locale } = useI18n();

  // Calculate totals
  const newPatients = data?.newPatients || 0;
  const oldPatients = data?.oldPatients || 0;
  const totalPatients = data?.totalPatients || newPatients + oldPatients;

  // Calculate percentages for donut chart
  const newPatientsPercent = totalPatients > 0 ? (newPatients / totalPatients) * 100 : 0;
  const oldPatientsPercent = totalPatients > 0 ? (oldPatients / totalPatients) * 100 : 0;

  // Donut chart configuration
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 20;

  // Calculate offsets - old patients first (orange), then new patients (blue) on top
  const oldPatientsArc = (oldPatientsPercent / 100) * circumference;
  const newPatientsArc = (newPatientsPercent / 100) * circumference;

  const oldPatientsOffset = circumference - oldPatientsArc;
  const newPatientsOffset = circumference - newPatientsArc - oldPatientsArc;

  if (loading) {
    return (
      <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
        <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
          <div className='flex items-center gap-2 mb-4'>
            <div className='skeleton w-1 h-4 rounded-full shrink-0' />
            <div className='skeleton skeleton-text w-44' />
          </div>
          <div className='skeleton skeleton-chart flex-1 min-h-[200px]' />
        </div>
      </Card>
    );
  }

  return (
    <Card className='dashboard-list-card dashboard-list-card-primary'>
      <div className='relative z-10 p-4 h-full flex flex-col'>
        {/* Header */}
        <div className='section-header'>
          <div className='accent-bar accent-bar-primary' />
          <h2 className='section-title'>
            {t('dashboard.patientsSummary')}{' '}
            {new Date().toLocaleDateString(locale || 'en', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        {/* Donut Chart */}
        <div className='flex flex-col items-center justify-center py-4 flex-1'>
          <div className='relative' style={{ width: '200px', height: '200px' }}>
            <svg width='200' height='200' className='transform -rotate-90'>
              {/* Background circle */}
              <circle
                cx='100'
                cy='100'
                r={radius}
                fill='none'
                stroke='var(--color-neutral-200)'
                strokeWidth={strokeWidth}
              />
              {/* Old Patients (warning/orange) */}
              <circle
                cx='100'
                cy='100'
                r={radius}
                fill='none'
                stroke='var(--color-status-warning, #F59E0B)'
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={oldPatientsOffset}
                strokeLinecap='round'
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              {/* New Patients (Blue) */}
              <circle
                cx='100'
                cy='100'
                r={radius}
                fill='none'
                stroke='var(--color-primary-500)'
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={newPatientsOffset}
                strokeLinecap='round'
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            {/* Center text */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-neutral-900 dark:text-neutral-100'>
                  {totalPatients}
                </div>
                <div className='text-body-xs text-neutral-500 dark:text-neutral-400'>
                  {t('dashboard.totalLabel')}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className='mt-6 space-y-3 w-full'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded bg-primary-500' />
                <span className='text-body-sm text-neutral-700 dark:text-neutral-300'>
                  {t('dashboard.newPatientsLegend')}
                </span>
              </div>
              <span className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100'>
                {newPatients}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded bg-status-warning' />
                <span className='text-body-sm text-neutral-700 dark:text-neutral-300'>
                  {t('dashboard.oldPatientsLegend')}
                </span>
              </div>
              <span className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100'>
                {oldPatients}
              </span>
            </div>
            <div className='flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700'>
              <div className='flex items-center gap-2'>
                <div className='w-4 h-4 rounded bg-primary-700' />
                <span className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100'>
                  {t('dashboard.totalPatients')}
                </span>
              </div>
              <span className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100'>
                {totalPatients}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
