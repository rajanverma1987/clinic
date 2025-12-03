'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from './Input';
import { Button } from './Button';

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
}

interface PatientSelectorProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelect: (patientId: string) => void;
  onAddNew?: () => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
}

export function PatientSelector({
  patients,
  selectedPatientId,
  onSelect,
  onAddNew,
  label = 'Select Patient',
  required = false,
  placeholder = 'Search by name, ID, or phone...',
}: PatientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(patients);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPatient = patients.find((p) => p._id === selectedPatientId);

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
      
      return (
        fullName.includes(term) ||
        patientId.includes(term) ||
        phone.includes(term)
      );
    });

    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (patient: Patient) => {
    onSelect(patient._id);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Selected Patient Display */}
      {selectedPatient && !isOpen ? (
        <div className="relative">
          <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors">
            <div className="flex items-center space-x-3 flex-1">
              {/* Patient Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-semibold text-sm">
                  {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                </span>
              </div>

              {/* Patient Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="font-mono">{selectedPatient.patientId}</span>
                  <span>•</span>
                  <span>{selectedPatient.phone}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="relative">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {/* Add New Patient Button */}
              {onAddNew && (
                <button
                  type="button"
                  onClick={() => {
                    onAddNew();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left border-b border-gray-200 hover:bg-blue-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-blue-600">Add New Patient</div>
                    <div className="text-sm text-gray-500">Create a new patient record</div>
                  </div>
                </button>
              )}

              {/* Patient List */}
              {filteredPatients.length > 0 ? (
                <div className="py-1">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient._id}
                      type="button"
                      onClick={() => handleSelect(patient)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      {/* Patient Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-semibold text-sm">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </span>
                      </div>

                      {/* Patient Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {patient.patientId}
                          </span>
                          <span>•</span>
                          <span>{patient.phone}</span>
                          {patient.email && (
                            <>
                              <span>•</span>
                              <span className="truncate">{patient.email}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Selected Indicator */}
                      {selectedPatientId === patient._id && (
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">No patients found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                  {onAddNew && (
                    <Button
                      type="button"
                      onClick={() => {
                        onAddNew();
                        setIsOpen(false);
                      }}
                      className="mt-4"
                      size="sm"
                    >
                      Add New Patient
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
        <p className="text-xs text-gray-500 mt-2">
          Showing {filteredPatients.length} of {patients.length} patients
        </p>
      )}
    </div>
  );
}

