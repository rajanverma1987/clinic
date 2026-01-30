'use client';

import { ChevronRightIcon } from '@/components/icons';
import React from 'react';

function PatientListItemInner({ patient, onClick }) {
  const patientName =
    patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown';

  const firstName = patient.firstName || '';
  const lastName = patient.lastName || '';
  const initials = `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'P';

  const contactInfo = patient.phone || patient.email || 'No contact info';
  const age = patient.age || patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : null;
  const gender = patient.gender || '';

  return (
    <div className="dashboard-list-item dashboard-list-item-primary group" onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Patient Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 border-2 border-primary-200">
            <span className="text-primary-600 font-semibold text-xs">
              {initials}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-body-sm font-semibold text-neutral-900 mb-1 truncate">
              {patientName}
            </h4>
            <p className="text-body-xs text-neutral-600 mb-1.5 truncate">{contactInfo}</p>
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
        <ChevronRightIcon className="icon icon-sm text-neutral-400 group-hover:text-primary-500 transition-colors flex-shrink-0" />
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

export const PatientListItem = React.memo(PatientListItemInner);
