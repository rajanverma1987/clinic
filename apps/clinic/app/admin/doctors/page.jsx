'use client';

import { AdminToolbar } from '@/components/admin/AdminToolbar';
import {
  CheckIcon,
  EyeIcon,
  FileDownIcon,
  FilterIcon,
  MailIcon,
  ShieldIcon,
  TrashIcon,
  XIcon,
} from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useState } from 'react';

export default function AdminDoctorsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const { user, loading: authLoading } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState(''); // verified, pending, rejected, suspended
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [verificationComment, setVerificationComment] = useState('');
  const [verificationAction, setVerificationAction] = useState(''); // approve, reject
  const [expandedId, setExpandedId] = useState(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedVerification, setAdvancedVerification] = useState('');
  const [advancedSpecialty, setAdvancedSpecialty] = useState('');
  const [advancedLocation, setAdvancedLocation] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchDoctors();
    }
  }, [
    authLoading,
    user,
    pagination.page,
    searchTerm,
    verificationFilter,
    specialtyFilter,
    locationFilter,
  ]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (verificationFilter) params.append('verificationStatus', verificationFilter);
      if (specialtyFilter) params.append('specialty', specialtyFilter);
      if (locationFilter) params.append('location', locationFilter);

      const response = await apiClient.get(`/admin/doctors?${params.toString()}`);

      if (response.success && response.data) {
        setDoctors(extractArrayData(response));
        setPagination(extractPaginationData(response));
      }
    } catch (error) {
      logger.error('Failed to fetch doctors', error);
      showError(t('admin.failedToFetchDoctors'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doctorId, action) => {
    try {
      const response = await apiClient.post(`/admin/doctors/${doctorId}/verify`, {
        action, // approve, reject
        comment: verificationComment,
      });
      if (response.success) {
        showSuccess(
          action === 'approve'
            ? t('admin.doctorApprovedSuccess')
            : t('admin.doctorRejectedSuccess'),
        );
        setShowVerifyModal(false);
        setSelectedDoctor(null);
        setVerificationComment('');
        fetchDoctors();
      } else {
        showError(response.error?.message || t('admin.failedToVerifyDoctor'));
      }
    } catch (error) {
      showError(t('admin.failedToVerifyDoctor'));
    }
  };

  const handleSuspend = async (doctorId, suspend) => {
    try {
      const response = await apiClient.put(`/admin/doctors/${doctorId}`, {
        status: suspend ? 'suspended' : 'active',
      });
      if (response.success) {
        showSuccess(
          suspend ? t('admin.doctorSuspendedSuccess') : t('admin.doctorActivatedSuccess'),
        );
        fetchDoctors();
      } else {
        showError(response.error?.message || t('admin.failedToUpdateDoctorStatus'));
      }
    } catch (error) {
      showError(t('admin.failedToUpdateDoctorStatus'));
    }
  };

  const handleDelete = async (doctorId) => {
    openConfirm({
      title: t('common.delete'),
      message:
        t('admin.doctorDeleteConfirm') ||
        'Are you sure you want to delete this doctor? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await apiClient.delete(`/admin/doctors/${doctorId}`);
          if (response.success) {
            showSuccess(t('admin.doctorDeleted') || 'Doctor deleted successfully');
            fetchDoctors();
          } else {
            showError(response.error?.message || t('admin.failedToDeleteDoctor'));
          }
        } catch (error) {
          showError(t('admin.failedToDeleteDoctor'));
        }
      },
    });
  };

  const handleBulkAction = async (action) => {
    if (selectedDoctors.length === 0) {
      showError(t('admin.selectAtLeastOneDoctor'));
      return;
    }
    try {
      const response = await apiClient.post('/admin/doctors/bulk-action', {
        doctorIds: selectedDoctors,
        action, // export, notify, suspend, activate
      });
      if (response.success) {
        showSuccess(t('admin.bulkActionSuccess'));
        setSelectedDoctors([]);
        fetchDoctors();
      } else {
        showError(response.error?.message || t('admin.failedToPerformBulkAction'));
      }
    } catch (error) {
      showError(t('admin.failedToPerformBulkAction'));
    }
  };

  if (authLoading || loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  const getVerificationStatusColor = (status) => {
    const colors = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-neutral-100 text-neutral-800';
  };

  return (
    <Layout title={t('admin.doctors')} subtitle={t('admin.doctorsManagementSubtitle')}>
      <div className='admin-page-content'>
        <AdminToolbar
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder={t('admin.patientsSearchPlaceholder')}
          searchAriaLabel={t('admin.doctorsSearchPlaceholder') || 'Search doctors'}
          filters={[]}
          actions={
            <Button
              variant='secondary'
              size='sm'
              onClick={() => {
                setAdvancedVerification(verificationFilter);
                setAdvancedSpecialty(specialtyFilter);
                setAdvancedLocation(locationFilter);
                setShowAdvancedSearch(true);
              }}
            >
              <FilterIcon className='icon icon-sm' aria-hidden />
              {t('admin.patientsAdvancedSearch')}
            </Button>
          }
        />

        {/* Advanced search modal */}
        <Modal
          isOpen={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          title={t('admin.patientsAdvancedSearch')}
          size='sm'
          contentClassName='Modal-content--compact'
        >
          <div className='search-modal-grid'>
            <div className='search-modal-field'>
              <label>{t('admin.doctorsVerificationStatus') || 'Verification Status'}</label>
              <select
                className='filter-select w-full'
                value={advancedVerification}
                onChange={(e) => setAdvancedVerification(e.target.value)}
              >
                <option value=''>{t('admin.doctorsAllStatus')}</option>
                <option value='verified'>{t('admin.doctorsVerified')}</option>
                <option value='pending'>{t('admin.doctorsPending')}</option>
                <option value='rejected'>{t('admin.doctorsRejected')}</option>
                <option value='suspended'>{t('admin.doctorsSuspended')}</option>
              </select>
            </div>
            <div className='search-modal-field'>
              <label>{t('admin.doctorsSpecialtyLabel')}</label>
              <Input
                type='text'
                placeholder={t('admin.doctorsFilterBySpecialty')}
                value={advancedSpecialty}
                onChange={(e) => setAdvancedSpecialty(e.target.value)}
              />
            </div>
            <div className='search-modal-field full-width'>
              <label>{t('admin.doctorsLocationLabel')}</label>
              <Input
                type='text'
                placeholder={t('admin.doctorsFilterByLocation')}
                value={advancedLocation}
                onChange={(e) => setAdvancedLocation(e.target.value)}
              />
            </div>
          </div>
          <div className='search-modal-footer'>
            <Button variant='secondary' onClick={() => setShowAdvancedSearch(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant='primary'
              onClick={() => {
                setVerificationFilter(advancedVerification);
                setSpecialtyFilter(advancedSpecialty);
                setLocationFilter(advancedLocation);
                setPagination((p) => ({ ...p, page: 1 }));
                setShowAdvancedSearch(false);
              }}
            >
              {t('admin.applyFilters')}
            </Button>
          </div>
        </Modal>

        {/* Bulk Actions */}
        {selectedDoctors.length > 0 && (
          <Card className='mb-4 border-primary-200 bg-primary-50'>
            <div className='px-3 py-2 flex items-center justify-between gap-3'>
              <span className='text-body-sm font-medium text-primary-900'>
                {selectedDoctors.length} doctor{selectedDoctors.length > 1 ? 's' : ''} selected
              </span>
              <div className='flex items-center gap-1'>
                <Button
                  variant='secondary'
                  size='xs'
                  iconOnly
                  onClick={() => handleBulkAction('export')}
                  aria-label={t('common.export') || 'Export'}
                  title={t('common.export') || 'Export'}
                >
                  <FileDownIcon className='icon icon-xs' />
                </Button>
                <Button
                  variant='secondary'
                  size='xs'
                  iconOnly
                  onClick={() => handleBulkAction('notify')}
                  aria-label={t('admin.sendNotification') || 'Send Notification'}
                  title={t('admin.sendNotification') || 'Send Notification'}
                >
                  <MailIcon className='icon icon-xs' />
                </Button>
                <Button
                  variant='secondary'
                  size='xs'
                  iconOnly
                  onClick={() => handleBulkAction('suspend')}
                  aria-label={t('admin.suspend') || 'Suspend'}
                  title={t('admin.suspend') || 'Suspend'}
                >
                  <ShieldIcon className='icon icon-xs' />
                </Button>
                <Button
                  variant='ghost'
                  size='xs'
                  iconOnly
                  onClick={() => setSelectedDoctors([])}
                  aria-label={t('common.clearSelection') || 'Clear Selection'}
                  title={t('common.clearSelection') || 'Clear Selection'}
                >
                  <XIcon className='icon icon-xs' />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Doctors Table */}
        <Card>
          <div className='p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-neutral-900'>
                Doctors ({pagination.total})
              </h2>
            </div>
            {loading ? (
              <Loader type='section' text={t('common.loading')} />
            ) : doctors.length === 0 ? (
              <div className='text-center py-12'>
                <p className='text-neutral-500'>{t('admin.doctorsNoDoctorsFound')}</p>
              </div>
            ) : (
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th className='w-10'>
                        <input
                          type='checkbox'
                          checked={selectedDoctors.length === doctors.length && doctors.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDoctors(doctors.map((d) => d._id));
                            } else {
                              setSelectedDoctors([]);
                            }
                          }}
                        />
                      </th>
                      <th>{t('admin.doctorColumnDoctor') || 'Doctor'}</th>
                      <th>{t('admin.doctorColumnPhone') || 'Phone'}</th>
                      <th>{t('admin.doctorColumnSpecialty') || 'Specialty'}</th>
                      <th>{t('admin.doctorColumnTenant') || 'Tenant'}</th>
                      <th>{t('admin.doctorColumnLocation') || 'Location'}</th>
                      <th>{t('admin.doctorColumnStatus') || 'Status'}</th>
                      <th>{t('admin.doctorColumnRating') || 'Rating'}</th>
                      <th>{t('common.actions') || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <Fragment key={doctor._id}>
                        <tr>
                          <td>
                            <input
                              type='checkbox'
                              checked={selectedDoctors.includes(doctor._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDoctors([...selectedDoctors, doctor._id]);
                                } else {
                                  setSelectedDoctors(
                                    selectedDoctors.filter((id) => id !== doctor._id),
                                  );
                                }
                              }}
                            />
                          </td>
                          <td>
                            <div>
                              <p className='font-medium text-neutral-900'>
                                {doctor.userId?.firstName || doctor.firstName}{' '}
                                {doctor.userId?.lastName || doctor.lastName}
                              </p>
                              <p className='text-sm text-neutral-500'>
                                {doctor.userId?.email || doctor.email}
                              </p>
                            </div>
                          </td>
                          <td>
                            <span className='text-sm text-neutral-700'>
                              {doctor.userId?.phone || doctor.phone || '—'}
                            </span>
                          </td>
                          <td>
                            <span className='text-sm text-neutral-700'>
                              {[]
                                .concat(doctor.professional?.specialization || [])
                                .filter(Boolean)[0] || '—'}
                            </span>
                          </td>
                          <td>
                            <span className='text-sm text-neutral-700'>
                              {doctor.tenantName || '—'}
                            </span>
                          </td>
                          <td>
                            <span className='text-sm text-neutral-700'>
                              {doctor.clinics?.[0]?.address ||
                                (Array.isArray(doctor.clinics) && doctor.clinics[0]?.name) ||
                                '—'}
                            </span>
                          </td>
                          <td>
                            <Tag
                              className={getVerificationStatusColor(
                                doctor.verificationStatus || 'pending',
                              )}
                            >
                              {doctor.verificationStatus || 'pending'}
                            </Tag>
                          </td>
                          <td>
                            <div className='flex items-center gap-1'>
                              <span className='text-sm font-medium text-neutral-900'>
                                {doctor.averageRating ? doctor.averageRating.toFixed(1) : '—'}
                              </span>
                              {doctor.averageRating && (
                                <svg
                                  className='icon icon-xs text-yellow-400'
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                </svg>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className='flex flex-wrap items-center gap-1'>
                              <Button
                                variant='ghost'
                                size='xs'
                                onClick={() =>
                                  setExpandedId(expandedId === doctor._id ? null : doctor._id)
                                }
                                aria-label={
                                  expandedId === doctor._id
                                    ? t('admin.doctorHideDetails') || 'Hide details'
                                    : t('admin.doctorShowDetails') || 'Details'
                                }
                              >
                                {expandedId === doctor._id
                                  ? t('admin.doctorHideDetails') || 'Hide'
                                  : t('admin.doctorShowDetails') || 'Details'}
                              </Button>
                              <ActionsMenu
                                triggerSize='xs'
                                ariaLabel={t('common.actions') || 'Actions'}
                                items={[
                                  {
                                    key: 'view',
                                    label: t('common.view') || 'View',
                                    icon: <EyeIcon className='icon icon-sm' />,
                                    onClick: () => router.push(`/doctors/${doctor._id}`),
                                  },
                                  ...(doctor.verificationStatus === 'pending'
                                    ? [
                                        {
                                          key: 'verify',
                                          label: t('admin.verify') || 'Verify',
                                          icon: <CheckIcon className='icon icon-sm' />,
                                          onClick: () => {
                                            setSelectedDoctor(doctor);
                                            setVerificationAction('approve');
                                            setShowVerifyModal(true);
                                          },
                                        },
                                        {
                                          key: 'reject',
                                          label: t('admin.reject') || 'Reject',
                                          icon: <XIcon className='icon icon-sm' />,
                                          onClick: () => {
                                            setSelectedDoctor(doctor);
                                            setVerificationAction('reject');
                                            setShowVerifyModal(true);
                                          },
                                          danger: true,
                                        },
                                      ]
                                    : []),
                                  {
                                    key: 'suspend',
                                    label:
                                      doctor.verificationStatus === 'suspended'
                                        ? t('common.activate') || 'Activate'
                                        : t('admin.suspend') || 'Suspend',
                                    icon: <ShieldIcon className='icon icon-sm' />,
                                    onClick: () =>
                                      handleSuspend(
                                        doctor._id,
                                        doctor.verificationStatus !== 'suspended',
                                      ),
                                  },
                                  {
                                    key: 'delete',
                                    label: t('common.delete') || 'Delete',
                                    icon: <TrashIcon className='icon icon-sm' />,
                                    onClick: () => handleDelete(doctor._id),
                                    danger: true,
                                  },
                                ]}
                              />
                            </div>
                          </td>
                        </tr>
                        {expandedId === doctor._id && (
                          <tr>
                            <td colSpan={9} className='bg-neutral-50 p-4 align-top'>
                              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm'>
                                <div>
                                  <h4 className='font-semibold text-neutral-800 mb-2'>
                                    {t('admin.doctorDetailProfessional') || 'Professional'}
                                  </h4>
                                  <dl className='space-y-1'>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailLicense') || 'License'}
                                      </dt>
                                      <dd>{doctor.professional?.licenseNumber || '—'}</dd>
                                    </div>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailQualification') || 'Qualification'}
                                      </dt>
                                      <dd>{doctor.professional?.qualification || '—'}</dd>
                                    </div>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailExperience') || 'Experience'}
                                      </dt>
                                      <dd>
                                        {doctor.professional?.experienceYears != null
                                          ? `${doctor.professional.experienceYears} yr`
                                          : '—'}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailSpecializations') ||
                                          'Specializations'}
                                      </dt>
                                      <dd>
                                        {doctor.professional?.specialization &&
                                        doctor.professional.specialization.length
                                          ? doctor.professional.specialization.join(', ')
                                          : '—'}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailLanguages') || 'Languages'}
                                      </dt>
                                      <dd>
                                        {doctor.professional?.languages &&
                                        doctor.professional.languages.length
                                          ? doctor.professional.languages.join(', ')
                                          : '—'}
                                      </dd>
                                    </div>
                                  </dl>
                                </div>
                                <div>
                                  <h4 className='font-semibold text-neutral-800 mb-2'>
                                    {t('admin.doctorDetailFees') || 'Fees'}
                                  </h4>
                                  <dl className='space-y-1'>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailConsultation') || 'Consultation'}
                                      </dt>
                                      <dd>
                                        {doctor.consultationFee != null
                                          ? doctor.consultationFee
                                          : '—'}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailVideoConsultation') || 'Video'}
                                      </dt>
                                      <dd>
                                        {doctor.videoConsultationFee != null
                                          ? doctor.videoConsultationFee
                                          : '—'}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailFollowUp') || 'Follow-up'}
                                      </dt>
                                      <dd>
                                        {doctor.followUpFee != null ? doctor.followUpFee : '—'}
                                      </dd>
                                    </div>
                                    {doctor.procedureFees?.length > 0 && (
                                      <div>
                                        <dt className='text-neutral-500'>
                                          {t('admin.doctorDetailProcedures') || 'Procedures'}
                                        </dt>
                                        <dd>
                                          {doctor.procedureFees
                                            .map(
                                              (p) =>
                                                `${p.name || '—'}: ${p.fee != null ? p.fee : ''}`,
                                            )
                                            .join(', ')}
                                        </dd>
                                      </div>
                                    )}
                                  </dl>
                                </div>
                                <div>
                                  <h4 className='font-semibold text-neutral-800 mb-2'>
                                    {t('admin.doctorDetailVerification') || 'Verification'}
                                  </h4>
                                  <dl className='space-y-1'>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailReviewedAt') || 'Reviewed at'}
                                      </dt>
                                      <dd>
                                        {doctor.verificationReviewedAt
                                          ? new Date(doctor.verificationReviewedAt).toLocaleString()
                                          : '—'}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt className='text-neutral-500'>
                                        {t('admin.doctorDetailComment') || 'Comment'}
                                      </dt>
                                      <dd>{doctor.verificationComment || '—'}</dd>
                                    </div>
                                    {doctor.uploadedDocuments?.length > 0 && (
                                      <div>
                                        <dt className='text-neutral-500'>
                                          {t('admin.doctorDetailDocuments') || 'Documents'}
                                        </dt>
                                        <dd>
                                          {doctor.uploadedDocuments
                                            .map((doc) => doc.name || doc.type || '—')
                                            .join(', ')}
                                        </dd>
                                      </div>
                                    )}
                                  </dl>
                                </div>
                                {doctor.bio && (
                                  <div className='md:col-span-2'>
                                    <h4 className='font-semibold text-neutral-800 mb-2'>
                                      {t('admin.doctorDetailBio') || 'Bio'}
                                    </h4>
                                    <p className='text-neutral-700'>{doctor.bio}</p>
                                  </div>
                                )}
                                {doctor.clinics?.length > 0 && (
                                  <div className='md:col-span-2'>
                                    <h4 className='font-semibold text-neutral-800 mb-2'>
                                      {t('admin.doctorDetailClinics') || 'Clinics'}
                                    </h4>
                                    <ul className='list-disc list-inside text-neutral-700'>
                                      {doctor.clinics.map((c, i) => (
                                        <li key={i}>
                                          {c.name || ''} {c.address ? `— ${c.address}` : ''}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {doctor.schedule?.workingDays?.length > 0 && (
                                  <div>
                                    <h4 className='font-semibold text-neutral-800 mb-2'>
                                      {t('admin.doctorDetailSchedule') || 'Working days'}
                                    </h4>
                                    <p className='text-neutral-700'>
                                      {doctor.schedule.workingDays.join(', ')}
                                    </p>
                                  </div>
                                )}
                                {doctor.insuranceAccepted?.length > 0 && (
                                  <div>
                                    <h4 className='font-semibold text-neutral-800 mb-2'>
                                      {t('admin.doctorDetailInsurance') || 'Insurance'}
                                    </h4>
                                    <p className='text-neutral-700'>
                                      {doctor.insuranceAccepted.join(', ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <div className='text-sm text-neutral-600'>
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Verification Modal */}
        {showVerifyModal && selectedDoctor && (
          <div className='fixed inset-0 bg-neutral-500/30 backdrop-blur-sm flex items-center justify-center z-50'>
            <Card className='p-6 max-w-md w-full mx-4'>
              <h3 className='text-lg font-bold text-neutral-900 mb-4'>
                {verificationAction === 'approve' ? 'Approve Doctor' : 'Reject Doctor'}
              </h3>
              <div className='space-y-4'>
                <div>
                  <p className='text-sm text-neutral-600 mb-2'>
                    Doctor: {selectedDoctor.userId?.firstName} {selectedDoctor.userId?.lastName}
                  </p>
                  <p className='text-sm text-neutral-600 mb-4'>
                    Email: {selectedDoctor.userId?.email}
                  </p>
                </div>
                <div>
                  <label className='block text-sm font-medium text-neutral-700 mb-2'>
                    {verificationAction === 'approve' ? 'Approval' : 'Rejection'} Comment
                  </label>
                  <textarea
                    className='w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                    rows={4}
                    value={verificationComment}
                    onChange={(e) => setVerificationComment(e.target.value)}
                    placeholder={
                      verificationAction === 'approve'
                        ? 'Optional approval note...'
                        : 'Reason for rejection...'
                    }
                  />
                </div>
                {verificationAction === 'reject' && (
                  <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-800'>
                      Rejected doctors will be notified via email and can reapply with additional
                      documents.
                    </p>
                  </div>
                )}
                <div className='flex justify-end gap-3'>
                  <Button
                    variant='secondary'
                    onClick={() => {
                      setShowVerifyModal(false);
                      setSelectedDoctor(null);
                      setVerificationComment('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={verificationAction === 'approve' ? 'primary' : 'danger'}
                    onClick={() => handleVerify(selectedDoctor._id, verificationAction)}
                  >
                    {verificationAction === 'approve' ? 'Approve' : 'Reject'} Doctor
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
