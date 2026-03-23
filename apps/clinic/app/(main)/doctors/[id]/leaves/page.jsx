'use client';

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import { showError, showSuccess } from '@/lib/utils/toast';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function DoctorLeavesPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params?.id;
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newLeave, setNewLeave] = useState({ from: '', to: '', reason: '' });

  const fetchSchedule = useCallback(async () => {
    if (!doctorId) return;
    try {
      const res = await apiClient.get(`/doctors/${doctorId}/schedule`);
      if (res.success && res.data?.leaves) {
        setLeaves(
          (res.data.leaves || []).map((l) => ({
            startDate: l.startDate || l.from,
            endDate: l.endDate || l.to,
            reason: l.reason,
          })),
        );
      } else {
        setLeaves([]);
      }
    } catch (err) {
      logger.warn('Failed to fetch leaves', { error: err?.message });
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'doctor') {
      router.push('/dashboard');
      return;
    }
    if (!doctorId) return;
    fetchSchedule();
  }, [authLoading, user, doctorId, router, fetchSchedule]);

  const handleAddLeave = async () => {
    if (!newLeave.from || !newLeave.to) {
      showError(t('doctors.leaveFromToRequired'));
      return;
    }
    const fromDate = new Date(newLeave.from);
    const toDate = new Date(newLeave.to);
    if (toDate < fromDate) {
      showError(t('doctors.leaveToBeforeFrom'));
      return;
    }
    try {
      setSaving(true);
      const res = await apiClient.post(`/doctors/${doctorId}/leaves`, {
        from: new Date(newLeave.from).toISOString(),
        to: new Date(newLeave.to).toISOString(),
        reason: newLeave.reason || undefined,
      });
      if (res.success) {
        showSuccess(t('doctors.leaveAdded'));
        setNewLeave({ from: '', to: '', reason: '' });
        fetchSchedule();
      } else {
        showError(res.error?.message || t('doctors.leaveAddFailed'));
      }
    } catch (err) {
      showError(err?.message || t('doctors.leaveAddFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLeave = async (index) => {
    try {
      setSaving(true);
      const res = await apiClient.delete(`/doctors/${doctorId}/leaves?index=${index}`);
      if (res.success) {
        showSuccess(t('doctors.leaveRemoved'));
        fetchSchedule();
      } else {
        showError(res.error?.message || t('doctors.leaveRemoveFailed'));
      }
    } catch (err) {
      showError(err?.message || t('doctors.leaveRemoveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <Loader type='section' text={t('common.loading')} />
      </Layout>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <Layout>
      <div className='space-y-6'>
        <PageHeader
          title={t('doctors.manageLeaves')}
          subtitle={t('doctors.manageLeavesSubtitle')}
        />
        <div className='flex gap-2'>
          <Link href='/doctors/schedule'>
            <Button variant='secondary' size='sm'>
              ← {t('doctors.backToSchedule')}
            </Button>
          </Link>
        </div>

        <Card>
          <div className='p-6'>
            <h2 className='text-lg font-bold text-neutral-900 mb-4'>{t('doctors.addLeave')}</h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('doctors.leaveFrom')}
                </label>
                <Input
                  type='date'
                  value={newLeave.from}
                  onChange={(e) => setNewLeave({ ...newLeave, from: e.target.value })}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('doctors.leaveTo')}
                </label>
                <Input
                  type='date'
                  value={newLeave.to}
                  onChange={(e) => setNewLeave({ ...newLeave, to: e.target.value })}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-neutral-700 mb-1'>
                  {t('doctors.reason')} ({t('common.optional')})
                </label>
                <Input
                  type='text'
                  placeholder={t('doctors.leaveReasonPlaceholder')}
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                />
              </div>
            </div>
            <Button variant='primary' onClick={handleAddLeave} disabled={saving}>
              {saving ? t('doctors.saving') : t('doctors.addLeave')}
            </Button>
          </div>
        </Card>

        <Card>
          <div className='p-6'>
            <h2 className='text-lg font-bold text-neutral-900 mb-4'>
              {t('doctors.holidaysLeaves')}
            </h2>
            {leaves.length > 0 ? (
              <ul className='space-y-2'>
                {leaves.map((leave, index) => (
                  <li
                    key={index}
                    className='flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200'
                  >
                    <span className='text-neutral-900'>
                      {new Date(leave.startDate).toLocaleDateString()}
                      {leave.endDate && leave.endDate !== leave.startDate
                        ? ` – ${new Date(leave.endDate).toLocaleDateString()}`
                        : ''}
                      {leave.reason ? ` (${leave.reason})` : ''}
                    </span>
                    <Button
                      variant='danger'
                      size='sm'
                      onClick={() => handleRemoveLeave(index)}
                      disabled={saving}
                    >
                      {t('doctors.remove')}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-sm text-neutral-500'>{t('doctors.noHolidaysLeaves')}</p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
