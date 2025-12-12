'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { CompactLoader, Loader } from '@/components/ui/Loader';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { SearchBar } from '@/components/ui/SearchBar';
import { Table } from '@/components/ui/Table';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { getCountryCodeFromRegion } from '@/lib/utils/country-code-mapping';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function PatientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { locale } = useSettings();
  const [patients, setPatients] = useState([]);
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
  const [countryCode, setCountryCode] = useState('+1');
  const [submitting, setSubmitting] = useState(false);
  // Mock notifications - replace with real API call later
  const [notifications] = useState([
    {
      id: '1',
      type: 'appointment',
      title: 'New Appointment Scheduled',
      message: 'Dr. Smith has a new appointment with John Doe at 2:00 PM',
      createdAt: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      unread: true,
    },
    {
      id: '2',
      type: 'prescription',
      title: 'Prescription Ready',
      message: 'Prescription #1234 is ready for pickup',
      createdAt: new Date(Date.now() - 2 * 3600000), // 2 hours ago
      unread: true,
    },
  ]);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const formatDateDisplay = () => {
    const date = new Date();
    return date.toLocaleDateString(locale || 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  useEffect(() => {
    if (!authLoading && user) {
      // Fetch settings to get default country code
      fetchSettings();

      // Initial load - use normal loading
      if (!searchTerm && currentPage === 1) {
        fetchPatients(false);
      } else {
        // Search or pagination - use search loading to avoid unmounting SearchBar
        const timeoutId = setTimeout(
          () => {
            fetchPatients(true);
          },
          searchTerm ? 300 : 0
        );

        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, currentPage, searchTerm]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showModal]);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/settings');

      if (response.success && response.data) {
        // Set default country code based on region
        const defaultCode = getCountryCodeFromRegion(response.data.region);
        setCountryCode(defaultCode);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Keep default +1 if fetch fails
    }
  };

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

      const response = await apiClient.get(`/patients?${params}`);

      console.log('Patients API Response:', response);
      console.log('Response data:', response.data);
      console.log('Response data.data:', response.data?.data);

      if (response.success && response.data) {
        // Handle pagination structure - data is inside response.data.data
        const patientsList = response.data.data || [];
        console.log('Patients list:', patientsList);
        setPatients(Array.isArray(patientsList) ? patientsList : []);
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
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Combine country code with phone number
      const fullPhone = formData.phone ? `${countryCode}${formData.phone}` : '';
      const response = await apiClient.post('/patients', {
        ...formData,
        phone: fullPhone,
      });
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
        setCountryCode('+1'); // Reset country code
        fetchPatients();
      }
    } catch (error) {
      console.error('Failed to create patient:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAppointment = (patientId, e) => {
    e.stopPropagation(); // Prevent row click navigation
    router.push(`/appointments/new?patientId=${patientId}`);
  };

  const columns = [
    { header: t('patients.patientId'), accessor: 'patientId' },
    {
      header: t('patients.name'),
      accessor: (row) => `${row.firstName} ${row.lastName}`,
    },
    { header: t('patients.phone'), accessor: 'phone' },
    { header: t('patients.email'), accessor: 'email' },
    {
      header: t('patients.dateOfBirth'),
      accessor: (row) => new Date(row.dateOfBirth).toLocaleDateString(),
    },
    { header: t('patients.gender'), accessor: 'gender' },
    {
      header: t('common.actions'),
      accessor: (row) => (
        <Button
          size='md'
          variant='secondary'
          onClick={(e) => handleQuickAppointment(row._id, e)}
          title='Quickly add appointment for this patient'
          className='whitespace-nowrap'
        >
          <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          {t('appointments.bookAppointment') || 'Add Appointment'}
        </Button>
      ),
    },
  ];

  // Redirect if not authenticated (non-blocking)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Show empty state while redirecting or loading initial data
  if (!user) {
    return null;
  }

  if (loading && !searchTerm) {
    return <Loader fullScreen size='lg' />;
  }

  return (
    <Layout>
      <div style={{ padding: '0 10px' }}>
        <DashboardHeader
          title={t('patients.title')}
          subtitle={formatDateDisplay()}
          notifications={notifications}
          unreadCount={unreadCount}
          onNotificationClick={(notification) => {
            console.log('Notification clicked:', notification);
            // Handle notification click - navigate to relevant page
          }}
          onMarkAsRead={(notificationId) => {
            console.log('Mark as read:', notificationId);
            // Handle mark as read - update notification status
          }}
          onMarkAllAsRead={() => {
            console.log('Mark all as read');
            // Handle mark all as read
          }}
          actionButton={
            <Button
              onClick={() => setShowModal(true)}
              variant='primary'
              size='md'
              className='whitespace-nowrap'
            >
              + {t('patients.addPatient')}
            </Button>
          }
        />

        <Card className='mb-6'>
          <SearchBar
            placeholder={t('patients.searchPlaceholder')}
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full'
          />
          {searchLoading && (
            <div className='mt-2 text-body-sm text-neutral-500 flex items-center'>
              <CompactLoader size='xs' />
              <span
                className='text-body-sm text-neutral-500'
                style={{
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 'var(--text-body-sm-line-height)',
                }}
              >
                Searching...
              </span>
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
            <div className='mt-4 flex items-center justify-between'>
              <Button
                variant='secondary'
                size='md'
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='whitespace-nowrap'
              >
                {t('common.previous')}
              </Button>
              <span className='text-body-sm text-neutral-700'>
                {t('common.page')} {currentPage} {t('common.of')} {totalPages}
              </span>
              <Button
                variant='secondary'
                size='md'
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className='whitespace-nowrap'
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </Card>

        {showModal && (
          <div
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
            onClick={(e) => {
              // Close modal if clicking on the backdrop
              if (e.target === e.currentTarget) {
                setShowModal(false);
              }
            }}
          >
            <div className='bg-neutral-50 rounded-lg p-6 w-full max-w-md shadow-lg'>
              <h2 className='text-h2 text-neutral-900 mb-3'>{t('patients.addNewPatient')}</h2>
              <form onSubmit={handleSubmit} className='space-y-3' noValidate>
                <div className='grid grid-cols-2 gap-3'>
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
                  countryCode={countryCode}
                  onCountryCodeChange={setCountryCode}
                  required
                />

                <Input
                  label={t('auth.email')}
                  type='email'
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
                  <label className='block text-body-sm font-medium text-neutral-900 mb-1'>
                    {t('patients.gender')}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className='w-full px-3 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus:border-primary-500 focus:shadow-focus'
                    required
                  >
                    <option value='male'>{t('common.male')}</option>
                    <option value='female'>{t('common.female')}</option>
                    <option value='other'>{t('common.other')}</option>
                  </select>
                </div>

                <div className='flex gap-4'>
                  <Button
                    type='button'
                    variant='secondary'
                    size='md'
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                    className='flex-1'
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type='submit'
                    isLoading={submitting}
                    disabled={submitting}
                    size='md'
                    className='flex-1'
                  >
                    {t('patients.createPatient')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
