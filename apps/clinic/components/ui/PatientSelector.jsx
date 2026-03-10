'use client';

import { useI18n } from '@/contexts/I18nContext.jsx';
import { useSettings } from '@/hooks/useSettings';
import { getPatientDisplayName, getPatientDisplayNameParts } from '@/lib/utils/patient-display-name';
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';

export function PatientSelector({
  patients,
  selectedPatientId,
  onSelect,
  onAddNew,
  label,
  required = false,
  placeholder,
}) {
  const { t, locale } = useI18n();
  const { locale: settingsLocale } = useSettings();
  const localeCode = (settingsLocale || locale || 'en').toString().slice(0, 2);
  const labelText = label ?? t('patientSelector.selectPatient');
  const placeholderText = placeholder ?? t('patientSelector.searchPlaceholder');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState(patients);
  const containerRef = useRef(null);

  const selectedPatient = patients.find(
    (p) =>
      p._id === selectedPatientId ||
      p.id === selectedPatientId ||
      String(p._id) === String(selectedPatientId) ||
      String(p.id) === String(selectedPatientId),
  );

  useEffect(() => {
    if (!searchTerm) {
      setFilteredPatients(patients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = patients.filter((patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const patientId = patient.patientId.toLowerCase();
      const phone = patient.phone.toLowerCase();

      return fullName.includes(term) || patientId.includes(term) || phone.includes(term);
    });

    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (patient) => {
    onSelect(patient._id);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className='relative'>
      <label className='block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2'>
        {labelText} {required && <span className='text-status-error'>*</span>}
      </label>

      {/* Selected Patient Display */}
      {selectedPatient && !isOpen ? (
        <div className='relative'>
          <div className='flex items-center justify-between p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-500'>
            <div className='flex items-center space-x-3 flex-1'>
              {/* Patient Avatar */}
              <div className='w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0'>
                <span className='text-primary-600 dark:text-primary-300 font-semibold text-sm'>
                  {(() => {
                    const { first, last } = getPatientDisplayNameParts(selectedPatient, localeCode);
                    return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'P';
                  })()}
                </span>
              </div>

              {/* Patient Info */}
              <div className='flex-1 min-w-0'>
                <div className='font-medium text-neutral-900 dark:text-neutral-100 truncate'>
                  {getPatientDisplayName(selectedPatient, localeCode, t)}
                </div>
                <div className='flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400'>
                  <span className='font-mono'>{selectedPatient.patientId}</span>
                  <span>•</span>
                  <span>{selectedPatient.phone}</span>
                </div>
              </div>

              {/* Actions */}
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='link'
                  onClick={() => setIsOpen(true)}
                  className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium'
                >
                  {t('patientSelector.change')}
                </Button>
                <Button
                  variant='ghost'
                  size='xs'
                  iconOnly
                  type='button'
                  onClick={handleClear}
                  className='text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
                >
                  <svg
                    className='icon icon-sm'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className='relative'>
            <Input
              type='text'
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholderText}
              className='pr-10'
            />
            <div className='absolute right-3 top-1/2 -translate-y-1/2'>
              <svg
                className='icon icon-sm text-neutral-400 dark:text-neutral-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div
              className='absolute w-full mt-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-600 rounded-lg shadow-lg dark:shadow-neutral-900/50 max-h-80 overflow-y-auto'
              style={{ zIndex: 'var(--z-dropdown-menu, 15)' }}
            >
              {/* Add New Patient Button */}
              {onAddNew && (
                <Button
                  type='button'
                  variant='ghost'
                  fullWidth
                  align='start'
                  onClick={() => {
                    onAddNew();
                    setIsOpen(false);
                  }}
                  className='w-full px-4 py-3 border-b border-gray-200 dark:border-neutral-600 hover:bg-blue-50 dark:hover:bg-neutral-700/50'
                >
                  <div className='w-10 h-10 rounded-full bg-blue-600 dark:bg-primary-600 flex items-center justify-center flex-shrink-0'>
                    <svg
                      className='icon icon-sm text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 4v16m8-8H4'
                      />
                    </svg>
                  </div>
                  <div>
                    <div className='font-medium text-primary-600 dark:text-primary-400'>
                      {t('patientSelector.addNewPatient')}
                    </div>
                    <div className='text-sm text-neutral-500 dark:text-neutral-400'>
                      {t('patientSelector.addNewPatientDesc')}
                    </div>
                  </div>
                </Button>
              )}

              {/* Patient List */}
              {filteredPatients.length > 0 ? (
                <div className='py-1'>
                  {filteredPatients.map((patient) => (
                    <Button
                      key={patient._id}
                      type='button'
                      variant='ghost'
                      fullWidth
                      align='start'
                      onClick={() => handleSelect(patient)}
                      className='w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700/50 border-b border-gray-100 dark:border-neutral-600 last:border-b-0'
                    >
                      {/* Patient Avatar */}
                      <div className='w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-600 flex items-center justify-center flex-shrink-0'>
                        <span className='text-gray-600 dark:text-neutral-200 font-semibold text-sm'>
                          {(() => {
                            const { first, last } = getPatientDisplayNameParts(patient, localeCode);
                            return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'P';
                          })()}
                        </span>
                      </div>

                      {/* Patient Info */}
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium text-neutral-900 dark:text-neutral-100'>
                          {getPatientDisplayName(patient, localeCode, t)}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400'>
                          <span className='font-mono bg-gray-100 dark:bg-neutral-600 px-2 py-0.5 rounded'>
                            {patient.patientId}
                          </span>
                          <span>•</span>
                          <span>{patient.phone}</span>
                          {patient.email && (
                            <>
                              <span>•</span>
                              <span className='truncate'>{patient.email}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Selected Indicator */}
                      {selectedPatientId === patient._id && (
                        <div className='flex-shrink-0'>
                          <svg
                            className='icon icon-sm text-primary-600 dark:text-primary-400'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth={2}
                            viewBox='0 0 24 24'
                          >
                            <path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                          </svg>
                        </div>
                      )}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className='px-4 py-8 text-center text-neutral-500 dark:text-neutral-400'>
                  <svg
                    className='w-12 h-12 mx-auto mb-3 text-neutral-400 dark:text-neutral-500'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <p className='font-medium'>{t('patientSelector.noPatientsFound')}</p>
                  <p className='text-sm mt-1'>{t('patientSelector.tryDifferentSearch')}</p>
                  {onAddNew && (
                    <Button
                      type='button'
                      onClick={() => {
                        onAddNew();
                        setIsOpen(false);
                      }}
                      className='mt-4'
                      size='sm'
                    >
                      {t('patientSelector.addNewPatient')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Helper Text */}
      {isOpen && filteredPatients.length > 0 && (
        <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-2'>
          Showing {filteredPatients.length} of {patients.length} patients
        </p>
      )}
    </div>
  );
}
