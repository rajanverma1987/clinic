'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { logger } from '@/lib/utils/logger';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const tabKeys = ['overview', 'appointments', 'payments'];

export default function AdminPatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState({ total: 0, paid: 0, outstanding: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && params.id) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchData();
    }
  }, [authLoading, user, params.id]);

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
        showError('Patient not found');
        router.push('/admin/patients');
      }
    } catch (err) {
      logger.error('Failed to fetch patient:', err);
      showError('Failed to load patient');
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
        showSuccess(`Patient ${nextStatus === 'inactive' ? 'suspended' : 'activated'} successfully`);
        setPatient((p) => (p ? { ...p, status: nextStatus } : null));
      } else {
        showError(response.error?.message || 'Failed to update status');
      }
    } catch (err) {
      showError('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this patient? This can be reversed by support.')) return;
    setSaving(true);
    try {
      const response = await apiClient.delete(`/admin/patients/${params.id}`);
      if (response.success) {
        showSuccess('Patient deleted');
        router.push('/admin/patients');
      } else {
        showError(response.error?.message || 'Failed to delete');
      }
    } catch (err) {
      showError('Failed to delete patient');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.post('/admin/patients/export', { patientIds: [params.id] });
      if (response.success && response.data?.url) {
        window.open(response.data.url, '_blank');
        showSuccess('Export started');
      } else {
        showError('Export not available. Use list page to export.');
      }
    } catch (err) {
      showError('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (v) => (v ? new Date(v).toLocaleDateString() : '—');
  const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : '—');
  const formatCurrency = (n) => (n != null ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n) : '—');

  if (authLoading || loading) {
    return <Loader fullScreen size='lg' />;
  }

  if (user?.role !== 'super_admin' || !patient) {
    return null;
  }

  return (
    <Layout
      title='Patient Details'
      subtitle={`${patient.firstName} ${patient.lastName}`}
      actionButton={
        <div className='flex gap-2'>
          <Button variant='secondary' onClick={() => router.push('/admin/patients')}>
            Back to list
          </Button>
          <Button variant='primary' onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export'}
          </Button>
          <Button
            variant='secondary'
            onClick={handleSuspend}
            disabled={saving}
          >
            {patient.status === 'inactive' ? 'Activate' : 'Suspend'}
          </Button>
          <Button variant='danger' onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <div className='flex gap-4 overflow-x-auto mb-6'>
          {tabKeys.map((tab) => (
            <button
              type="button"
              key={tab}
              className={`px-4 py-2 font-medium text-sm capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <Card className='mb-6'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-lg font-semibold text-neutral-900'>Overview</h2>
                <Tag className={patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}>
                  {patient.status || 'active'}
                </Tag>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-neutral-500'>Patient ID</p>
                  <p className='font-medium text-neutral-900'>{patient.patientId || '—'}</p>
                </div>
                <div>
                  <p className='text-sm text-neutral-500'>Tenant</p>
                  <p className='font-medium text-neutral-900'>{patient.tenantName || patient.tenantId || '—'}</p>
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
                  <p className='text-sm text-neutral-500'>Date of birth</p>
                  <p className='font-medium text-neutral-900'>{formatDate(patient.dateOfBirth)}</p>
                </div>
                <div>
                  <p className='text-sm text-neutral-500'>Gender</p>
                  <p className='font-medium text-neutral-900'>{patient.gender || '—'}</p>
                </div>
                {patient.address && (
                  <div className='md:col-span-2'>
                    <p className='text-sm text-neutral-500'>Address</p>
                    <p className='font-medium text-neutral-900'>
                      {[patient.address.street, patient.address.city, patient.address.state, patient.address.zipCode, patient.address.country]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>
                )}
                <div>
                  <p className='text-sm text-neutral-500'>Created</p>
                  <p className='font-medium text-neutral-900'>{formatDateTime(patient.createdAt)}</p>
                </div>
              </div>
              <div className='mt-6 pt-4 border-t border-neutral-200'>
                <h3 className='text-sm font-semibold text-neutral-700 mb-2'>Payment summary</h3>
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
              <h2 className='text-lg font-semibold text-neutral-900 mb-4'>Appointment history</h2>
              {appointments.length === 0 ? (
                <p className='text-neutral-500'>No appointments</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-neutral-200'>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Number</th>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Date</th>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Doctor</th>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Type</th>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a) => (
                        <tr key={a._id} className='border-b border-neutral-100'>
                          <td className='py-2 px-3 text-sm'>{a.appointmentNumber || '—'}</td>
                          <td className='py-2 px-3 text-sm'>{formatDateTime(a.appointmentDate)}</td>
                          <td className='py-2 px-3 text-sm'>{a.doctorName || '—'}</td>
                          <td className='py-2 px-3 text-sm'>{a.type || '—'}</td>
                          <td className='py-2 px-3'>
                            <Tag className='bg-neutral-100 text-neutral-800'>{a.status || '—'}</Tag>
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
              <h2 className='text-lg font-semibold text-neutral-900 mb-4'>Payment history</h2>
              <div className='mb-4 flex gap-6'>
                <span>Total: {formatCurrency(paymentSummary.total)}</span>
                <span>Paid: {formatCurrency(paymentSummary.paid)}</span>
                <span>Outstanding: {formatCurrency(paymentSummary.outstanding)}</span>
              </div>
              {invoices.length === 0 ? (
                <p className='text-neutral-500'>No invoices</p>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-neutral-200'>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Invoice</th>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Total</th>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Paid</th>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Status</th>
                        <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv._id} className='border-b border-neutral-100'>
                          <td className='py-2 px-3 text-sm'>{inv.invoiceNumber || '—'}</td>
                          <td className='py-2 px-3 text-sm'>{formatCurrency(inv.totalAmount)}</td>
                          <td className='py-2 px-3 text-sm'>{formatCurrency(inv.paidAmount)}</td>
                          <td className='py-2 px-3'>
                            <Tag className='bg-neutral-100 text-neutral-800'>{inv.status || '—'}</Tag>
                          </td>
                          <td className='py-2 px-3 text-sm'>{formatDateTime(inv.createdAt)}</td>
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
    </Layout>
  );
}
