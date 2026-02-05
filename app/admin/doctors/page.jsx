'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchDoctors();
    }
  }, [authLoading, user, pagination.page, verificationFilter, specialtyFilter, locationFilter]);

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
    <Layout
      title={t('admin.doctors')}
      subtitle={t('admin.doctorsManagementSubtitle')}
      actionButton={
        <Button variant='primary' onClick={() => router.push('/admin')}>
          {t('common.backToDashboard')}
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        {/* Filters */}
        <Card className='mb-6 overflow-hidden'>
          <div className='p-4 sm:p-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.doctorsSearchLabel')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.patientsSearchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchDoctors()}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  Verification Status
                </label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  value={verificationFilter}
                  onChange={(e) => {
                    setVerificationFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                >
                  <option value=''>{t('admin.doctorsAllStatus')}</option>
                  <option value='verified'>{t('admin.doctorsVerified')}</option>
                  <option value='pending'>{t('admin.doctorsPending')}</option>
                  <option value='rejected'>{t('admin.doctorsRejected')}</option>
                  <option value='suspended'>{t('admin.doctorsSuspended')}</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.doctorsSpecialtyLabel')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.doctorsFilterBySpecialty')}
                  value={specialtyFilter}
                  onChange={(e) => {
                    setSpecialtyFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.doctorsLocationLabel')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.doctorsFilterByLocation')}
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                />
              </div>
              <div className='flex items-end sm:col-span-2 lg:col-span-1'>
                <Button variant='primary' onClick={fetchDoctors} className='w-full min-w-[120px]'>
                  {t('admin.applyFilters')}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedDoctors.length > 0 && (
          <Card className='mb-6 border-primary-200 bg-primary-50'>
            <div className='p-4 flex items-center justify-between'>
              <span className='text-sm font-medium text-primary-900'>
                {selectedDoctors.length} doctor{selectedDoctors.length > 1 ? 's' : ''} selected
              </span>
              <div className='flex gap-2'>
                <Button variant='secondary' size='sm' onClick={() => handleBulkAction('export')}>
                  Export
                </Button>
                <Button variant='secondary' size='sm' onClick={() => handleBulkAction('notify')}>
                  Send Notification
                </Button>
                <Button variant='secondary' size='sm' onClick={() => handleBulkAction('suspend')}>
                  Suspend
                </Button>
                <Button variant='secondary' size='sm' onClick={() => setSelectedDoctors([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Doctors Table */}
        <Card>
          <div className='p-6'>
            <div className='mb-4 flex items-center justify-between'>
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
                      <th>Doctor</th>
                      <th>Specialty</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor._id}>
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
                            {doctor.professional?.specialization?.[0] || doctor.specialty || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className='text-sm text-neutral-700'>
                            {doctor.clinics?.[0]?.address || 'N/A'}
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
                              {doctor.averageRating ? doctor.averageRating.toFixed(1) : 'N/A'}
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
                          <div className='flex gap-2'>
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={() => router.push(`/doctors/${doctor._id}`)}
                            >
                              View
                            </Button>
                            {doctor.verificationStatus === 'pending' && (
                              <>
                                <Button
                                  variant='primary'
                                  size='sm'
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setVerificationAction('approve');
                                    setShowVerifyModal(true);
                                  }}
                                >
                                  Verify
                                </Button>
                                <Button
                                  variant='danger'
                                  size='sm'
                                  onClick={() => {
                                    setSelectedDoctor(doctor);
                                    setVerificationAction('reject');
                                    setShowVerifyModal(true);
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={() =>
                                handleSuspend(doctor._id, doctor.verificationStatus !== 'suspended')
                              }
                            >
                              {doctor.verificationStatus === 'suspended' ? 'Activate' : 'Suspend'}
                            </Button>
                            <Button
                              variant='danger'
                              size='sm'
                              onClick={() => handleDelete(doctor._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
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
