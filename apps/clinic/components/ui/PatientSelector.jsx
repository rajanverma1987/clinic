'use client';

import { useI18n } from '@/contexts/I18nContext.jsx';
import { useSettings } from '@/hooks/useSettings';
import { getPatientDisplayName, getPatientDisplayNameParts } from '@/lib/utils/patient-display-name';
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import './PatientSelector.css';

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
      <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5'>
        {labelText} {required && <span className='text-status-error'>*</span>}
      </label>

      {/* Selected Patient Display */}
      {selectedPatient && !isOpen ? (
        <div className='relative'>
          <div
            role='button'
            tabIndex={0}
            onClick={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
              }
            }}
            className='flex items-center justify-between gap-4 form-control-height form-control-md px-4 border border-neutral-300 dark:border-neutral-600 rounded-[10px] bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:border-neutral-400 dark:hover:border-neutral-500 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 min-h-[44px] transition-[border-color,box-shadow] duration-200 cursor-pointer'
          >
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              {/* Patient Avatar */}
              <div className='w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0'>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                  }}
                  className='text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium'
                >
                  {t('patientSelector.change')}
                </Button>
                <Button
                  variant='ghost'
                  size='xs'
                  iconOnly
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className='text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md'
                >
                  <svg
                    className='w-5 h-5'
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
              className='pr-10 rounded-[10px] border-neutral-300 dark:border-neutral-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
            />
            <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400 dark:text-neutral-500'>
              <svg
                className='w-5 h-5 text-neutral-400 dark:text-neutral-500'
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

          {/* Dropdown – styles in PatientSelector.css for margin, padding, left align */}
          {isOpen && (
            <div
              className='PatientSelector-dropdown absolute left-0 right-0 w-full z-[100]'
              role='listbox'
            >
              {/* Add New Patient */}
              {onAddNew && (
                <button
                  type='button'
                  onClick={() => {
                    onAddNew();
                    setIsOpen(false);
                  }}
                  className='PatientSelector-option PatientSelector-optionAddNew flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-inset rounded-lg'
                >
                  <div className='PatientSelector-optionAvatar bg-primary-500 dark:bg-primary-600'>
                    <svg
                      className='w-5 h-5 text-white'
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
                  <div className='PatientSelector-optionContent'>
                    <div className='font-medium text-primary-600 dark:text-primary-400'>
                      {t('patientSelector.addNewPatient')}
                    </div>
                    <div className='text-sm text-neutral-500 dark:text-neutral-400'>
                      {t('patientSelector.addNewPatientDesc')}
                    </div>
                  </div>
                </button>
              )}

              {/* Patient List */}
              {filteredPatients.length > 0 ? (
                <div className='PatientSelector-list'>
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient._id}
                      type='button'
                      onClick={() => handleSelect(patient)}
                      className='PatientSelector-option flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-inset'
                    >
                      <div className='PatientSelector-optionAvatar bg-neutral-100 dark:bg-neutral-600'>
                        <span className='text-neutral-600 dark:text-neutral-200 font-semibold text-sm'>
                          {(() => {
                            const { first, last } = getPatientDisplayNameParts(patient, localeCode);
                            return `${(first || '').charAt(0)}${(last || '').charAt(0)}`.toUpperCase() || 'P';
                          })()}
                        </span>
                      </div>

                      <div className='PatientSelector-optionContent'>
                        <div className='font-medium text-neutral-900 dark:text-neutral-100 truncate'>
                          {getPatientDisplayName(patient, localeCode, t)}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 flex-wrap'>
                          <span className='font-mono bg-neutral-100 dark:bg-neutral-600/80 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded text-xs'>
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

                      {selectedPatientId === patient._id && (
                        <div className='flex-shrink-0'>
                          <svg
                            className='w-5 h-5 text-primary-600 dark:text-primary-400'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth={2}
                            viewBox='0 0 24 24'
                          >
                            <path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className='px-6 py-10 text-center text-neutral-500 dark:text-neutral-400 rounded-lg'>
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
        <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1.5'>
          Showing {filteredPatients.length} of {patients.length} patients
        </p>
      )}
    </div>
  );
}
