'use client';

import { EyeIcon, HistoryIcon, TrashIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
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
import { useCallback, useEffect, useState } from 'react';

export default function AdminPatientsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const { user, loading: authLoading } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [debouncedTenantFilter, setDebouncedTenantFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [hasAppointments, setHasAppointments] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [flagModal, setFlagModal] = useState({ open: false, patient: null, reason: '' });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTenantFilter(tenantFilter), 400);
    return () => clearTimeout(timer);
  }, [tenantFilter]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/doctors?limit=200&page=1');
      if (res.success) {
        setDoctors(extractArrayData(res) || []);
      }
    } catch (_) {
      setDoctors([]);
    }
  }, []);

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
    if (!authLoading && user?.role === 'super_admin') {
      fetchPatients();
    }
  }, [
    authLoading,
    user,
    pagination.page,
    debouncedSearchTerm,
    statusFilter,
    debouncedTenantFilter,
    dateFrom,
    dateTo,
    doctorFilter,
    hasAppointments,
    sortBy,
    sortOrder,
  ]);

  const fetchPatients = async (pageOverride) => {
    try {
      setLoading(true);
      const page = pageOverride ?? pagination.page;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm.trim());
      if (statusFilter) params.append('status', statusFilter);
      if (debouncedTenantFilter) params.append('tenantId', debouncedTenantFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (doctorFilter) params.append('doctorId', doctorFilter);
      if (hasAppointments === 'yes') params.append('hasAppointments', 'true');
      if (hasAppointments === 'no') params.append('hasAppointments', 'false');

      const response = await apiClient.get(`/admin/patients?${params.toString()}`);

      if (response.success && response.data) {
        setPatients(extractArrayData(response));
        const pag = extractPaginationData(response);
        setPagination((p) => ({
          ...p,
          page: pag.page,
          limit: pag.limit,
          total: pag.total,
          totalPages: pag.totalPages ?? Math.ceil((pag.total || 0) / (pag.limit || 50)),
        }));
      }
    } catch (error) {
      logger.error('Failed to fetch patients', error);
      showError(t('admin.failedToFetchPatients'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchPatients(1);
  };

  const handleFlag = async (patientId, reason) => {
    try {
      const response = await apiClient.put(`/admin/patients/${patientId}`, {
        status: undefined,
        flagged: true,
        flagReason: reason || 'Flagged by admin',
      });
      if (response.success) {
        showSuccess(t('admin.patientsFlag') + ' applied');
        setFlagModal({ open: false, patient: null, reason: '' });
        fetchPatients();
      } else {
        showError(response.error?.message || 'Failed to flag patient');
      }
    } catch (err) {
      showError(t('admin.failedToFlagPatient'));
    }
  };

  const handleUnflag = async (patientId) => {
    openConfirm({
      title: t('admin.patientsUnflag'),
      message: t('admin.patientsUnflagConfirm'),
      onConfirm: async () => {
        try {
          const response = await apiClient.put(`/admin/patients/${patientId}`, {
            status: undefined,
            flagged: false,
            flagReason: '',
          });
          if (response.success) {
            showSuccess(t('admin.patientsFlagRemoved'));
            fetchPatients();
          } else {
            showError(response.error?.message || t('admin.patientsUnflagFailed'));
          }
        } catch (err) {
          showError(t('admin.patientsUnflagFailed'));
        }
      },
    });
  };

  const handleSuspend = async (patientId, suspend) => {
    try {
      const response = await apiClient.put(`/admin/patients/${patientId}`, {
        status: suspend ? 'inactive' : 'active',
      });
      if (response.success) {
        showSuccess(`Patient ${suspend ? 'suspended' : 'activated'} successfully`);
        fetchPatients();
      } else {
        showError(response.error?.message || 'Failed to update patient status');
      }
    } catch (error) {
      showError(t('admin.failedToUpdatePatientStatus'));
    }
  };

  const handleDelete = async (patientId) => {
    openConfirm({
      title: t('common.delete'),
      message: t('admin.patientsDeleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await apiClient.delete(`/admin/patients/${patientId}`);
          if (response.success) {
            showSuccess(t('admin.patientsDeleted'));
            fetchPatients();
          } else {
            showError(response.error?.message || t('admin.patientsDeleteFailed'));
          }
        } catch (error) {
          showError(t('admin.patientsDeleteFailed'));
        }
      },
    });
  };

  const handleExport = async (patientIds = null) => {
    const ids = patientIds ?? selectedPatients;
    if (!ids.length) {
      showError(t('admin.selectAtLeastOnePatientToExport'));
      return;
    }
    try {
      setExporting(true);
      const response = await apiClient.post('/admin/patients/export', { patientIds: ids });
      if (response.success && response.data?.url) {
        window.open(response.data.url, '_blank');
        showSuccess(t('admin.exportStarted'));
      } else if (response.success && response.data?.csv) {
        const blob = new Blob([response.data.csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patients-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess(t('admin.exportDownloaded'));
      } else if (response.success && response.data?.blob) {
        const url = URL.createObjectURL(new Blob([response.data.blob]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `patients-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess(t('admin.exportDownloaded'));
      } else {
        showError(t('admin.exportFormatNotSupported'));
      }
    } catch (error) {
      showError(t('admin.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  const pages =
    (pagination.totalPages ?? Math.ceil((pagination.total || 0) / (pagination.limit || 50))) || 1;

  return (
    <Layout
      title={t('admin.patientsManagement')}
      subtitle={t('admin.patientsManagementSubtitle')}
      actionButton={
        <Button variant='primary' href='/admin'>
          {t('common.back')} to Dashboard
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='mb-6'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('common.search')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.patientsSearchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.patientsStatus')}
                </label>
                <select
                  className='filter-select'
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value=''>{t('common.all')}</option>
                  <option value='active'>{t('common.active')}</option>
                  <option value='inactive'>{t('common.inactive')}</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.patientsDateFrom')}
                </label>
                <Input
                  type='date'
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.patientsDateTo')}
                </label>
                <Input
                  type='date'
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.patientsDoctor')}
                </label>
                <select
                  className='filter-select'
                  value={doctorFilter}
                  onChange={(e) => {
                    setDoctorFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value=''>{t('common.all')}</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d.userId?._id || d._id}>
                      {d.userId
                        ? `${d.userId.firstName || ''} ${d.userId.lastName || ''}`.trim() ||
                          d.userId.email
                        : d._id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.patientsHasAppointments')}
                </label>
                <select
                  className='filter-select'
                  value={hasAppointments}
                  onChange={(e) => {
                    setHasAppointments(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value=''>{t('common.all')}</option>
                  <option value='yes'>Yes</option>
                  <option value='no'>No</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.patientsSort')}
                </label>
                <div className='flex gap-1'>
                  <select
                    className='filter-select'
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                  >
                    <option value='createdAt'>{t('admin.patientsSortCreated')}</option>
                    <option value='name'>{t('admin.patientsSortName')}</option>
                  </select>
                  <select
                    className='filter-select min-w-[5rem]'
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      setPagination((p) => ({ ...p, page: 1 }));
                    }}
                  >
                    <option value='desc'>Desc</option>
                    <option value='asc'>Asc</option>
                  </select>
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>
                  {t('admin.patientsTenantId')}
                </label>
                <Input
                  type='text'
                  placeholder={t('admin.patientsTenantId')}
                  value={tenantFilter}
                  onChange={(e) => {
                    setTenantFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                />
              </div>
              <div className='flex items-end gap-2'>
                <Button variant='primary' onClick={handleSearch} className='flex-1'>
                  {t('admin.patientsApplyFilters')}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {selectedPatients.length > 0 && (
          <Card className='mb-6 border-primary-200 bg-primary-50'>
            <div className='p-4 flex items-center justify-between'>
              <span className='text-sm font-medium text-primary-900'>
                {t('admin.patientsSelected', { count: selectedPatients.length })}
              </span>
              <div className='flex gap-2'>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => handleExport()}
                  disabled={exporting}
                >
                  {exporting ? '…' : t('admin.patientsExportSelected')}
                </Button>
                <Button variant='secondary' size='sm' onClick={() => setSelectedPatients([])}>
                  {t('admin.patientsClearSelection')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className='p-6'>
            <div className='mb-4 flex items-center justify-between flex-wrap gap-2'>
              <h2 className='text-lg font-semibold text-neutral-900'>
                {t('admin.patients')} ({pagination.total}){' '}
                {pagination.total !== undefined && pagination.limit !== undefined
                  ? `– ${t('admin.patientsShowing', { n: Math.min(patients.length, pagination.limit), total: pagination.total })}`
                  : ''}
              </h2>
              <div className='flex gap-2'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => handleExport(patients.map((p) => p._id))}
                  disabled={exporting || !patients.length}
                >
                  {exporting ? '…' : t('admin.patientsExportCsv')}
                </Button>
                <Button variant='secondary' size='sm' href='/admin/reports'>
                  {t('admin.patientsGenerateReport')}
                </Button>
              </div>
            </div>
            {loading ? (
              <Loader type='section' text={t('common.loading')} />
            ) : patients.length === 0 ? (
              <div className='text-center py-12'>
                <p className='text-neutral-500'>{t('admin.patientsNoPatients')}</p>
              </div>
            ) : (
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th className='w-10'>
                        <input
                          type='checkbox'
                          checked={
                            patients.length > 0 && selectedPatients.length === patients.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) setSelectedPatients(patients.map((p) => p._id));
                            else setSelectedPatients([]);
                          }}
                        />
                      </th>
                      <th>Patient</th>
                      <th>Contact</th>
                      <th>Tenant</th>
                      <th>Status</th>
                      <th>Flag</th>
                      <th>{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr
                        key={p._id}
                        className='cursor-pointer'
                        onClick={() => router.push(`/admin/patients/${p._id}`)}
                        role='button'
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/admin/patients/${p._id}`);
                          }
                        }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type='checkbox'
                            checked={selectedPatients.includes(p._id)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedPatients([...selectedPatients, p._id]);
                              else
                                setSelectedPatients(selectedPatients.filter((id) => id !== p._id));
                            }}
                          />
                        </td>
                        <td>
                          <div>
                            <p className='font-medium text-neutral-900'>
                              {p.firstName} {p.lastName}
                            </p>
                            <p className='text-sm text-neutral-500'>{p.patientId || '—'}</p>
                          </div>
                        </td>
                        <td>
                          <div className='text-sm'>
                            <p>{p.email || '—'}</p>
                            <p>{p.phone || '—'}</p>
                          </div>
                        </td>
                        <td className='text-neutral-700'>{p.tenantName || p.tenantId || '—'}</td>
                        <td>
                          <Tag
                            className={
                              p.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-neutral-100 text-neutral-800'
                            }
                          >
                            {p.status || 'active'}
                          </Tag>
                        </td>
                        <td>
                          {p.flagged ? (
                            <Tag className='bg-amber-100 text-amber-800'>
                              {t('admin.patientsFlagged')}
                            </Tag>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <ActionsMenu
                            ariaLabel={t('common.actions')}
                            items={[
                              {
                                key: 'view',
                                label: t('admin.patientsView'),
                                icon: <EyeIcon className='icon' />,
                                onClick: () => router.push(`/admin/patients/${p._id}`),
                              },
                              {
                                key: 'activityLog',
                                label: t('admin.patientsActivityLog'),
                                icon: <HistoryIcon className='icon' />,
                                onClick: () =>
                                  router.push(
                                    `/admin/activity-logs?resource=patient&resourceId=${p._id}`,
                                  ),
                              },
                              {
                                key: 'flag',
                                label: p.flagged
                                  ? t('admin.patientsUnflag')
                                  : t('admin.patientsFlag'),
                                onClick: () =>
                                  p.flagged
                                    ? handleUnflag(p._id)
                                    : setFlagModal({ open: true, patient: p, reason: '' }),
                              },
                              {
                                key: 'suspend',
                                label:
                                  p.status === 'inactive'
                                    ? t('admin.patientsActivate')
                                    : t('admin.patientsDeactivate'),
                                onClick: () => handleSuspend(p._id, p.status !== 'inactive'),
                              },
                              {
                                key: 'delete',
                                label: t('admin.patientsDelete'),
                                icon: <TrashIcon className='icon' />,
                                danger: true,
                                onClick: () => handleDelete(p._id),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pages > 1 && (
              <div className='mt-6 flex items-center justify-between'>
                <div className='text-sm text-neutral-600'>
                  Page {pagination.page} of {pages} ({pagination.total} total)
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {flagModal.open && flagModal.patient && (
          <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-neutral-500/30 backdrop-blur-sm'
            role='dialog'
            aria-modal='true'
          >
            <Card className='w-full max-w-md mx-4 p-6'>
              <h3 className='text-lg font-semibold text-neutral-900 mb-4'>
                {t('admin.patientsFlagModalTitle')}
              </h3>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>
                {t('admin.patientsFlagReason')}
              </label>
              <textarea
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4'
                rows={3}
                placeholder={t('admin.patientsFlagReasonPlaceholder')}
                value={flagModal.reason}
                onChange={(e) => setFlagModal((m) => ({ ...m, reason: e.target.value }))}
              />
              <div className='flex gap-2 justify-end'>
                <Button
                  variant='secondary'
                  onClick={() => setFlagModal({ open: false, patient: null, reason: '' })}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant='primary'
                  onClick={() => handleFlag(flagModal.patient._id, flagModal.reason)}
                >
                  {t('admin.patientsFlagSubmit')}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
