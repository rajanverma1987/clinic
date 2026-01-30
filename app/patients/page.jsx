'use client';

import { CalendarIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PatientCard } from '@/components/patients/PatientCard';
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
import * as routeCache from '@/lib/cache/dashboard-cache';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { getCountryCodeFromRegion } from '@/lib/utils/country-code-mapping';
import { logger } from '@/lib/utils/logger';
import { addRecentSearch, getRecentSearches } from '@/lib/utils/recent-search-cache';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const ROUTE_KEY = 'route_patients';

export default function PatientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const { locale } = useSettings();
  const tenantId = user?.tenantId ?? null;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table');

  // Hydrate from localStorage before paint (no flash, no hydration mismatch)
  useLayoutEffect(() => {
    if (!tenantId) return;
    const cached = routeCache.getData(ROUTE_KEY, tenantId);
    if (cached && cached.patients != null) {
      setPatients(cached.patients ?? []);
      setCurrentPage(cached.currentPage ?? 1);
      setTotalPages(cached.totalPages ?? 1);
      setTotalCount(cached.total ?? 0);
      setLoading(false);
    }
  }, [tenantId]);
  const [showModal, setShowModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
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
      fetchSettings();
      const hasCache = tenantId && routeCache.getData(ROUTE_KEY, tenantId);
      if (hasCache && !searchTerm && statusFilter === 'all' && sortBy === 'createdAt') {
        fetchPatients(false);
        return;
      }
      if (!searchTerm && currentPage === 1 && statusFilter === 'all' && sortBy === 'createdAt') {
        fetchPatients(false);
      } else {
        const timeoutId = setTimeout(() => fetchPatients(true), searchTerm ? 300 : 0);
        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

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
      logger.error('Failed to fetch settings', error);
      // Keep default +1 if fetch fails
    }
  };

  const fetchPatients = useCallback(
    async (isSearch = false) => {
      const hasCache = tenantId && routeCache.getData(ROUTE_KEY, tenantId);
      if (isSearch) {
        setSearchLoading(true);
      } else if (!hasCache) {
        setLoading(true);
      }
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
        });
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }

        const response = await apiClient.get(`/patients?${params}`);

        if (response.success && response.data) {
          const patientsList = extractArrayData(response);
          const pagination = extractPaginationData(response);
          setPatients(patientsList);
          setTotalPages(pagination.totalPages);
          setTotalCount(pagination.total ?? 0);
          if (searchTerm) addRecentSearch('patients', searchTerm);
          if (tenantId)
            routeCache.set(ROUTE_KEY, tenantId, {
              patients: patientsList,
              totalPages: pagination.totalPages,
              currentPage,
              total: pagination.total,
            });
        }
      } catch (error) {
        logger.error('Failed to fetch patients', error);
      } finally {
        if (isSearch) {
          setSearchLoading(false);
        } else {
          setLoading(false);
        }
      }
    },
    [tenantId, currentPage, searchTerm, statusFilter, sortBy, sortOrder]
  );

  // Memoize search handler to prevent SearchBar from re-rendering unnecessarily
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    setRecentSearches(getRecentSearches('patients'));
  }, [searchTerm]);

  const handleRecentSearchClick = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    setShowRecentDropdown(false);
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
      logger.error('Failed to create patient', error);
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
          title={t('patients.addAppointmentTooltip')}
          className='whitespace-nowrap'
        >
          <CalendarIcon className='icon icon-sm shrink-0' ariaHidden />
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
    return <Loader type='page' text={t('common.loading')} />;
  }

  return (
    <Layout>
      <PageHeader
        title={t('patients.title')}
        subtitle={formatDateDisplay()}
        notifications={[]}
        unreadCount={0}
        actionButton={
          <Button
            onClick={() => setShowModal(true)}
            variant='secondary'
            size='md'
            className='whitespace-nowrap'
          >
            + {t('patients.addPatient')}
          </Button>
        }
      />
      <div style={{ padding: '0 10px' }}>
        <Card className='mb-6'>
          <div className='flex flex-col sm:flex-row gap-3 flex-wrap'>
            <div className='flex-1 min-w-[200px] relative'>
              <SearchBar
                placeholder={t('patients.searchPlaceholder')}
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => {
                  const recent = getRecentSearches('patients');
                  setRecentSearches(recent);
                  setShowRecentDropdown(recent.length > 0);
                }}
                onBlur={() => setTimeout(() => setShowRecentDropdown(false), 150)}
                className='w-full'
              />
              {showRecentDropdown && recentSearches.length > 0 && (
                <div
                  className='absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 py-1 max-h-48 overflow-auto'
                  role='listbox'
                >
                  <div className='px-3 py-1.5 text-xs text-neutral-500 border-b border-neutral-100'>
                    {t('common.recentSearches') || 'Recent searches'}
                  </div>
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type='button'
                      className='w-full text-left px-3 py-2 text-sm hover:bg-neutral-50'
                      onClick={() => handleRecentSearchClick(term)}
                      role='option'
                    >
                      {term}
                    </button>
                  ))}
                  <button
                    type='button'
                    className='w-full text-left px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50 border-t border-neutral-100'
                    onClick={() => setShowRecentDropdown(false)}
                  >
                    {t('common.close') || 'Close'}
                  </button>
                </div>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className='px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 text-body-sm focus:outline-none focus:border-primary-500'
              aria-label={t('common.filter')}
            >
              <option value='all'>{t('patients.filterAll')}</option>
              <option value='active'>{t('patients.filterActive')}</option>
              <option value='new'>{t('patients.filterNew')}</option>
              <option value='inactive'>{t('patients.filterInactive')}</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const v = e.target.value;
                const [s, o] = v.split('-');
                setSortBy(s);
                setSortOrder(o || 'desc');
                setCurrentPage(1);
              }}
              className='px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-900 text-body-sm focus:outline-none focus:border-primary-500'
              aria-label={t('patients.sortBy')}
            >
              <option value='createdAt-desc'>{t('patients.sortDateAdded')}</option>
              <option value='lastName-asc'>{t('patients.sortName')}</option>
              <option value='lastVisit-desc'>{t('patients.sortLastVisit')}</option>
            </select>
          </div>
          {searchLoading && (
            <div className='mt-2 text-body-sm text-neutral-500 flex items-center gap-2' role='status' aria-label={t('common.searching')}>
              <CompactLoader size='xs' aria-label={t('common.searching')} />
              <span
                className='text-body-sm text-neutral-500'
                style={{
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 'var(--text-body-sm-line-height)',
                }}
              >
                {t('common.searching')}
              </span>
            </div>
          )}
        </Card>

        <Card>
          <div className='flex items-center justify-between gap-2 mb-3 text-body-sm text-neutral-600 flex-wrap'>
            <span>
              {totalCount} {t('patients.totalCount')},{' '}
              {t('patients.showingCount').replace('{{n}}', String(patients.length))}
            </span>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  viewMode === 'table'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t('patients.viewTable')}
              </button>
              <button
                type='button'
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  viewMode === 'cards'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t('patients.viewCards')}
              </button>
            </div>
          </div>
          {viewMode === 'table' ? (
            <Table
              data={patients}
              columns={columns}
              onRowClick={(row) =>
                router.push(
                  user?.role === 'doctor' ? `/doctors/patients/${row._id}` : `/patients/${row._id}`
                )
              }
              emptyMessage={t('patients.noPatientsFound')}
            />
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {patients.length === 0 ? (
                <p className='col-span-full text-center text-neutral-500 py-8'>
                  {t('patients.noPatientsFound')}
                </p>
              ) : (
                patients.map((row) => (
                  <PatientCard key={row._id} patient={row} isDoctor={user?.role === 'doctor'} />
                ))
              )}
            </div>
          )}

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
            className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'
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
