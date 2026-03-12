'use client';

import { useI18n } from '@/contexts/I18nContext';

/**
 * Critical Disclaimers Component
 * Shows only mandatory/required disclaimers - nothing extra
 * 
 * Design System Compliance:
 * - Title: body-sm (14px/20px) / semibold (600) / neutral-900
 * - Text: body-sm (14px/20px) / regular (400) / neutral-700
 * - Background: primary-100 (#E6F7FE)
 * - Border: primary-500 (#2D9CDB) - 4px left border
 * - Icon: primary-500 (#2D9CDB) - 20px
 * - Spacing: 12px padding, 12px gap
 */
export function Disclaimer({ type = 'general', className = '' }) {
  const { t } = useI18n();
  const disclaimers = {
    general: {
      title: t('disclaimer.generalTitle'),
      items: [t('disclaimer.generalItem1'), t('disclaimer.generalItem2')],
    },
    medical: {
      title: t('disclaimer.medicalTitle'),
      items: [t('disclaimer.medicalItem1'), t('disclaimer.medicalItem2')],
    },
    prescription: {
      title: t('disclaimer.prescriptionTitle'),
      items: [t('disclaimer.prescriptionItem1'), t('disclaimer.prescriptionItem2')],
    },
    telemedicine: {
      title: t('disclaimer.telemedicineTitle'),
      items: [t('disclaimer.telemedicineItem1')],
    },
    data: {
      title: t('disclaimer.dataTitle'),
      items: [t('disclaimer.dataItem1'), t('disclaimer.dataItem2')],
    },
  };

  const disclaimer = disclaimers[type] || disclaimers.general;

  return (
    <div className={`bg-primary-100 border-l-4 border-primary-500 p-3 rounded-lg ${className}`}>
      <div className='flex items-start gap-3'>
        <svg
          width='20px'
          height='20px'
          className='text-primary-500 mt-0.5 flex-shrink-0'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        <div className='flex-1 space-y-1.5'>
          <h4 className='font-semibold text-neutral-900' style={{ fontSize: '10px', lineHeight: '14px' }}>{disclaimer.title}</h4>
          <ul className='list-disc list-inside space-y-1 text-neutral-700' style={{ fontSize: '10px', lineHeight: '14px' }}>
            {disclaimer.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

