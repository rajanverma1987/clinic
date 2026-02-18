'use client';

import { ChevronRightIcon, PrescriptionIcon } from '@/components/icons';
import { useI18n } from '@/contexts/I18nContext';

export function PrescriptionListItem({ prescription, onClick }) {
  const { t } = useI18n();
  const patientName =
    prescription.patientId?.name ||
    `${prescription.patientId?.firstName || ''} ${prescription.patientId?.lastName || ''}`.trim() ||
    t('common.unknownPatient');

  const medication =
    prescription.medication || prescription.medications?.[0]?.name || 'Prescription';

  const dosage = prescription.dosage || prescription.medications?.[0]?.dosage || '';
  const duration = prescription.duration || '';

  return (
    <button
      type='button'
      className='dashboard-list-item dashboard-list-item-primary group w-full text-left cursor-pointer border-0 bg-transparent p-0'
      onClick={onClick}
      aria-label={`${patientName}, ${medication}`}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          {/* Icon */}
          <div className='icon-bg-primary w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0'>
            <PrescriptionIcon className='icon icon-xs text-primary-500' />
          </div>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <h4 className='text-body-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1 truncate'>
              {patientName}
            </h4>
            <p className='text-body-xs text-neutral-600 dark:text-neutral-400 mb-1.5 truncate'>{medication}</p>
            <div className='flex items-center gap-2 flex-wrap text-body-xs text-neutral-500 dark:text-neutral-400'>
              {dosage && <span>{dosage}</span>}
              {dosage && duration && <span>•</span>}
              {duration && <span>{duration}</span>}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className='icon icon-sm text-neutral-400 group-hover:text-primary-500 transition-colors flex-shrink-0' />
      </div>
    </button>
  );
}
