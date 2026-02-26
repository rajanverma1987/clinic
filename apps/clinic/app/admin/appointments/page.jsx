'use client';

import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { EyeIcon, FileDownIcon, TrashIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { ActionsMenu } from '@/components/ui/ActionsMenu';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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

const APPOINTMENT_TYPES = [
  { value: 'consultation', labelKey: 'admin.appointmentTypeConsultation' },
  { value: 'follow_up', labelKey: 'admin.appointmentTypeFollowUp' },
  { value: 'checkup', labelKey: 'admin.appointmentTypeCheckup' },
  { value: 'emergency', labelKey: 'admin.appointmentTypeEmergency' },
  { value: 'procedure', labelKey: 'admin.appointmentTypeProcedure' },
  { value: 'lab_test', labelKey: 'admin.appointmentTypeLabTest' },
];

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, cancelled: 0, no_show: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.replace('/dashboard');
        return;
      }
      fetchAppointments();
    }
  }, [authLoading, user]);

  const fetchAppointments = async (pageOverride) => {
    try {
      setLoading(true);
      const page = pageOverride ?? pagination.page;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await apiClient.get(`/admin/appointments?${params.toString()}`);
      if (response.success && response.data) {
        setAppointments(extractArrayData(response));
        const payload =
          typeof response.data === 'object' && response.data !== null ? response.data : {};
        if (payload.stats) setStats(payload.stats);
        const pag = extractPaginationData(response);
        setPagination((p) => ({
          ...p,
          page: pag.page ?? p.page,
          limit: pag.limit ?? p.limit,
          total: pag.total ?? 0,
          totalPages: pag.totalPages ?? pag.pages ?? 1,
        }));
      }
    } catch (err) {
      logger.error('Failed to fetch appointments', err);
      showError(t('admin.failedToFetchAppointments'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (appointmentId) => {
    try {
      setDownloadingId(appointmentId);
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const res = await fetch(`${base}/api/admin/appointments/${appointmentId}/report`, {
        credentials: 'include',
        headers: { Accept: 'text/csv' },
      });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = t('admin.downloadFailed') || 'Download failed';
        try {
          const j = JSON.parse(text);
          if (j?.error) errMsg = j.error;
        } catch {
          // Keep default errMsg if response is not JSON
        }
        if (res.status === 403) errMsg = t('errors.unauthorized') || 'Unauthorized';
        if (res.status === 404) errMsg = t('admin.reportNotFound') || 'Report not found';
        throw new Error(errMsg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointment-${appointmentId}-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess(t('admin.reportDownloaded') || 'Report downloaded');
    } catch (err) {
      showError(err?.message || t('admin.downloadFailed') || 'Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchAppointments(1);
  };

  const handleCancel = async (id) => {
    openConfirm({
      title: t('appointments.cancelAppointment'),
      message:
        t('admin.appointmentCancelConfirm') ||
        'Cancel this appointment? The patient and doctor will not be automatically notified from this screen.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await apiClient.put(`/admin/appointments/${id}/status`, {
            status: 'cancelled',
          });
          if (response?.success) {
            showSuccess(t('appointments.cancelled') || 'Appointment cancelled');
            fetchAppointments();
          } else {
            showError(response?.error?.message || 'Failed to cancel');
          }
        } catch (err) {
          showError(t('admin.failedToCancelAppointment'));
        }
      },
    });
  };

  if (authLoading || loading)
    return (
      <Layout
        title={t('admin.appointments')}
        subtitle={t('admin.appointmentsSubtitleAll')}
        loading
        loadingText={t('common.loading')}
      />
    );
  if (user?.role !== 'super_admin') return null;

  const pages =
    (pagination.totalPages ?? Math.ceil((pagination.total || 0) / (pagination.limit || 50))) || 1;

  return (
    <Layout
      title={t('admin.appointments')}
      subtitle={t('admin.appointmentsSubtitleAll')}
      actionButton={
        <Button variant='secondary' href='/admin/appointments/analytics'>
          {t('admin.analytics')}
        </Button>
      }
    >
      <div className='admin-page-content'>
        <AdminToolbar
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder={t('admin.appointmentsSearchPlaceholder') || 'Search by appointment'}
          searchAriaLabel={t('admin.appointmentsBookingId') || 'Search appointments'}
          filters={[
            <Select
              key='status'
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              width='fit'
              size='sm'
              options={[
                { value: '', label: t('admin.appointmentsStatusLabel') || 'Status' },
                { value: 'scheduled', label: t('admin.appointmentsScheduled') },
                { value: 'confirmed', label: t('admin.appointmentsConfirmed') },
                { value: 'arrived', label: t('admin.appointmentsArrived') },
                { value: 'in_progress', label: t('admin.appointmentsInProgress') },
                { value: 'completed', label: t('admin.appointmentsCompleted') },
                { value: 'cancelled', label: t('admin.appointmentsCancelled') },
                { value: 'no_show', label: t('admin.appointmentsNoShow') },
              ]}
            />,
            <Select
              key='type'
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              width='fit'
              size='sm'
              options={[
                { value: '', label: t('admin.appointmentsType') || 'Type' },
                ...APPOINTMENT_TYPES.map((type) => ({
                  value: type.value,
                  label: t(type.labelKey),
                })),
              ]}
            />,
            <Input
              key='startDate'
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='form-control-height form-control-md w-full min-w-[140px]'
              aria-label={t('admin.appointmentsFromDate') || 'From date'}
            />,
            <Input
              key='endDate'
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='form-control-height form-control-md w-full min-w-[140px]'
              aria-label={t('admin.appointmentsToDate') || 'To date'}
            />,
          ]}
          actions={
            <Button variant='primary' size='sm' onClick={handleSearch}>
              {t('admin.activityLogsApply')}
            </Button>
          }
        />

        <div className='mb-4 grid grid-cols-2 md:grid-cols-4 gap-3'>
          <Card className='p-4'>
            <span className='text-sm text-neutral-600'>{t('admin.appointmentsStatsTotal')}</span>
            <p className='text-xl font-semibold text-neutral-900'>{stats.total ?? 0}</p>
          </Card>
          <Card className='p-4'>
            <span className='text-sm text-neutral-600'>
              {t('admin.appointmentsStatsCompleted')}
            </span>
            <p className='text-xl font-semibold text-green-700'>{stats.completed ?? 0}</p>
          </Card>
          <Card className='p-4'>
            <span className='text-sm text-neutral-600'>
              {t('admin.appointmentsStatsCancelled')}
            </span>
            <p className='text-xl font-semibold text-amber-700'>{stats.cancelled ?? 0}</p>
          </Card>
          <Card className='p-4'>
            <span className='text-sm text-neutral-600'>{t('admin.appointmentsStatsNoShow')}</span>
            <p className='text-xl font-semibold text-red-700'>{stats.no_show ?? 0}</p>
          </Card>
        </div>

        <Card>
          <div className='p-6'>
            <h2 className='text-lg font-semibold text-neutral-900 mb-4'>
              {t('admin.appointments')} ({pagination.total})
            </h2>
            {appointments.length === 0 ? (
              <p className='text-neutral-500'>{t('admin.appointmentsNoAppointmentsFound')}</p>
            ) : (
              <div className='clinic-table-wrap'>
                <table className='clinic-table'>
                  <thead>
                    <tr>
                      <th>{t('admin.appointmentsBookingId')}</th>
                      <th>{t('admin.appointmentsDateTime')}</th>
                      <th>{t('admin.appointmentsPatient')}</th>
                      <th>{t('admin.appointmentsDoctor')}</th>
                      <th>{t('admin.appointmentsTenant')}</th>
                      <th>{t('admin.appointmentsStatusLabel')}</th>
                      <th>{t('admin.appointmentsActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a._id}>
                        <td className='font-medium'>{a.appointmentNumber || '—'}</td>
                        <td>
                          {a.appointmentDate
                            ? new Date(a.appointmentDate).toLocaleDateString()
                            : '—'}
                          {a.startTime &&
                            ` ${new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </td>
                        <td>{a.patientName || '—'}</td>
                        <td>{a.doctorName || '—'}</td>
                        <td className='text-neutral-600'>{a.tenantName || '—'}</td>
                        <td>
                          <Tag className='bg-neutral-100 text-neutral-800'>{a.status || '—'}</Tag>
                        </td>
                        <td>
                          <ActionsMenu
                            ariaLabel={t('common.actions') || 'Actions'}
                            triggerSize='xs'
                            items={[
                              {
                                key: 'view',
                                label: t('admin.appointmentsViewDetails') || 'View Details',
                                icon: <EyeIcon className='icon icon-sm' />,
                                onClick: () => router.push(`/appointments/${a._id}`),
                              },
                              {
                                key: 'download',
                                label:
                                  downloadingId === a._id
                                    ? t('common.loading') || '…'
                                    : t('admin.appointmentsDownloadReport') || 'Download Report',
                                icon: <FileDownIcon className='icon icon-sm' />,
                                onClick: () => handleDownloadReport(a._id),
                                disabled: downloadingId === a._id,
                              },
                              ...(a.status !== 'cancelled' && a.status !== 'completed'
                                ? [
                                    {
                                      key: 'cancel',
                                      label: t('appointments.cancelAppointment') || 'Cancel',
                                      icon: <TrashIcon className='icon icon-sm' />,
                                      onClick: () => handleCancel(a._id),
                                      danger: true,
                                    },
                                  ]
                                : []),
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
              <div className='mt-4 flex items-center justify-between gap-3'>
                <div className='text-body-sm text-neutral-600'>
                  {t('admin.activityLogsPageOf')
                    .replace('{{page}}', String(pagination.page))
                    .replace('{{pages}}', String(pages))
                    .replace('{{total}}', String(pagination.total))}
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='secondary'
                    size='xs'
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                  >
                    {t('common.previous')}
                  </Button>
                  <Button
                    variant='primary'
                    size='xs'
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pages}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
