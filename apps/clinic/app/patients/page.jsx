'use client';

import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FileDownIcon,
  FilterIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  PencilIcon,
  TrashIcon,
} from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { PatientCard } from '@/components/patients/PatientCard';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { CompactLoader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { PageSearchBar } from '@/components/ui/PageSearchBar';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Table } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/TableSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePrefetchDetail } from '@/hooks/usePrefetchDetail';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { getTranslation } from '@/lib/i18n';
import { DASHBOARD_AUTO_REFRESH_MS } from '@/lib/constants/dashboard';
import { canDeletePatient } from '@/lib/permissions/cursor-md-matrix';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { getCountryCodeFromRegion } from '@/lib/utils/country-code-mapping';
import { logger } from '@/lib/utils/logger';
import { addRecentSearch, getRecentSearches } from '@/lib/utils/recent-search-cache';
import { showError, showSuccess } from '@/lib/utils/toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function PatientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, locale: i18nLocale } = useI18n();
  const { locale: settingsLocale } = useSettings();
  const locale = i18nLocale || settingsLocale;
  const localeCode = (locale || 'en').slice(0, 2);
  const { prefetchPatient } = usePrefetchDetail();
  const { open: openConfirm } = useConfirmation();
  const tenantId = user?.tenantId ?? null;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // Default: 25 patients per page
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table');

  const [showModal, setShowModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedStatus, setAdvancedStatus] = useState('all');
  const [advancedGender, setAdvancedGender] = useState('all');
  const [advancedAgeGroup, setAdvancedAgeGroup] = useState('all');
  const [advancedSortBy, setAdvancedSortBy] = useState('createdAt');
  const [advancedSortOrder, setAdvancedSortOrder] = useState('desc');
  const [exporting, setExporting] = useState(false);
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
  const [refreshing, setRefreshing] = useState(false);
  const refreshIntervalRef = useRef(null);

  const formatDateDisplay = () => {
    const date = new Date();
    return date.toLocaleDateString(locale || 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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
    async (isSearch = false, silentRefresh = false) => {
      // For silent refresh, don't show loading states
      if (!silentRefresh) {
        if (isSearch) {
          setSearchLoading(true);
        } else {
          setLoading(true);
        }
      }
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          sortBy: sortBy || 'createdAt',
          sortOrder: sortOrder || 'desc',
        });
        const effectiveSearch = debouncedSearchTerm ?? searchTerm;
        if (effectiveSearch) {
          params.append('search', effectiveSearch);
        }
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (genderFilter && genderFilter !== 'all') {
          params.append('gender', genderFilter);
        }
        if (ageGroupFilter && ageGroupFilter !== 'all') {
          const now = new Date();
          if (ageGroupFilter === 'child') {
            const from = new Date(now);
            from.setFullYear(from.getFullYear() - 17);
            params.append('dateOfBirthFrom', from.toISOString().slice(0, 10));
          } else if (ageGroupFilter === 'adult') {
            const from = new Date(now);
            from.setFullYear(from.getFullYear() - 64);
            const to = new Date(now);
            to.setFullYear(to.getFullYear() - 18);
            params.append('dateOfBirthFrom', from.toISOString().slice(0, 10));
            params.append('dateOfBirthTo', to.toISOString().slice(0, 10));
          } else if (ageGroupFilter === 'senior') {
            const to = new Date(now);
            to.setFullYear(to.getFullYear() - 65);
            params.append('dateOfBirthTo', to.toISOString().slice(0, 10));
          }
        }
        params.append('locale', localeCode);

        const response = await apiClient.get(`/patients?${params}`);

        if (response.success && response.data) {
          const patientsList = extractArrayData(response);
          const pagination = extractPaginationData(response);
          setPatients(patientsList);
          setTotalPages(pagination.totalPages);
          setTotalCount(pagination.total ?? 0);
          if (effectiveSearch) addRecentSearch('patients', effectiveSearch);
        }
      } catch (error) {
        logger.error('Failed to fetch patients', error);
      } finally {
        if (!silentRefresh) {
          if (isSearch) {
            setSearchLoading(false);
          } else {
            setLoading(false);
          }
        }
        setRefreshing(false);
      }
    },
    [
      tenantId,
      localeCode,
      currentPage,
      pageSize,
      searchTerm,
      debouncedSearchTerm,
      statusFilter,
      genderFilter,
      ageGroupFilter,
      sortBy,
      sortOrder,
    ],
  );

  // Refetch when UI language changes so patient table shows stored DB data in new locale (es/ar).
  const prevLocaleRef = useRef(localeCode);
  useEffect(() => {
    if (!user || authLoading) return;
    if (prevLocaleRef.current !== localeCode) {
      prevLocaleRef.current = localeCode;
      fetchPatients(!!debouncedSearchTerm, false);
    }
  }, [localeCode, user, authLoading, fetchPatients, debouncedSearchTerm]);

  // Manual refresh handler
  const handleOpenSearch = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openSearch'));
    }
  }, []);

  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients(!!debouncedSearchTerm, false);
  }, [fetchPatients, debouncedSearchTerm]);

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    if (!authLoading && user) {
      fetchSettings();
      fetchPatients(!!debouncedSearchTerm);
    }
  }, [
    authLoading,
    user,
    currentPage,
    pageSize,
    debouncedSearchTerm,
    statusFilter,
    genderFilter,
    ageGroupFilter,
    sortBy,
    sortOrder,
  ]);

  // Setup automatic background refresh every 60 seconds
  useEffect(() => {
    if (!authLoading && user && !debouncedSearchTerm && statusFilter === 'all') {
      // Clear any existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up auto-refresh interval
      refreshIntervalRef.current = setInterval(() => {
        // Silent background refresh - don't show loading, just update data
        fetchPatients(false, true);
      }, DASHBOARD_AUTO_REFRESH_MS);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [authLoading, user, debouncedSearchTerm, statusFilter, fetchPatients]);

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
      const fullPhone = formData.phone ? `${countryCode}${formData.phone}` : '';
      const payload = {
        ...formData,
        phone: fullPhone,
      };
      if (!payload.firstName?.trim() || !payload.lastName?.trim()) {
        showError(t('patients.firstLastNameRequired'));
        setSubmitting(false);
        return;
      }
      if (!payload.phone?.trim()) {
        showError(t('patients.phoneRequired'));
        setSubmitting(false);
        return;
      }
      if (!payload.dateOfBirth) {
        showError(t('patients.dateOfBirthRequired'));
        setSubmitting(false);
        return;
      }
      const response = await apiClient.post('/patients', payload);
      if (response.success) {
        showSuccess(t('patients.patientCreated'));
        setShowModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          dateOfBirth: '',
          gender: 'male',
        });
        setCountryCode('+1');

        // Optimistically add new patient to the list immediately
        if (response.data?.data) {
          const newPatient = response.data.data;
          setPatients((prev) => {
            // Add to beginning of list (newest first since sortOrder is 'desc')
            const updated = [newPatient, ...prev];
            // Update total count
            setTotalCount((prevTotal) => prevTotal + 1);
            return updated;
          });

        }

        // Refresh in background to sync with server (silent)
        fetchPatients(false, true);
      } else {
        const msg =
          response.error?.message ||
          response.error?.errors?.[0]?.message ||
          t('patients.createFailed');
        showError(msg);
      }
    } catch (error) {
      logger.error('Failed to create patient', error);
      const msg = error?.message || error?.error?.message || t('patients.createFailed');
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10000',
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
      });
      if (debouncedSearchTerm ?? searchTerm)
        params.append('search', (debouncedSearchTerm ?? searchTerm) || '');
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (genderFilter && genderFilter !== 'all') params.append('gender', genderFilter);
      if (ageGroupFilter && ageGroupFilter !== 'all') {
        const now = new Date();
        if (ageGroupFilter === 'child') {
          const from = new Date(now);
          from.setFullYear(from.getFullYear() - 17);
          params.append('dateOfBirthFrom', from.toISOString().slice(0, 10));
        } else if (ageGroupFilter === 'adult') {
          const from = new Date(now);
          from.setFullYear(from.getFullYear() - 64);
          const to = new Date(now);
          to.setFullYear(to.getFullYear() - 18);
          params.append('dateOfBirthFrom', from.toISOString().slice(0, 10));
          params.append('dateOfBirthTo', to.toISOString().slice(0, 10));
        } else if (ageGroupFilter === 'senior') {
          const to = new Date(now);
          to.setFullYear(to.getFullYear() - 65);
          params.append('dateOfBirthTo', to.toISOString().slice(0, 10));
        }
      }
      params.append('locale', localeCode);
      const res = await apiClient.get(`/patients?${params.toString()}`);
      const list = extractArrayData(res) || [];
      if (!list.length) {
        showError(t('patients.noPatientsToExport'));
        return;
      }
      const headers = [
        t('patients.patientId'),
        t('patients.name'),
        t('patients.phone'),
        t('patients.email'),
        t('patients.dateOfBirth'),
        t('patients.gender'),
      ];
      const rows = list.map((p) => [
        p.patientId || '',
        `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
        p.phone || '',
        p.email || '',
        p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : '',
        p.gender || '',
      ]);
      const csvContent = [
        headers.join(','),
        ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patients-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess(t('patients.exportSuccess'));
    } catch (err) {
      logger.error('Patient export failed', err);
      showError(t('patients.exportFailed'));
    } finally {
      setExporting(false);
    }
  }, [
    sortBy,
    sortOrder,
    searchTerm,
    debouncedSearchTerm,
    statusFilter,
    genderFilter,
    ageGroupFilter,
    localeCode,
    t,
  ]);

  const handleRowClick = useCallback(
    (row) => {
      if (!user) return;
      const id = row?._id ?? row?.id;
      if (!id) return;
      try {
        router.push(user.role === 'doctor' ? `/doctors/patients/${id}` : `/patients/${id}`);
      } catch (_) {
        // Guard against any unexpected throw (e.g. router not ready)
      }
    },
    [user, router],
  );

  const dateLocale = (locale || 'en').slice(0, 2) === 'ar' ? 'ar' : (locale || 'en').startsWith('es') ? 'es' : (locale || 'en-US');

  /** For Arabic locale: display phone digits in Eastern Arabic numerals (٠-٩). */
  const formatPhoneForLocale = useCallback(
    (phoneStr) => {
      if (!phoneStr || localeCode !== 'ar') return phoneStr;
      const easternNumerals = '٠١٢٣٤٥٦٧٨٩';
      return String(phoneStr).replace(/[0-9]/g, (d) => easternNumerals[Number(d)]);
    },
    [localeCode],
  );

  /** Use getTranslation with explicit locale so table cells always show in current UI language (es/ar). */
  const getGenderLabel = useCallback(
    (value) => {
      if (!value) return getTranslation('common.na', localeCode);
      const key = value.toLowerCase().replace(/_/g, '');
      if (key === 'male') return getTranslation('common.male', localeCode);
      if (key === 'female') return getTranslation('common.female', localeCode);
      if (key === 'other' || key === 'prefernottosay') return getTranslation('common.other', localeCode);
      return getTranslation(`common.${value}`, localeCode) || value;
    },
    [localeCode],
  );

  const columns = useMemo(
    () => [
      {
        header: t('patients.patientId'),
        accessor: (row) =>
          row.patientId && String(row.patientId).trim() ? row.patientId : t('common.na'),
      },
      {
        header: t('patients.name'),
        accessor: (row) => {
          const display =
            row.patientDisplayName && String(row.patientDisplayName).trim()
              ? row.patientDisplayName
              : [row.firstName ?? '', row.lastName ?? ''].filter(Boolean).join(' ').trim();
          return display || t('common.na');
        },
      },
      {
        header: getTranslation('patients.phone', localeCode),
        accessor: (row) => {
          const raw = row.phone && String(row.phone).trim();
          if (!raw) return getTranslation('common.na', localeCode);
          return formatPhoneForLocale(raw);
        },
      },
      {
        header: getTranslation('patients.email', localeCode),
        accessor: (row) => {
          const raw = row.email && String(row.email).trim();
          if (!raw) return getTranslation('common.na', localeCode);
          return raw;
        },
      },
      {
        header: t('patients.dateOfBirth'),
        accessor: (row) =>
          row.dateOfBirth
            ? new Date(row.dateOfBirth).toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : t('common.na'),
      },
      {
        header: t('patients.gender'),
        accessor: (row) => getGenderLabel(row.gender),
      },
      {
        header: t('common.actions'),
        accessor: (row) => {
          const menuItems = [
            {
              key: 'view',
              label: t('common.view'),
              icon: <EyeIcon className='icon icon-sm' />,
              onClick: () => {
                const id = row?._id ?? row?.id;
                if (id) {
                  router.push(
                    user.role === 'doctor' ? `/doctors/patients/${id}` : `/patients/${id}`,
                  );
                }
              },
            },
            {
              key: 'edit',
              label: t('common.edit'),
              icon: <PencilIcon className='icon icon-sm' />,
              onClick: () => {
                const id = row?._id ?? row?.id;
                if (id) {
                  router.push(
                    user.role === 'doctor' ? `/doctors/patients/${id}` : `/patients/${id}`,
                  );
                }
              },
            },
            ...(canDeletePatient(user?.role)
              ? [
                  {
                    key: 'delete',
                    label: t('common.delete'),
                    icon: <TrashIcon className='icon icon-sm' />,
                    onClick: () => {
                      const id = row?._id ?? row?.id;
                      const name = `${row?.firstName ?? ''} ${row?.lastName ?? ''}`.trim();
                      if (!id) return;
                      openConfirm({
                        title: t('patients.deletePatient'),
                        message: t('patients.deletePatientConfirm', { name }),
                        variant: 'danger',
                        onConfirm: async () => {
                          try {
                            const res = await apiClient.delete(`/patients/${id}`);
                            if (res?.success) {
                              showSuccess(t('patients.patientDeleted'));
                              fetchPatients(false, false);
                            } else {
                              showError(res?.error?.message || t('patients.deleteFailed'));
                            }
                          } catch (err) {
                            showError(err?.message || t('patients.deleteFailed'));
                          }
                        },
                      });
                    },
                  },
                ]
              : []),
          ];
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <ActionsMenu
                ariaLabel={t('common.actions')}
                triggerSize='xs'
                items={menuItems}
              />
            </div>
          );
        },
      },
    ],
    [t, router, user, openConfirm, fetchPatients, getGenderLabel, formatPhoneForLocale, dateLocale, locale, localeCode],
  );

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

  return (
    <Layout>
      <PageHeader
        title={t('patients.title')}
        subtitle={formatDateDisplay()}
        notifications={[]}
        unreadCount={0}
        onOpenSearch={handleOpenSearch}
        onRefresh={handleManualRefresh}
        refreshing={refreshing}
        actionButtons={
          <div className='flex items-center gap-2'>
            <Button
              variant='secondary'
              size='md'
              onClick={handleExportCsv}
              disabled={exporting || totalCount === 0}
              aria-label={t('patients.exportCsv')}
              title={t('patients.exportCsv')}
            >
              {exporting ? (
                <CompactLoader size='xs' aria-hidden />
              ) : (
                <FileDownIcon className='icon icon-sm' aria-hidden />
              )}
              <span className='ml-1.5'>{t('patients.exportCsv')}</span>
            </Button>
            <Link
              href='/appointments/new'
              className='inline-flex items-center justify-center w-10 h-10 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 border border-neutral-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-500'
              aria-label={t('appointments.bookAppointment')}
              title={t('appointments.bookAppointment')}
            >
              <CalendarIcon className='icon icon-sm' ariaHidden />
            </Link>
            <Button
              variant='primary'
              size='md'
              className='whitespace-nowrap'
              onClick={() => {
                setShowModal(true);
                setFormData({
                  firstName: '',
                  lastName: '',
                  phone: '',
                  email: '',
                  dateOfBirth: '',
                  gender: 'male',
                });
                setCountryCode('+1');
              }}
            >
              + {t('patients.addPatient')}
            </Button>
          </div>
        }
      />
      <div style={{ padding: '0 10px' }}>
        <PageSearchBar
          value={searchTerm}
          onChange={(e) => handleSearchChange(e)}
          onSearch={() => setCurrentPage(1)}
          placeholder={t('patients.searchPlaceholder')}
        >
          <Button
            variant='ghost'
            size='md'
            iconOnly
            onClick={() => {
              setAdvancedStatus(statusFilter);
              setAdvancedGender(genderFilter);
              setAdvancedAgeGroup(ageGroupFilter);
              setAdvancedSortBy(sortBy);
              setAdvancedSortOrder(sortOrder);
              setShowAdvancedSearch(true);
            }}
            aria-label={t('patients.advancedSearch')}
            className='rounded-lg border border-neutral-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400'
          >
            <FilterIcon className='icon icon-sm' aria-hidden />
          </Button>
        </PageSearchBar>
        {searchLoading && (
          <div
            className='mb-4 text-body-sm text-neutral-500 flex items-center gap-2'
            role='status'
            aria-label={t('common.searching')}
          >
            <CompactLoader size='xs' aria-label={t('common.searching')} />
            <span className='text-body-sm text-neutral-500'>{t('common.searching')}</span>
          </div>
        )}

        <Modal
          isOpen={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          title={t('patients.advancedSearch')}
          size='sm'
          contentClassName='Modal-content--compact'
        >
          <div className='search-modal-grid'>
            <div className='search-modal-field'>
              <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                {t('patients.filterStatus')}
              </label>
              <select
                className='filter-select w-full'
                value={advancedStatus}
                onChange={(e) => setAdvancedStatus(e.target.value)}
                aria-label={t('common.filter')}
              >
                <option value='all'>{t('patients.filterAll')}</option>
                <option value='active'>{t('patients.filterActive')}</option>
                <option value='new'>{t('patients.filterNew')}</option>
                <option value='inactive'>{t('patients.filterInactive')}</option>
              </select>
            </div>
            <div className='search-modal-field'>
              <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                {t('patients.filterGender')}
              </label>
              <select
                className='filter-select w-full'
                value={advancedGender}
                onChange={(e) => setAdvancedGender(e.target.value)}
                aria-label={t('patients.filterGender')}
              >
                <option value='all'>{t('patients.filterAll')}</option>
                <option value='male'>{t('patients.genderMale')}</option>
                <option value='female'>{t('patients.genderFemale')}</option>
                <option value='other'>{t('patients.genderOther')}</option>
              </select>
            </div>
            <div className='search-modal-field'>
              <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                {t('patients.filterAgeGroup')}
              </label>
              <select
                className='filter-select w-full'
                value={advancedAgeGroup}
                onChange={(e) => setAdvancedAgeGroup(e.target.value)}
                aria-label={t('patients.filterAgeGroup')}
              >
                <option value='all'>{t('patients.filterAll')}</option>
                <option value='child'>{t('patients.ageGroupChild')}</option>
                <option value='adult'>{t('patients.ageGroupAdult')}</option>
                <option value='senior'>{t('patients.ageGroupSenior')}</option>
              </select>
            </div>
            <div className='search-modal-field'>
              <label className='block text-body-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1'>
                {t('patients.sortBy')}
              </label>
              <select
                className='filter-select w-full'
                value={`${advancedSortBy}-${advancedSortOrder}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split('-');
                  setAdvancedSortBy(s);
                  setAdvancedSortOrder(o || 'desc');
                }}
                aria-label={t('patients.sortBy')}
              >
                <option value='createdAt-desc'>{t('patients.sortDateAdded')}</option>
                <option value='lastName-asc'>{t('patients.sortName')}</option>
                <option value='lastVisit-desc'>{t('patients.sortLastVisit')}</option>
              </select>
            </div>
          </div>
          <div className='search-modal-footer'>
            <Button variant='secondary' onClick={() => setShowAdvancedSearch(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant='primary'
              onClick={() => {
                setStatusFilter(advancedStatus);
                setGenderFilter(advancedGender);
                setAgeGroupFilter(advancedAgeGroup);
                setSortBy(advancedSortBy);
                setSortOrder(advancedSortOrder);
                setCurrentPage(1);
                setShowAdvancedSearch(false);
              }}
            >
              {t('patients.applyFilters')}
            </Button>
          </div>
        </Modal>

        {loading && !searchTerm ? (
          <Card>
            <TableSkeleton rows={10} cols={7} />
          </Card>
        ) : (
          <Card>
            <div className='flex items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-700'>
              <div className='flex items-center gap-3 flex-1'>
                <span className='text-body-sm text-neutral-600 dark:text-neutral-400'>
                  {totalCount} {t('patients.totalCount')},{' '}
                  {t('patients.showingCount').replace('{{n}}', String(patients.length))}
                </span>
              </div>
              <div
                className='inline-flex rounded-lg border border-neutral-300 bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-600 p-0.5'
                role='tablist'
                aria-label={t('patients.viewTable')}
              >
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  role='tab'
                  aria-selected={viewMode === 'table'}
                  className={`inline-flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'bg-primary-100 text-primary-700 shadow-sm dark:bg-primary-900/40 dark:text-primary-300'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                  onClick={() => setViewMode('table')}
                >
                  <ListChecksIcon className='icon icon-sm' />
                  {t('patients.viewTable')}
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  role='tab'
                  aria-selected={viewMode === 'cards'}
                  className={`inline-flex items-center gap-1.5 ${
                    viewMode === 'cards'
                      ? 'bg-primary-100 text-primary-700 shadow-sm dark:bg-primary-900/40 dark:text-primary-300'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
                  }`}
                  onClick={() => setViewMode('cards')}
                >
                  <LayoutDashboardIcon className='icon icon-sm' />
                  {t('patients.viewCards')}
                </Button>
              </div>
            </div>
            {viewMode === 'table' ? (
              <Table
                key={localeCode}
                data={patients}
                columns={columns}
                onRowClick={handleRowClick}
                onRowMouseEnter={(row) => row?._id && prefetchPatient(row._id)}
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

            {patients.length > 0 && (
              <div className='mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-4 flex-wrap'>
                <div className='flex items-center gap-2'>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value, 10);
                      setPageSize(newSize);
                      setCurrentPage(1); // Reset to first page when changing page size
                    }}
                    className='px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors'
                    aria-label={t('common.showPerPage')}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={75}>75</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
                {totalPages > 1 && (
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      iconOnly
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label={t('common.previous')}
                      className='border border-neutral-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
                    >
                      <ChevronLeftIcon className='icon icon-sm' />
                    </Button>
                    <span className='text-body-sm text-neutral-700 dark:text-neutral-300 whitespace-nowrap px-2'>
                      {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                    </span>
                    <Button
                      variant='ghost'
                      size='sm'
                      iconOnly
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label={t('common.next')}
                      className='border border-neutral-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
                    >
                      <ChevronRightIcon className='icon icon-sm' />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {showModal && (
          <div
            className='fixed inset-0 bg-neutral-500/30 dark:bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'
            onClick={(e) => {
              // Close modal if clicking on the backdrop
              if (e.target === e.currentTarget) {
                setShowModal(false);
              }
            }}
          >
            <div className='bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 w-full max-w-md shadow-lg border border-transparent dark:border-neutral-600'>
              <h2 className='text-h2 text-neutral-900 dark:text-neutral-100 mb-3'>{t('patients.addNewPatient')}</h2>
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
                  <label className='block text-body-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1'>
                    {t('patients.gender')}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className='w-full px-3 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-primary-500 focus:shadow-focus'
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
