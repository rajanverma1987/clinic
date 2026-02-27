'use client';

import {
  CheckIcon,
  ChevronDownIcon,
  DocumentIcon,
  EyeIcon,
  FileDownIcon,
  FilterIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { apiClient } from '@/lib/api/client';
import { extractArrayData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

const STATUS_OPTIONS = [
  { value: '', labelKey: 'admin.verifyFilterAll' },
  { value: 'pending', labelKey: 'admin.verifyFilterPending' },
  { value: 'verified', labelKey: 'admin.verifyFilterVerified' },
  { value: 'rejected', labelKey: 'admin.verifyFilterRejected' },
];
const SORT_OPTIONS = [
  { value: 'createdAt', order: 'desc', labelKey: 'admin.verifySortDateApplied' },
  { value: 'updatedAt', order: 'desc', labelKey: 'admin.verifySortLastUpdated' },
  { value: 'verificationStatus', order: 'asc', labelKey: 'admin.verifySortStatus' },
];
const CHECKLIST_ITEMS = [
  { key: 'personal_info', labelKey: 'admin.verifyCheckPersonalInfo' },
  { key: 'license', labelKey: 'admin.verifyCheckLicense' },
  { key: 'npi', labelKey: 'admin.verifyCheckNPI' },
  { key: 'degree', labelKey: 'admin.verifyCheckDegree' },
  { key: 'background', labelKey: 'admin.verifyCheckBackground' },
  { key: 'bank', labelKey: 'admin.verifyCheckBank' },
];
const REQUEST_ITEMS = [
  { value: 'personal_info', labelKey: 'admin.verifyCheckPersonalInfo' },
  { value: 'license', labelKey: 'admin.verifyCheckLicense' },
  { value: 'npi', labelKey: 'admin.verifyCheckNPI' },
  { value: 'degree', labelKey: 'admin.verifyCheckDegree' },
  { value: 'background', labelKey: 'admin.verifyCheckBackground' },
  { value: 'bank', labelKey: 'admin.verifyCheckBank' },
];

function getChecklistStatus(doctor, key) {
  const u = doctor?.userId || {};
  const p = doctor?.professional || {};
  switch (key) {
    case 'personal_info':
      return !!(u.firstName && u.lastName && u.email);
    case 'license':
      return !!p.licenseNumber;
    case 'npi':
      return !!(p.npi || p.npiNumber);
    case 'degree':
      return !!p.qualification;
    case 'background':
      return p.experienceYears != null || p.specialization?.length;
    case 'bank':
      return !!(doctor?.bankDetails || doctor?.bankAccount);
    default:
      return false;
  }
}

function AdminDoctorVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [verificationComment, setVerificationComment] = useState('');
  const [requestDocumentType, setRequestDocumentType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const statusFilterWrapRef = useRef(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);
  const [showRequestMoreInfo, setShowRequestMoreInfo] = useState(false);
  const [requestMoreInfoItems, setRequestMoreInfoItems] = useState([]);
  const [requestMoreInfoMessage, setRequestMoreInfoMessage] = useState('');
  const [requestMoreInfoDeadline, setRequestMoreInfoDeadline] = useState('');
  const [approvalType, setApprovalType] = useState('full');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('verificationStatus', statusFilter);
      if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);
      params.set('limit', '100');
      const response = await apiClient.get(`/admin/doctors?${params.toString()}`);
      if (response.success && response.data) {
        setDoctors(extractArrayData(response));
      } else {
        setDoctors([]);
      }
    } catch (error) {
      logger.error('Failed to fetch doctors', error);
      showError(t('admin.failedToFetchDoctors'));
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchDoctors();
    }
  }, [authLoading, user, fetchDoctors]);

  useEffect(() => {
    const status = searchParams?.get('status') ?? '';
    setStatusFilter(status);
  }, [searchParams?.get('status')]);

  useEffect(() => {
    if (!statusFilterOpen) return;
    const handleOutside = (e) => {
      if (statusFilterWrapRef.current && !statusFilterWrapRef.current.contains(e.target)) {
        setStatusFilterOpen(false);
      }
    };
    const t = setTimeout(() => {
      document.addEventListener('mousedown', handleOutside, true);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleOutside, true);
    };
  }, [statusFilterOpen]);

  useEffect(() => {
    const doctorId = searchParams?.get('doctorId');
    if (doctorId) {
      fetchDoctorDetails(doctorId);
    }
  }, [searchParams]);

  const fetchDoctorDetails = async (doctorId) => {
    try {
      const response = await apiClient.get(`/admin/doctors/${doctorId}`);
      if (response.success && response.data) {
        setSelectedDoctor(response.data);
        // Fetch uploaded documents
        const docsResponse = await apiClient.get(`/admin/doctors/${doctorId}/documents`);
        if (docsResponse.success && docsResponse.data) {
          setDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
        }
      }
    } catch (error) {
      logger.error('Failed to fetch doctor details', error);
      showError(t('admin.failedToFetchDoctorDetails'));
    }
  };

  const handleApprove = async (doctorId) => {
    try {
      setSubmitting(true);
      const response = await apiClient.post(`/admin/doctors/${doctorId}/verify`, {
        action: 'approve',
        comment: verificationComment,
      });
      if (response.success) {
        showSuccess(t('admin.doctorApprovedSuccess'));
        setSelectedDoctor(null);
        setVerificationComment('');
        fetchDoctors();
      } else {
        showError(response.error?.message || 'Failed to approve doctor');
      }
    } catch (error) {
      showError(t('admin.failedToApproveDoctor'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (doctorId) => {
    if (!verificationComment.trim()) {
      showError(t('admin.reasonForRejectionRequired'));
      return;
    }
    try {
      setSubmitting(true);
      const response = await apiClient.post(`/admin/doctors/${doctorId}/verify`, {
        action: 'reject',
        comment: verificationComment,
      });
      if (response.success) {
        showSuccess(t('admin.doctorRejectedEmailSent'));
        setSelectedDoctor(null);
        setVerificationComment('');
        fetchDoctors();
      } else {
        showError(response.error?.message || 'Failed to reject doctor');
      }
    } catch (error) {
      showError(t('admin.failedToRejectDoctor'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDocuments = async (doctorId) => {
    if (!requestDocumentType.trim()) {
      showError(t('admin.specifyDocumentsNeeded'));
      return;
    }
    try {
      const response = await apiClient.post(`/admin/doctors/${doctorId}/request-documents`, {
        documentType: requestDocumentType,
        comment: verificationComment,
      });
      if (response.success) {
        showSuccess(t('admin.documentRequestSent'));
        setRequestDocumentType('');
        setVerificationComment('');
      } else {
        showError(response.error?.message || 'Failed to request documents');
      }
    } catch (error) {
      showError(t('admin.failedToRequestDocuments'));
    }
  };

  const handleRequestMoreInfoSubmit = async () => {
    if (!selectedDoctor?._id) return;
    if (requestMoreInfoItems.length === 0 && !requestMoreInfoMessage.trim()) {
      showError(t('admin.selectItemOrMessage'));
      return;
    }
    try {
      setSubmitting(true);
      const response = await apiClient.post(
        `/admin/doctors/${selectedDoctor._id}/request-documents`,
        {
          items: requestMoreInfoItems.length ? requestMoreInfoItems : ['other'],
          comment: requestMoreInfoMessage,
          deadline: requestMoreInfoDeadline || undefined,
        },
      );
      if (response.success) {
        showSuccess(t('admin.verifyRequestSent'));
        setShowRequestMoreInfo(false);
        setRequestMoreInfoItems([]);
        setRequestMoreInfoMessage('');
        setRequestMoreInfoDeadline('');
      } else {
        showError(response.error?.message || 'Failed to send request');
      }
    } catch (error) {
      showError(t('admin.failedToSendRequest'));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <Layout loading />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  return (
    <Layout>
      <PageHeader
        title={t('admin.verifyPageTitle')}
        subtitle={t('admin.verifyPageSubtitle')}
        notifications={[]}
        unreadCount={0}
        onRefresh={fetchDoctors}
      />
      <div className='admin-page-content'>
        {/* Filters: status (segmented), sort, search */}
        <section className='admin-section'>
          <Card>
            <div className='verify-filters-bar' ref={statusFilterWrapRef}>
              <div className='verify-filters-bar__row'>
                <div className='verify-filters-bar__status-wrap'>
                  <Button
                    type='button'
                    variant='ghost'
                    className='verify-filters-bar__status-trigger'
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatusFilterOpen((open) => !open);
                    }}
                    aria-expanded={statusFilterOpen}
                    aria-haspopup='listbox'
                    aria-label={t('admin.verifyFilters')}
                    title={t('admin.verifyFilters')}
                  >
                    <FilterIcon className='icon icon-sm shrink-0' aria-hidden />
                    <span className='verify-filters-bar__status-trigger-label'>
                      {statusFilter
                        ? t(
                            STATUS_OPTIONS.find((o) => o.value === statusFilter)?.labelKey ||
                              'admin.verifyFilterAll',
                          )
                        : t('admin.verifyFilterAll')}
                    </span>
                    <ChevronDownIcon
                      className={`icon icon-sm shrink-0 transition-transform ${statusFilterOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </Button>
                </div>
                <div className='verify-filters-bar__sort'>
                  <select
                    id='verify-sort'
                    className='verify-filters-bar__sort-select'
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [s, o] = e.target.value.split('-');
                      setSortBy(s);
                      setSortOrder(o);
                    }}
                    aria-label={t('admin.verifySort')}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={`${opt.value}-${opt.order}`}>
                        {t(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='verify-filters-bar__search'>
                  <Input
                    type='text'
                    size='md'
                    placeholder={t('admin.verifySearchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchDoctors()}
                    className='flex-1 min-w-0'
                    aria-label={t('admin.verifySearchPlaceholder')}
                  />
                  <Button
                    variant='secondary'
                    size='md'
                    onClick={fetchDoctors}
                    aria-label={t('common.search')}
                  >
                    <SearchIcon className='icon icon-sm' aria-hidden />
                    {t('common.search')}
                  </Button>
                </div>
              </div>
              {statusFilterOpen && (
                <div
                  className='verify-filters-bar__status'
                  role='listbox'
                  aria-label={t('admin.verifyFilters')}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value || 'all'}
                      type='button'
                      variant='ghost'
                      role='option'
                      aria-selected={statusFilter === opt.value}
                      className={`verify-filters-bar__status-btn ${statusFilter === opt.value ? 'verify-filters-bar__status-btn--active' : ''}`}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        const q = opt.value ? `?status=${opt.value}` : '';
                        router.push(`/admin/doctors/verify${q}`);
                        setStatusFilterOpen(false);
                      }}
                    >
                      {t(opt.labelKey)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </section>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Doctor list */}
          <div className='lg:col-span-1'>
            <Card>
              <div className='p-4 border-b border-neutral-100'>
                <div className='admin-section__title' style={{ marginBottom: 0 }}>
                  <span className='admin-section__accent' />
                  <h2 className='admin-section__title-text'>
                    {t('admin.verifyListTitle')} ({doctors.length})
                  </h2>
                </div>
              </div>
              <div className='p-4'>
                <div className='space-y-3'>
                  {doctors.length === 0 ? (
                    <p className='text-neutral-500 text-center py-8'>
                      {t('admin.verifyNoApplications')}
                    </p>
                  ) : (
                    doctors.map((doctor) => (
                      <div
                        key={doctor._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedDoctor?._id === doctor._id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-600'
                            : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50 dark:border-neutral-600 dark:hover:border-primary-600 dark:hover:bg-neutral-800'
                        }`}
                        onClick={() => {
                          router.push(`/admin/doctors/verify?doctorId=${doctor._id}`);
                        }}
                      >
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex-1'>
                            <p className='font-semibold text-neutral-900 dark:text-neutral-100'>
                              {doctor.userId?.firstName || doctor.firstName}{' '}
                              {doctor.userId?.lastName || doctor.lastName}
                            </p>
                            <p className='text-sm text-neutral-600 dark:text-neutral-400'>
                              {doctor.userId?.email || doctor.email}
                            </p>
                          </div>
                          <Tag
                            className={
                              doctor.verificationStatus === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : doctor.verificationStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {(doctor.verificationStatus || 'pending').replace('_', ' ')}
                          </Tag>
                        </div>
                        <p className='text-xs text-neutral-500 mt-2'>
                          Applied: {new Date(doctor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Doctor Details & Verification */}
          <div className='lg:col-span-2'>
            {selectedDoctor ? (
              <div className='space-y-6'>
                {/* Verification checklist */}
                <Card>
                  <div className='p-4 border-b border-neutral-100'>
                    <div className='admin-section__title' style={{ marginBottom: 0 }}>
                      <span className='admin-section__accent' />
                      <h2 className='admin-section__title-text'>{t('admin.verifyChecklist')}</h2>
                    </div>
                  </div>
                  <div className='p-6'>
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                      {CHECKLIST_ITEMS.map((item) => {
                        const ok = getChecklistStatus(selectedDoctor, item.key);
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${ok ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}
                          >
                            {ok ? (
                              <CheckIcon className='icon icon-sm flex-shrink-0' aria-hidden />
                            ) : (
                              <span
                                className='text-neutral-400 w-5 h-5 flex items-center justify-center'
                                aria-hidden
                              >
                                —
                              </span>
                            )}
                            <span className='text-sm font-medium'>{t(item.labelKey)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className='text-xs text-neutral-500 mt-3'>
                      {t('admin.verifyNPIResult')}:{' '}
                      {selectedDoctor.professional?.npiVerified
                        ? t('admin.verifyNPIVerified')
                        : t('admin.verifyNPINotVerified')}
                    </p>
                  </div>
                </Card>

                {/* Doctor Information */}
                <Card>
                  <div className='p-4 border-b border-neutral-100'>
                    <div className='admin-section__title' style={{ marginBottom: 0 }}>
                      <span className='admin-section__accent' />
                      <h2 className='admin-section__title-text'>{t('admin.verifyDoctorInfo')}</h2>
                    </div>
                  </div>
                  <div className='p-6'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <p className='text-sm text-neutral-600'>Name</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.userId?.firstName || selectedDoctor.firstName}{' '}
                          {selectedDoctor.userId?.lastName || selectedDoctor.lastName}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>Email</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.userId?.email || selectedDoctor.email}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>Phone</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.userId?.phone || selectedDoctor.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>Specialty</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.professional?.specialization?.[0] ||
                            selectedDoctor.specialty ||
                            'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>License Number</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.professional?.licenseNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-neutral-600'>Experience</p>
                        <p className='font-semibold text-neutral-900'>
                          {selectedDoctor.professional?.experienceYears || 'N/A'} years
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Uploaded Documents */}
                <Card>
                  <div className='p-4 border-b border-neutral-100'>
                    <div className='admin-section__title' style={{ marginBottom: 0 }}>
                      <span className='admin-section__accent' />
                      <h2 className='admin-section__title-text'>{t('admin.verifyUploadedDocs')}</h2>
                    </div>
                  </div>
                  <div className='p-6'>
                    <div className='space-y-3'>
                      {documents.length === 0 ? (
                        <p className='text-neutral-500 text-center py-4'>
                          {t('admin.verifyNoDocuments')}
                        </p>
                      ) : (
                        documents.map((doc, index) => (
                          <div
                            key={index}
                            className='p-4 border border-neutral-200 rounded-lg flex items-center justify-between flex-wrap gap-2'
                          >
                            <div>
                              <p className='font-medium text-neutral-900'>
                                {doc.type || 'Document'}
                              </p>
                              <p className='text-sm text-neutral-600'>{doc.filename || doc.name}</p>
                            </div>
                            <div className='flex gap-2'>
                              <Button
                                variant='secondary'
                                size='sm'
                                onClick={() => doc.url && window.open(doc.url, '_blank')}
                                aria-label={t('admin.verifyView')}
                              >
                                <EyeIcon className='icon icon-sm' aria-hidden />
                                {t('admin.verifyView')}
                              </Button>
                              <Button
                                variant='secondary'
                                size='sm'
                                onClick={() => {
                                  if (doc.url) {
                                    const a = document.createElement('a');
                                    a.href = doc.url;
                                    a.download = doc.name || doc.filename || 'document';
                                    a.target = '_blank';
                                    a.rel = 'noopener';
                                    a.click();
                                  }
                                }}
                                aria-label={t('admin.verifyDownload')}
                              >
                                <FileDownIcon className='icon icon-sm' aria-hidden />
                                {t('admin.verifyDownload')}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>

                {/* Verification actions */}
                <Card>
                  <div className='p-4 border-b border-neutral-100'>
                    <div className='admin-section__title' style={{ marginBottom: 0 }}>
                      <span className='admin-section__accent' />
                      <h2 className='admin-section__title-text'>{t('admin.verifyActions')}</h2>
                    </div>
                  </div>
                  <div className='p-6'>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-neutral-700 mb-2'>
                          {t('admin.verifyAdminNotes')}
                        </label>
                        <textarea
                          className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                          rows={4}
                          value={verificationComment}
                          onChange={(e) => setVerificationComment(e.target.value)}
                          placeholder={t('admin.verifyAdminNotesPlaceholder')}
                        />
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        <label className='text-sm font-medium text-neutral-700 mr-2'>
                          {t('admin.verifyApprovalType')}
                        </label>
                        <select
                          className='px-3 py-2 border border-neutral-300 rounded-lg text-sm'
                          value={approvalType}
                          onChange={(e) => setApprovalType(e.target.value)}
                        >
                          <option value='full'>{t('admin.verifyApprovalFull')}</option>
                          <option value='conditional'>
                            {t('admin.verifyApprovalConditional')}
                          </option>
                        </select>
                        <label className='flex items-center gap-2 ml-4'>
                          <input
                            type='checkbox'
                            checked={sendWelcomeEmail}
                            onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                          />
                          <span className='text-sm text-neutral-700'>
                            {t('admin.verifySendWelcomeEmail')}
                          </span>
                        </label>
                      </div>
                      <div className='flex flex-wrap gap-3'>
                        <Button
                          variant='primary'
                          onClick={() => handleApprove(selectedDoctor._id)}
                          disabled={submitting}
                          aria-label={t('admin.verifyConfirmApprove')}
                        >
                          <CheckIcon className='icon icon-sm' aria-hidden />
                          {submitting ? t('common.loading') : t('admin.verifyConfirmApprove')}
                        </Button>
                        <Button
                          variant='danger'
                          onClick={() => handleReject(selectedDoctor._id)}
                          disabled={submitting}
                          aria-label={t('admin.verifyReject')}
                        >
                          <XIcon className='icon icon-sm' aria-hidden />
                          {submitting ? t('common.loading') : t('admin.verifyReject')}
                        </Button>
                        <Button
                          variant='secondary'
                          onClick={() => setShowRequestMoreInfo(true)}
                          aria-label={t('admin.verifyRequestMoreInfo')}
                        >
                          <DocumentIcon className='icon icon-sm' aria-hidden />
                          {t('admin.verifyRequestMoreInfo')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Request additional documents */}
                <Card>
                  <div className='p-4 border-b border-neutral-100'>
                    <div className='admin-section__title' style={{ marginBottom: 0 }}>
                      <span className='admin-section__accent' />
                      <h2 className='admin-section__title-text'>{t('admin.verifyRequestDoc')}</h2>
                    </div>
                  </div>
                  <div className='p-6'>
                    <div className='space-y-4'>
                      <div>
                        <Select
                          label={t('admin.verifyDocumentType')}
                          value={requestDocumentType}
                          onChange={(e) => setRequestDocumentType(e.target.value)}
                          options={[
                            { value: '', label: t('admin.verifySelectDocType') },
                            { value: 'medical_license', label: t('admin.verifyDocMedicalLicense') },
                            { value: 'degree_certificate', label: t('admin.verifyDocDegree') },
                            { value: 'id_proof', label: t('admin.verifyDocIdProof') },
                            { value: 'clinic_registration', label: t('admin.verifyDocClinicReg') },
                            { value: 'other', label: t('common.other') },
                          ]}
                        />
                      </div>
                      <Button
                        variant='secondary'
                        onClick={() => handleRequestDocuments(selectedDoctor._id)}
                        disabled={!requestDocumentType.trim()}
                        aria-label={t('admin.verifyRequestDocument')}
                      >
                        <DocumentIcon className='icon icon-sm' aria-hidden />
                        {t('admin.verifyRequestDocument')}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* 5.7: Request More Info modal – select items, message, deadline, [Send Request] */}
                {showRequestMoreInfo && (
                  <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
                    <Card className='p-6 max-w-md w-full max-h-[90vh] overflow-y-auto'>
                      <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                        {t('admin.verifyRequestMoreInfo')}
                      </h3>
                      <div className='space-y-4'>
                        <div>
                          <label className='block text-sm font-medium text-neutral-700 mb-2'>
                            {t('admin.verifySelectItems')}
                          </label>
                          <div className='space-y-2'>
                            {REQUEST_ITEMS.map((item) => (
                              <label key={item.value} className='flex items-center gap-2'>
                                <input
                                  type='checkbox'
                                  checked={requestMoreInfoItems.includes(item.value)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setRequestMoreInfoItems((prev) => [...prev, item.value]);
                                    } else {
                                      setRequestMoreInfoItems((prev) =>
                                        prev.filter((x) => x !== item.value),
                                      );
                                    }
                                  }}
                                />
                                <span className='text-sm text-neutral-700'>{t(item.labelKey)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-neutral-700 mb-2'>
                            {t('admin.verifyMessage')}
                          </label>
                          <textarea
                            className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500'
                            rows={3}
                            value={requestMoreInfoMessage}
                            onChange={(e) => setRequestMoreInfoMessage(e.target.value)}
                            placeholder={t('admin.verifyMessagePlaceholder')}
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-neutral-700 mb-2'>
                            {t('admin.verifyDeadline')}
                          </label>
                          <Input
                            type='date'
                            value={requestMoreInfoDeadline}
                            onChange={(e) => setRequestMoreInfoDeadline(e.target.value)}
                          />
                        </div>
                        <div className='flex justify-end gap-2 pt-4'>
                          <Button variant='secondary' onClick={() => setShowRequestMoreInfo(false)}>
                            {t('common.cancel')}
                          </Button>
                          <Button
                            variant='primary'
                            onClick={handleRequestMoreInfoSubmit}
                            disabled={
                              submitting ||
                              (requestMoreInfoItems.length === 0 && !requestMoreInfoMessage.trim())
                            }
                          >
                            {submitting ? t('common.loading') : t('admin.verifySendRequest')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <div className='p-12 text-center'>
                  <UserIcon
                    className='icon icon-2xl text-neutral-300 dark:text-neutral-600 mx-auto mb-4'
                    aria-hidden
                  />
                  <p className='text-neutral-500 dark:text-neutral-400 mb-4'>
                    {t('admin.verifySelectDoctorPrompt')}
                  </p>
                  <Button
                    variant='secondary'
                    href='/admin/doctors'
                    aria-label={t('admin.verifyViewAllDoctors')}
                  >
                    {t('admin.verifyViewAllDoctors')}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function AdminDoctorVerificationPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<Loader type='page' text={t('common.loading')} />}>
      <AdminDoctorVerificationContent />
    </Suspense>
  );
}
