'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { SearchBar } from '@/components/ui/SearchBar';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { DatePicker } from '@/components/ui/DatePicker';

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: string;
  createdAt: string;
}

interface PaginationResult {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function PatientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    gender: 'male',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // Initial load - use normal loading
      if (!searchTerm && currentPage === 1) {
        fetchPatients(false);
      } else {
        // Search or pagination - use search loading to avoid unmounting SearchBar
        const timeoutId = setTimeout(() => {
          fetchPatients(true);
        }, searchTerm ? 300 : 0);
        
        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, currentPage, searchTerm]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal]);

  const fetchPatients = async (isSearch = false) => {
    if (isSearch) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      });
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await apiClient.get<PaginationResult>(`/patients?${params}`);
      if (response.success && response.data) {
        setPatients(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      if (isSearch) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Memoize search handler to prevent SearchBar from re-rendering unnecessarily
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await apiClient.post('/patients', formData);
      if (response.success) {
        setShowModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          dateOfBirth: '',
          gender: 'male',
        });
        fetchPatients();
      }
    } catch (error) {
      console.error('Failed to create patient:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: t('patients.patientId'), accessor: 'patientId' as keyof Patient },
    {
      header: t('patients.name'),
      accessor: (row: Patient) => `${row.firstName} ${row.lastName}`,
    },
    { header: t('patients.phone'), accessor: 'phone' as keyof Patient },
    { header: t('patients.email'), accessor: 'email' as keyof Patient },
    {
      header: t('patients.dateOfBirth'),
      accessor: (row: Patient) => new Date(row.dateOfBirth).toLocaleDateString(),
    },
    { header: t('patients.gender'), accessor: 'gender' as keyof Patient },
  ];

  if (authLoading || (loading && !searchTerm)) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('patients.title')}</h1>
          <p className="text-gray-600 mt-2">{t('patients.managePatientRecords')}</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ {t('patients.addPatient')}</Button>
      </div>

      <Card className="mb-6">
        <SearchBar
          placeholder={t('patients.searchPlaceholder')}
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full"
        />
        {searchLoading && (
          <div className="mt-2 text-sm text-gray-500 flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
          </div>
        )}
      </Card>

      <Card>
        <Table
          data={patients}
          columns={columns}
          onRowClick={(row) => router.push(`/patients/${row._id}`)}
          emptyMessage={t('patients.noPatientsFound')}
        />

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="text-sm text-gray-600">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        )}
      </Card>

      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // Close modal if clicking on the backdrop
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{t('patients.addNewPatient')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t('auth.firstName')}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label={t('auth.lastName')}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <PhoneInput
                label={t('patients.phone')}
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                required
              />

              <Input
                label={t('auth.email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <DatePicker
                label={t('patients.dateOfBirth')}
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('patients.gender')}</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="male">{t('common.male')}</option>
                  <option value="female">{t('common.female')}</option>
                  <option value="other">{t('common.other')}</option>
                </select>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" isLoading={submitting} className="flex-1">
                  {t('patients.createPatient')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

