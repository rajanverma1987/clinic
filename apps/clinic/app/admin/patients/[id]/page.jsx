'use client';

import { FileDownIcon, RefreshCwIcon, ShieldIcon, TrashIcon } from '@/components/icons';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tabs, getTabPanelId, getTabPanelLabelledBy } from '@/components/ui/Tabs';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirmation } from '@/contexts/ConfirmationContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const tabKeys = ['overview', 'appointments', 'payments'];

export default function AdminPatientDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const { t } = useI18n();
  const { open: openConfirm } = useConfirmation();
  const { user, loading: authLoading } = useAuth();
  const tabFromUrl = searchParams.get('tab');
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({ total: 0, paid: 0, outstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && tabKeys.includes(tabFromUrl) ? tabFromUrl : 'overview',
  );
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && params.id) {
      if (user.role === 'super_admin') {
        router.replace('/admin');
        return;
      }
      router.replace('/dashboard');
    }
  }, [authLoading, user, params.id, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/admin/patients/${params.id}`);
      if (response.success && response.data) {
        const d = response.data;
        setPatient(d.patient);
        setAppointments(d.appointments || []);
        setInvoices(d.invoices || []);
        setPaymentSummary(d.paymentSummary || { total: 0, paid: 0, outstanding: 0 });
      } else {
        showError(t('admin.patientNotFound'));
        router.push('/admin/patients');
      }
    } catch (err) {
      logger.error('Failed to fetch patient:', err);
      showError(t('admin.failedToLoadPatient'));
      router.push('/admin/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!patient) return;
    const nextStatus = patient.status === 'inactive' ? 'active' : 'inactive';
    setSaving(true);
    try {
      const response = await apiClient.put(`/admin/patients/${params.id}`, { status: nextStatus });
      if (response.success) {
        showSuccess(
          `Patient ${nextStatus === 'inactive' ? 'suspended' : 'activated'} successfully`,
        );
        setPatient((p) => (p ? { ...p, status: nextStatus } : null));
      } else {
        showError(response.error?.message || t('admin.failedToUpdateStatus'));
      }
    } catch (err) {
      showError(t('admin.failedToUpdateStatus'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    openConfirm({
      title: t('common.delete'),
      message: t('admin.patientsDeleteConfirm'),
      variant: 'danger',
      onConfirm: async () => {
        setSaving(true);
        try {
          const response = await apiClient.delete(`/admin/patients/${params.id}`);
          if (response.success) {
            showSuccess(t('admin.patientsDeleted'));
            router.push('/admin/patients');
          } else {
            showError(response.error?.message || t('admin.failedToDelete'));
          }
        } catch (err) {
          showError(t('admin.failedToDeletePatient'));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.post('/admin/patients/export', { patientIds: [params.id] });
      if (response.success && response.data?.url) {
        window.open(response.data.url, '_blank');
        showSuccess(t('admin.exportStartedShort'));
      } else {
        showError(t('admin.exportNotAvailable'));
      }
    } catch (err) {
      showError(t('admin.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabKeys.includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    queueMicrotask(() => {
      router.replace(
        (pathname || `/admin/patients/${params.id}`) + '?tab=' + encodeURIComponent(tabId),
      );
    });
  };

  const formatDate = (v) => (v ? new Date(v).toLocaleDateString() : '—');
  const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : '—');
  const formatCurrency = (n) =>
    n != null
      ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
      : '—';

  if (authLoading || loading) {
    return <Loader type='page' text={t('common.loading')} />;
  }

  if (user?.role !== 'super_admin' || !patient) {
    return null;
  }

  return (
    <Layout
      title={t('admin.patientDetailsTitle')}
      subtitle={`${patient.firstName} ${patient.lastName}`}
      actionButton={
        <div className='flex items-center gap-1'>
          <Button
            variant='secondary'
            size='xs'
            iconOnly
            onClick={handleExport}
            disabled={exporting}
            aria-label={t('common.export') || 'Export'}
            title={t('common.export') || 'Export'}
          >
            {exporting ? (
              <RefreshCwIcon className='icon icon-xs animate-spin' />
            ) : (
              <FileDownIcon className='icon icon-xs' />
            )}
          </Button>
          <Button
            variant='secondary'
            size='xs'
            iconOnly
            onClick={handleSuspend}
            disabled={saving}
            aria-label={
              patient?.status === 'inactive'
                ? t('common.activate') || 'Activate'
                : t('admin.suspend') || 'Suspend'
            }
            title={
              patient?.status === 'inactive'
                ? t('common.activate') || 'Activate'
                : t('admin.suspend') || 'Suspend'
            }
          >
            <ShieldIcon className='icon icon-xs' />
          </Button>
          <Button
            variant='danger'
            size='xs'
            iconOnly
            onClick={handleDelete}
            disabled={saving}
            aria-label={t('common.delete') || 'Delete'}
            title={t('common.delete') || 'Delete'}
          >
            <TrashIcon className='icon icon-xs' />
          </Button>
        </div>
      }
    >
      <div className='admin-page-content data-tabs-container'>
        <Tabs
          tabs={tabKeys.map((id) => ({ id, label: id.charAt(0).toUpperCase() + id.slice(1) }))}
          activeTab={activeTab}
          onChange={handleTabChange}
          idPrefix='admin-patient-tabs'
          ariaLabel={t('patients.patientDetails')}
        />
        <div
          className='mt-4'
          role='tabpanel'
          id={getTabPanelId('admin-patient-tabs', activeTab)}
          aria-labelledby={getTabPanelLabelledBy('admin-patient-tabs', activeTab)}
        >
          {activeTab === 'overview' && (
            <Card className='mb-6'>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-lg font-semibold text-neutral-900'>{t('common.overview')}</h2>
                  <Tag
                    className={
                      patient.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-neutral-100 text-neutral-800'
                    }
                  >
                    {patient.status || 'active'}
                  </Tag>
                </div>
                <div className='content-grid-2'>
                  <div>
                    <p className='text-sm text-neutral-500'>{t('patients.patientId')}</p>
                    <p className='font-medium text-neutral-900'>{patient.patientId || '—'}</p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-500'>Tenant</p>
                    <p className='font-medium text-neutral-900'>
                      {patient.tenantName || patient.tenantId || '—'}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-500'>Email</p>
                    <p className='font-medium text-neutral-900'>{patient.email || '—'}</p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-500'>Phone</p>
                    <p className='font-medium text-neutral-900'>{patient.phone || '—'}</p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-500'>{t('patients.dateOfBirth')}</p>
                    <p className='font-medium text-neutral-900'>
                      {formatDate(patient.dateOfBirth)}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm text-neutral-500'>Gender</p>
                    <p className='font-medium text-neutral-900'>{patient.gender || '—'}</p>
                  </div>
                  {patient.address && (
                    <div className='md:col-span-2'>
                      <p className='text-sm text-neutral-500'>{t('patients.address')}</p>
                      <p className='font-medium text-neutral-900'>
                        {[
                          patient.address.street,
                          patient.address.city,
                          patient.address.state,
                          patient.address.zipCode,
                          patient.address.country,
                        ]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className='text-sm text-neutral-500'>{t('patients.created')}</p>
                    <p className='font-medium text-neutral-900'>
                      {formatDateTime(patient.createdAt)}
                    </p>
                  </div>
                </div>
                <div className='mt-6 pt-4 border-t border-neutral-200'>
                  <h3 className='text-sm font-semibold text-neutral-700 mb-2'>
                    {t('patients.paymentSummary')}
                  </h3>
                  <div className='flex gap-6'>
                    <span>Total: {formatCurrency(paymentSummary.total)}</span>
                    <span>Paid: {formatCurrency(paymentSummary.paid)}</span>
                    <span>Outstanding: {formatCurrency(paymentSummary.outstanding)}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'appointments' && (
            <Card className='mb-6'>
              <div className='p-6'>
                <h2 className='text-lg font-semibold text-neutral-900 mb-4'>
                  {t('patients.appointmentHistory')}
                </h2>
                {appointments.length === 0 ? (
                  <p className='text-neutral-500'>{t('doctors.noAppointments')}</p>
                ) : (
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>Number</th>
                          <th>Date</th>
                          <th>Doctor</th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((a) => (
                          <tr key={a._id}>
                            <td>{a.appointmentNumber || '—'}</td>
                            <td>{formatDateTime(a.appointmentDate)}</td>
                            <td>{a.doctorName || '—'}</td>
                            <td>{a.type || '—'}</td>
                            <td>
                              <Tag className='bg-neutral-100 text-neutral-800'>
                                {a.status || '—'}
                              </Tag>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'payments' && (
            <Card className='mb-6'>
              <div className='p-6'>
                <h2 className='text-lg font-semibold text-neutral-900 mb-4'>
                  {t('patients.paymentHistory')}
                </h2>
                <div className='mb-4 flex gap-6'>
                  <span>Total: {formatCurrency(paymentSummary.total)}</span>
                  <span>Paid: {formatCurrency(paymentSummary.paid)}</span>
                  <span>Outstanding: {formatCurrency(paymentSummary.outstanding)}</span>
                </div>
                {invoices.length === 0 ? (
                  <p className='text-neutral-500'>{t('patients.noInvoices')}</p>
                ) : (
                  <div className='clinic-table-wrap'>
                    <table className='clinic-table'>
                      <thead>
                        <tr>
                          <th>{t('invoices.invoice')}</th>
                          <th>{t('common.total')}</th>
                          <th>{t('invoices.paid')}</th>
                          <th>{t('invoices.status')}</th>
                          <th>{t('patients.date')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => (
                          <tr key={inv._id}>
                            <td>{inv.invoiceNumber || '—'}</td>
                            <td>{formatCurrency(inv.totalAmount)}</td>
                            <td>{formatCurrency(inv.paidAmount)}</td>
                            <td>
                              <Tag className='bg-neutral-100 text-neutral-800'>
                                {inv.status || '—'}
                              </Tag>
                            </td>
                            <td>{formatDateTime(inv.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
