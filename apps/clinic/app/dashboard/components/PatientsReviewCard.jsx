'use client';

import { Card } from '@/components/ui/Card';
import { useI18n } from '@/contexts/I18nContext';

export function PatientsReviewCard({ reviews, loading = false }) {
  const { t } = useI18n();
  const reviewData = reviews || {
    excellent: 85,
    great: 65,
    good: 45,
    average: 25,
  };

  if (loading) {
    return (
      <Card className='dashboard-list-card dashboard-list-card-primary h-full flex flex-col'>
        <div className='relative z-10 p-4 flex-1 flex flex-col min-h-0'>
          <div className='flex items-center gap-2 mb-4'>
            <div className='skeleton w-1 h-4 rounded-full shrink-0' />
            <div className='skeleton skeleton-text w-28' />
          </div>
          <div className='space-y-3'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='skeleton skeleton-list-item-sm' />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const reviewItems = [
    { labelKey: 'dashboard.reviewExcellent', value: reviewData.excellent || 0, color: 'bg-primary-500' },
    { labelKey: 'dashboard.reviewGreat', value: reviewData.great || 0, color: 'bg-primary-400' },
    { labelKey: 'dashboard.reviewGood', value: reviewData.good || 0, color: 'bg-status-warning' },
    { labelKey: 'dashboard.reviewAverage', value: reviewData.average || 0, color: 'bg-primary-300' },
  ];

  return (
    <Card className='dashboard-list-card dashboard-list-card-primary'>
      <div className='relative z-10 p-4 h-full flex flex-col'>
        <div className='section-header'>
          <div className='accent-bar accent-bar-primary' />
          <h2 className='section-title'>{t('dashboard.patientsReview')}</h2>
        </div>

        <div className='space-y-3 mt-3 flex-1'>
          {reviewItems.map((item) => (
            <div key={item.labelKey}>
              <div className='flex items-center justify-between mb-1.5'>
                <span className='text-body-sm font-medium text-neutral-700'>{t(item.labelKey)}</span>
                <span className='text-body-sm font-semibold text-neutral-900'>{item.value}%</span>
              </div>
              <div className='w-full bg-neutral-200 rounded-full h-3 overflow-hidden'>
                <div
                  className={`${item.color} h-full rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${item.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
