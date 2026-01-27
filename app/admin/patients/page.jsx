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

export default function AdminPatientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchPatients();
    }
  }, [authLoading, user, pagination.page, statusFilter, tenantFilter]);

  const fetchPatients = async (pageOverride) => {
    try {
      setLoading(true);
      const page = pageOverride ?? pagination.page;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (tenantFilter) params.append('tenantId', tenantFilter);

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
      console.error('Failed to fetch patients:', error);
      showError('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    fetchPatients(1);
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
      showError('Failed to update patient status');
    }
  };

  const handleDelete = async (patientId) => {
    if (!confirm('Are you sure you want to delete this patient? This action can be reversed by support.')) return;
    try {
      const response = await apiClient.delete(`/admin/patients/${patientId}`);
      if (response.success) {
        showSuccess('Patient deleted successfully');
        fetchPatients();
      } else {
        showError(response.error?.message || 'Failed to delete patient');
      }
    } catch (error) {
      showError('Failed to delete patient');
    }
  };

  const handleExport = async (patientIds = null) => {
    const ids = patientIds ?? selectedPatients;
    if (!ids.length) {
      showError('Please select at least one patient to export');
      return;
    }
    try {
      setExporting(true);
      const response = await apiClient.post('/admin/patients/export', { patientIds: ids });
      if (response.success && response.data?.url) {
        window.open(response.data.url, '_blank');
        showSuccess('Export started. Download will open in a new tab.');
      } else if (response.success && response.data?.csv) {
        const blob = new Blob([response.data.csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patients-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Export downloaded.');
      } else if (response.success && response.data?.blob) {
        const url = URL.createObjectURL(new Blob([response.data.blob]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `patients-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Export downloaded.');
      } else {
        showError('Export format not supported. Use table selection and copy, or contact support.');
      }
    } catch (error) {
      showError('Export failed. Try selecting rows and copying, or contact support.');
    } finally {
      setExporting(false);
    }
  };

  if (authLoading || loading) {
    return <Loader fullScreen size='lg' />;
  }

  if (user?.role !== 'super_admin') {
    return null;
  }

  const pages = (pagination.totalPages ?? Math.ceil((pagination.total || 0) / (pagination.limit || 50))) || 1;

  return (
    <Layout
      title='Patient Management'
      subtitle='Manage all patients across the platform'
      actionButton={
        <Button variant='primary' onClick={() => router.push('/admin')}>
          Back to Dashboard
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='mb-6'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Search</label>
                <Input
                  type='text'
                  placeholder='Search by name, phone, email...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Status</label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value=''>All</option>
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Tenant ID</label>
                <Input
                  type='text'
                  placeholder='Filter by tenant ID'
                  value={tenantFilter}
                  onChange={(e) => {
                    setTenantFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                />
              </div>
              <div className='flex items-end gap-2 md:col-span-2'>
                <Button variant='primary' onClick={handleSearch} className='flex-1'>
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {selectedPatients.length > 0 && (
          <Card className='mb-6 border-primary-200 bg-primary-50'>
            <div className='p-4 flex items-center justify-between'>
              <span className='text-sm font-medium text-primary-900'>
                {selectedPatients.length} patient{selectedPatients.length !== 1 ? 's' : ''} selected
              </span>
              <div className='flex gap-2'>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => handleExport()}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting…' : 'Export selected'}
                </Button>
                <Button variant='secondary' size='sm' onClick={() => setSelectedPatients([])}>
                  Clear selection
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className='p-6'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-neutral-900'>Patients ({pagination.total})</h2>
              <Button variant='secondary' size='sm' onClick={() => handleExport(patients.map((p) => p._id))} disabled={exporting || !patients.length}>
                {exporting ? 'Exporting…' : 'Export all'}
              </Button>
            </div>
            {loading ? (
              <Loader size='lg' />
            ) : patients.length === 0 ? (
              <div className='text-center py-12'>
                <p className='text-neutral-500'>No patients found</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-neutral-200'>
                      <th className='text-left py-3 px-4'>
                        <input
                          type='checkbox'
                          checked={patients.length > 0 && selectedPatients.length === patients.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedPatients(patients.map((p) => p._id));
                            else setSelectedPatients([]);
                          }}
                        />
                      </th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>Patient</th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>Contact</th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>Tenant</th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>Status</th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-neutral-700'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p._id} className='border-b border-neutral-100 hover:bg-neutral-50'>
                        <td className='py-3 px-4'>
                          <input
                            type='checkbox'
                            checked={selectedPatients.includes(p._id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedPatients([...selectedPatients, p._id]);
                              else setSelectedPatients(selectedPatients.filter((id) => id !== p._id));
                            }}
                          />
                        </td>
                        <td className='py-3 px-4'>
                          <div>
                            <p className='font-medium text-neutral-900'>
                              {p.firstName} {p.lastName}
                            </p>
                            <p className='text-sm text-neutral-500'>{p.patientId || '—'}</p>
                          </div>
                        </td>
                        <td className='py-3 px-4'>
                          <div className='text-sm'>
                            <p>{p.email || '—'}</p>
                            <p>{p.phone || '—'}</p>
                          </div>
                        </td>
                        <td className='py-3 px-4 text-sm text-neutral-700'>{p.tenantName || p.tenantId || '—'}</td>
                        <td className='py-3 px-4'>
                          <Tag className={p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}>
                            {p.status || 'active'}
                          </Tag>
                        </td>
                        <td className='py-3 px-4'>
                          <div className='flex gap-2 flex-wrap'>
                            <Button variant='secondary' size='sm' onClick={() => router.push(`/admin/patients/${p._id}`)}>
                              View details
                            </Button>
                            <Button
                              variant='secondary'
                              size='sm'
                              onClick={() => handleSuspend(p._id, p.status !== 'inactive')}
                            >
                              {p.status === 'inactive' ? 'Activate' : 'Suspend'}
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleDelete(p._id)}
                              className='border-red-300 text-red-700'
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
      </div>
    </Layout>
  );
}
