'use client';

/**
 * Lab results list page (D1).
 * Supports ?status=draft for pending results; links from dashboard widget.
 */

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError } from '@/lib/utils/toast';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function LabResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();

  const statusParam = searchParams.get('status') || '';
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (statusParam) params.append('status', statusParam);
      const res = await apiClient.get(`/lab-results?${params}`);
      if (res?.success && res.data) {
        const data = res.data;
        setItems(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
        setTotal(typeof data.total === 'number' ? data.total : (data.items?.length ?? 0));
      } else {
        setItems([]);
        setTotal(0);
      }
    } catch (_err) {
      setItems([]);
      setTotal(0);
      showError(t('lab.failedToLoad') || 'Failed to load lab results');
    } finally {
      setLoading(false);
    }
  }, [statusParam, t]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchResults();
    }
  }, [authLoading, user, fetchResults]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const statusLabel = (s) => {
    const map = {
      draft: t('lab.statusDraft') || 'Draft',
      verified: t('lab.statusVerified') || 'Verified',
      delivered: t('lab.statusDelivered') || 'Delivered',
    };
    return map[s] || s;
  };

  const patientName = (r) => {
    const p = r.patientId;
    if (!p) return '—';
    if (typeof p === 'object' && (p.firstName || p.lastName)) {
      return [p.firstName, p.lastName].filter(Boolean).join(' ') || p.patientId || '—';
    }
    return '—';
  };

  if (!user) return null;

  return (
    <Layout>
      <PageHeader
        title={t('lab.labResults') || 'Lab results'}
        subtitle={statusParam === 'draft' ? t('lab.pendingResults') || 'Pending results' : ''}
      />
      <div className='clinic-page-content'>
        <Card>
          {loading ? (
            <div className='flex justify-center py-12'>
              <Loader type='section' />
            </div>
          ) : (
            <div className='clinic-table-wrap'>
              <table className='clinic-table'>
                <thead>
                  <tr>
                    <th>{t('lab.patient') || 'Patient'}</th>
                    <th>{t('lab.order') || 'Order'}</th>
                    <th>{t('lab.reportedAt') || 'Reported'}</th>
                    <th>{t('common.status')}</th>
                    <th aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r._id}>
                      <td className='font-medium'>{patientName(r)}</td>
                      <td>{r.orderId?.orderNumber ?? r.orderId ?? '—'}</td>
                      <td className='whitespace-nowrap'>
                        {r.reportedAt
                          ? new Date(r.reportedAt).toLocaleDateString()
                          : r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString()
                            : '—'}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            r.status === 'verified'
                              ? 'bg-status-success/10 text-status-success'
                              : r.status === 'draft'
                                ? 'bg-status-warning/10 text-status-warning'
                                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/lab-results/${r._id}`}
                          className='text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium'
                        >
                          {t('common.view') || 'View'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr data-empty>
                      <td colSpan={5}>{t('common.noDataFound')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
