'use client';

import { PrescriptionIcon, ChevronRightIcon } from '@/components/icons';

export function PrescriptionListItem({ prescription, onClick }) {
  const patientName =
    prescription.patientId?.name ||
    `${prescription.patientId?.firstName || ''} ${prescription.patientId?.lastName || ''}`.trim() ||
    'Unknown Patient';

  const medication =
    prescription.medication ||
    prescription.medications?.[0]?.name ||
    'Prescription';

  const dosage = prescription.dosage || prescription.medications?.[0]?.dosage || '';
  const duration = prescription.duration || '';

  return (
    <div className="dashboard-list-item dashboard-list-item-primary group" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ 
              background: 'linear-gradient(135deg, rgba(45, 156, 219, 0.1) 0%, rgba(45, 156, 219, 0.05) 100%)',
              border: '1px solid rgba(45, 156, 219, 0.2)'
            }}
          >
            <PrescriptionIcon className="icon icon-xs text-primary-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-body-sm font-semibold text-neutral-900 mb-1 truncate">
              {patientName}
            </h4>
            <p className="text-body-xs text-neutral-600 mb-1.5 truncate">{medication}</p>
            <div className="flex items-center gap-2 flex-wrap text-body-xs text-neutral-500">
              {dosage && <span>{dosage}</span>}
              {dosage && duration && <span>•</span>}
              {duration && <span>{duration}</span>}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="icon icon-sm text-neutral-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}
