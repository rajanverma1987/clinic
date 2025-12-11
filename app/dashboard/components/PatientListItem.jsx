'use client';

import { UsersIcon, ChevronRightIcon } from '@/components/icons';

export function PatientListItem({ patient, onClick }) {
  const patientName =
    patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown';

  const contactInfo = patient.phone || patient.email || 'No contact info';
  const age = patient.age || patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
  const gender = patient.gender || '';

  return (
    <div className="dashboard-list-item dashboard-list-item-secondary group" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(39, 174, 96, 0.1)' }}
          >
            <UsersIcon className="w-5 h-5 text-secondary-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-body-md font-semibold text-neutral-900 mb-1 truncate">
              {patientName}
            </h4>
            <p className="text-body-sm text-neutral-600 mb-2 truncate">{contactInfo}</p>
            {(age || gender) && (
              <div className="flex items-center gap-2 text-body-xs text-neutral-500">
                {age && <span>{age} years</span>}
                {age && gender && <span>•</span>}
                {gender && <span>{gender}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRightIcon className="w-5 h-5 text-neutral-400 group-hover:text-secondary-500 transition-colors flex-shrink-0 ml-2" />
      </div>
    </div>
  );
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
