'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchAppointments();
    }
  }, [authLoading, user, pagination.page, statusFilter, startDate, endDate]);

  const fetchAppointments = async (pageOverride) => {
    try {
      setLoading(true);
      const page = pageOverride ?? pagination.page;
      const params = new URLSearchParams({ page: page.toString(), limit: pagination.limit.toString() });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      const response = await apiClient.get(`/admin/appointments?${params.toString()}`);
      if (response.success && response.data) {
        setAppointments(extractArrayData(response));
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
      console.error('Failed to fetch appointments:', err);
      showError('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchAppointments(1);
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment? The patient and doctor will not be automatically notified from this screen.')) return;
    try {
      const response = await apiClient.put(`/admin/appointments/${id}/status`, { status: 'cancelled' });
      if (response?.success) {
        showSuccess('Appointment cancelled');
        fetchAppointments();
      } else {
        showError(response?.error?.message || 'Failed to cancel');
      }
    } catch (err) {
      showError('Failed to cancel appointment');
    }
  };

  if (authLoading || loading) return <Loader fullScreen size='lg' />;
  if (user?.role !== 'super_admin') return null;

  const pages = (pagination.totalPages ?? Math.ceil((pagination.total || 0) / (pagination.limit || 50))) || 1;

  return (
    <Layout
      title='Appointments'
      subtitle='All appointments across the platform'
      actionButton={
        <div className='flex gap-2'>
          <Button variant='secondary' onClick={() => router.push('/admin/appointments/analytics')}>
            Analytics
          </Button>
          <Button variant='primary' onClick={() => router.push('/admin')}>
            Back to Dashboard
          </Button>
        </div>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='mb-6'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Booking ID</label>
                <Input
                  type='text'
                  placeholder='Search by appointment number'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Status</label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                >
                  <option value=''>All</option>
                  <option value='scheduled'>Scheduled</option>
                  <option value='confirmed'>Confirmed</option>
                  <option value='arrived'>Arrived</option>
                  <option value='in_progress'>In Progress</option>
                  <option value='completed'>Completed</option>
                  <option value='cancelled'>Cancelled</option>
                  <option value='no_show'>No Show</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>From date</label>
                <Input type='date' value={startDate} onChange={(e) => { setStartDate(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }} />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>To date</label>
                <Input type='date' value={endDate} onChange={(e) => { setEndDate(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }} />
              </div>
              <div className='flex items-end'>
                <Button variant='primary' onClick={handleSearch} className='w-full'>Apply</Button>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className='p-6'>
            <h2 className='text-lg font-semibold text-neutral-900 mb-4'>Appointments ({pagination.total})</h2>
            {appointments.length === 0 ? (
              <p className='text-neutral-500'>No appointments found</p>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-neutral-200'>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Booking ID</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Date / Time</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Patient</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Doctor</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Tenant</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Status</th>
                      <th className='text-left py-2 px-3 text-sm font-semibold text-neutral-700'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a._id} className='border-b border-neutral-100 hover:bg-neutral-50'>
                        <td className='py-2 px-3 text-sm font-medium'>{a.appointmentNumber || '—'}</td>
                        <td className='py-2 px-3 text-sm'>
                          {a.appointmentDate ? new Date(a.appointmentDate).toLocaleDateString() : '—'}
                          {a.startTime && ` ${new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </td>
                        <td className='py-2 px-3 text-sm'>{a.patientName || '—'}</td>
                        <td className='py-2 px-3 text-sm'>{a.doctorName || '—'}</td>
                        <td className='py-2 px-3 text-sm text-neutral-600'>{a.tenantName || '—'}</td>
                        <td className='py-2 px-3'>
                          <Tag className='bg-neutral-100 text-neutral-800'>{a.status || '—'}</Tag>
                        </td>
                        <td className='py-2 px-3'>
                          <div className='flex gap-2'>
                            <Button variant='secondary' size='sm' onClick={() => router.push(`/appointments/${a._id}`)}>
                              View
                            </Button>
                            {a.status !== 'cancelled' && a.status !== 'completed' && (
                              <Button variant='outline' size='sm' onClick={() => handleCancel(a._id)} className='border-red-300 text-red-700'>
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {(pages > 1) && (
              <div className='mt-6 flex items-center justify-between'>
                <div className='text-sm text-neutral-600'>
                  Page {pagination.page} of {pages} ({pagination.total} total)
                </div>
                <div className='flex gap-2'>
                  <Button variant='secondary' size='sm' onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1}>Previous</Button>
                  <Button variant='secondary' size='sm' onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pages}>Next</Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
