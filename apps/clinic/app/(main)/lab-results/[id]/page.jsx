'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function LabResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  const fetchResult = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/lab-results/${id}`);
      if (res?.success && res.data) setResult(res.data);
      else setResult(null);
    } catch (_err) {
      setResult(null);
      showError(t('lab.failedToLoad') || 'Failed to load result');
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (!authLoading && user && id) fetchResult();
  }, [authLoading, user, id, fetchResult]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const handleVerify = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      const res = await apiClient.post(`/lab-results/${id}/verify`);
      if (res?.success) {
        showSuccess(t('lab.verified') || 'Result verified');
        fetchResult();
      } else {
        showError(res?.error?.message || t('lab.verifyFailed'));
      }
    } catch (err) {
      showError(err?.message || t('lab.verifyFailed'));
    } finally {
      setVerifying(false);
    }
  };

  const patientName = (r) => {
    const p = r?.patientId;
    if (!p) return '—';
    if (typeof p === 'object' && (p.firstName || p.lastName)) {
      return [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';
    }
    return '—';
  };

  if (!user) return null;

  return (
    <Layout>
      <PageHeader
        title={t('lab.labResult') || 'Lab result'}
        subtitle={result ? patientName(result) : ''}
        actions={
          <div className='flex items-center gap-2'>
            <Link href='/lab-results'>
              <Button variant='secondary' size='sm'>
                {t('lab.backToList') || 'Back to list'}
              </Button>
            </Link>
            {result?.status === 'draft' && (
              <Button size='sm' onClick={handleVerify} disabled={verifying}>
                {verifying ? t('common.loading') || 'Loading...' : t('lab.verify') || 'Verify'}
              </Button>
            )}
          </div>
        }
      />
      <div className='clinic-page-content'>
        {loading ? (
          <div className='flex justify-center py-12'>
            <Loader type='section' />
          </div>
        ) : !result ? (
          <Card>
            <p className='text-neutral-600 dark:text-neutral-400'>
              {t('common.notFound') || 'Not found'}
            </p>
          </Card>
        ) : (
          <Card>
            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                  {t('lab.patient') || 'Patient'}
                </dt>
                <dd className='font-medium'>{patientName(result)}</dd>
              </div>
              <div>
                <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                  {t('common.status')}
                </dt>
                <dd>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      result.status === 'verified'
                        ? 'bg-status-success/10 text-status-success'
                        : result.status === 'draft'
                          ? 'bg-status-warning/10 text-status-warning'
                          : 'bg-neutral-100 dark:bg-neutral-700'
                    }`}
                  >
                    {result.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                  {t('lab.reportedAt') || 'Reported'}
                </dt>
                <dd>{result.reportedAt ? new Date(result.reportedAt).toLocaleString() : '—'}</dd>
              </div>
              {result.results?.length > 0 && (
                <div className='sm:col-span-2'>
                  <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1'>
                    {t('lab.results') || 'Results'}
                  </dt>
                  <dd>
                    <table className='clinic-table w-full'>
                      <thead>
                        <tr>
                          <th>{t('lab.parameter') || 'Parameter'}</th>
                          <th>{t('lab.value')}</th>
                          <th>{t('lab.unit')}</th>
                          <th>{t('lab.referenceRange') || 'Reference'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.results.map((row, i) => (
                          <tr key={i}>
                            <td>{row.parameter}</td>
                            <td>{row.value}</td>
                            <td>{row.unit || '—'}</td>
                            <td>{row.referenceRange || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </dd>
                </div>
              )}
              {result.interpretation && (
                <div className='sm:col-span-2'>
                  <dt className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                    {t('lab.interpretation') || 'Interpretation'}
                  </dt>
                  <dd className='mt-1'>{result.interpretation}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}
      </div>
    </Layout>
  );
}
