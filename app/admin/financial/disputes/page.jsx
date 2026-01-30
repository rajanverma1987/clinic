'use client';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Tag } from '@/components/ui/Tag';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { apiClient } from '@/lib/api/client';
import { extractArrayData, extractPaginationData } from '@/lib/utils/api-response-extractor';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/currency';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'refund_issued', label: 'Refund issued' },
];

export default function AdminFinancialDisputesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currency, locale } = useSettings();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [actionModal, setActionModal] = useState({ open: false, dispute: null, action: '', adminNotes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchDisputes();
    }
  }, [authLoading, user, pagination.page, statusFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString() });
      if (statusFilter) params.append('status', statusFilter);
      const response = await apiClient.get(`/admin/financial/disputes?${params.toString()}`);
      if (response.success && response.data) {
        setDisputes(extractArrayData(response));
        const pag = extractPaginationData(response);
        setPagination((p) => ({
          ...p,
          page: pag.page ?? p.page,
          limit: pag.limit ?? p.limit,
          total: pag.total ?? 0,
          totalPages: pag.totalPages ?? (Math.ceil((pag.total || 0) / (pag.limit || 20)) || 1),
        }));
      }
    } catch (err) {
      logger.error('Failed to fetch disputes', err);
      showError('Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => formatCurrencyUtil(amount ?? 0, currency, locale);

  const handleAction = (dispute, action) => {
    setActionModal({ open: true, dispute, action, adminNotes: dispute.adminNotes || '' });
  };

  const submitAction = async () => {
    const { dispute, action, adminNotes } = actionModal;
    if (!dispute?._id) return;
    try {
      setSubmitting(true);
      const payload = {};
      if (action === 'contacted' || action === 'escalated' || action === 'resolved') {
        payload.status = action;
        if (adminNotes) payload.adminNotes = adminNotes;
      } else if (action === 'refund') {
        payload.issueRefund = true;
        if (adminNotes) payload.adminNotes = adminNotes;
      }
      const response = await apiClient.put(`/admin/financial/disputes/${dispute._id}`, payload);
      if (response.success) {
        showSuccess(action === 'refund' ? 'Refund issued' : `Marked as ${action}`);
        setActionModal({ open: false, dispute: null, action: '', adminNotes: '' });
        fetchDisputes();
      } else {
        showError(response.error?.message || 'Action failed');
      }
    } catch (err) {
      showError('Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (loading && !disputes.length)) return <Loader type='page' text={t('common.loading')} />;
  if (user?.role !== 'super_admin') return null;

  const pages = pagination.totalPages || 1;

  return (
    <Layout
      title='Payment Disputes'
      subtitle='Review and resolve payment disputes; issue refunds, contact, escalate, or mark resolved'
      actionButton={
        <Button variant='primary' onClick={() => router.push('/admin/financial')}>
          Back to Financial
        </Button>
      }
    >
      <div style={{ padding: '0 10px' }}>
        <Card className='mb-6'>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-2'>Status</label>
                <select
                  className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value || 'all'} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className='flex items-end'>
                <Button variant='primary' onClick={() => fetchDisputes()}>Apply</Button>
              </div>
            </div>
          </div>
        </Card>

        <div className='mb-4 text-sm text-neutral-600'>
          {pagination.total} dispute{pagination.total !== 1 ? 's' : ''} found
        </div>

        {loading ? (
          <Loader type='section' text={t('common.loading')} />
        ) : disputes.length === 0 ? (
          <Card className='p-12 text-center'>
            <p className='text-neutral-500'>No disputes found</p>
            <p className='text-sm text-neutral-400 mt-2'>Disputes can be created from the API or patient portal.</p>
          </Card>
        ) : (
          <div className='space-y-4'>
            {disputes.map((d) => (
              <Card key={d._id} className='p-6'>
                <div className='flex flex-wrap justify-between gap-4'>
                  <div>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='font-semibold text-neutral-900'>{d.patientName || '—'}</span>
                      <Tag className={d.status === 'open' ? 'bg-amber-100 text-amber-800' : d.status === 'refund_issued' ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}>
                        {d.status}
                      </Tag>
                    </div>
                    <p className='text-sm text-neutral-600 mt-1'>{d.tenantName || '—'} · Invoice {d.invoiceNumber || '—'}</p>
                    <p className='text-lg font-medium text-neutral-900 mt-2'>{formatCurrency(d.amount)} {d.currency}</p>
                    <p className='text-sm text-neutral-700 mt-2'><strong>Reason:</strong> {d.reason || '—'}</p>
                    {d.evidence && <p className='text-sm text-neutral-600 mt-1'><strong>Evidence:</strong> {d.evidence}</p>}
                    {d.adminNotes && <p className='text-sm text-neutral-500 mt-1 italic'>Admin: {d.adminNotes}</p>}
                  </div>
                  <div className='flex flex-col gap-2'>
                    {d.status === 'open' && (
                      <>
                        <Button variant='secondary' size='sm' onClick={() => handleAction(d, 'contacted')}>Contact</Button>
                        <Button variant='secondary' size='sm' onClick={() => handleAction(d, 'escalated')}>Escalate</Button>
                      </>
                    )}
                    {(d.status === 'open' || d.status === 'contacted' || d.status === 'escalated') && (
                      <>
                        <Button variant='primary' size='sm' onClick={() => handleAction(d, 'refund')}>Issue Refund</Button>
                        <Button variant='secondary' size='sm' onClick={() => handleAction(d, 'resolved')}>Mark Resolved</Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
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

        {actionModal.open && actionModal.dispute && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-neutral-500/30 backdrop-blur-sm' role='dialog' aria-modal='true'>
            <Card className='w-full max-w-md mx-4 p-6'>
              <h3 className='text-lg font-semibold text-neutral-900 mb-4'>
                {actionModal.action === 'refund' ? 'Issue Refund' : `Mark as ${actionModal.action}`}
              </h3>
              <label className='block text-sm font-medium text-neutral-700 mb-2'>Admin notes (optional)</label>
              <textarea
                className='w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4'
                rows={3}
                placeholder='Add notes...'
                value={actionModal.adminNotes}
                onChange={(e) => setActionModal((m) => ({ ...m, adminNotes: e.target.value }))}
              />
              <div className='flex gap-2 justify-end'>
                <Button variant='secondary' onClick={() => setActionModal({ open: false, dispute: null, action: '', adminNotes: '' })}>
                  Cancel
                </Button>
                <Button variant='primary' onClick={submitAction} disabled={submitting}>
                  {submitting ? '…' : actionModal.action === 'refund' ? 'Issue Refund' : 'Confirm'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
