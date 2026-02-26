'use client';

/**
 * Support Intervention Tab – Enter clinic in support mode per Super_Admin.md.
 * Sub-tab: Enter Clinic (Support Mode) – view configuration only.
 * Clinical data editing is blocked for Super Admin.
 * Super Admin only.
 */

import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function AdminSupportPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentLogs, setRecentLogs] = useState([]);
  // Support session: active clinic + 60-minute countdown timer
  const [sessionClinic, setSessionClinic] = useState(null); // { id, name }
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const fetchClinics = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/clients?limit=20&status=active');
      const list = res?.data?.clients ?? res?.clients ?? [];
      setClinics(Array.isArray(list) ? list : []);
    } catch (_) {
      setClinics([]);
    } finally {
      setLoadingClinics(false);
    }
  }, []);

  const fetchRecentLogs = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/activity-logs?action=impersonate&limit=5');
      const logs = res?.data?.logs ?? res?.logs ?? [];
      setRecentLogs(Array.isArray(logs) ? logs : []);
    } catch (_) {
      setRecentLogs([]);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchClinics();
      fetchRecentLogs();
    }
  }, [user?.role, fetchClinics, fetchRecentLogs]);

  const filteredClinics = clinics.filter((c) => {
    const name = (c.name ?? c.clinicName ?? '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  // Start 60-minute support session timer
  const startSupportSession = useCallback((clinic) => {
    const id = clinic._id ?? clinic.tenantId;
    const name = clinic.name ?? clinic.clinicName ?? id;
    setSessionClinic({ id, name });
    setSessionSecondsLeft(60 * 60); // 60 minutes
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSessionSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setSessionClinic(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Clean up timer on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const endSupportSession = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setSessionClinic(null);
    setSessionSecondsLeft(0);
  };

  const fmtTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!user || user?.role !== 'super_admin') return null;

  return (
    <Layout>
      <PageHeader
        title={t('admin.tabSupportIntervention') || 'Support Intervention'}
        subtitle={
          t('admin.supportInterventionSubtitle') ||
          'Enter clinic systems in read-only support mode to diagnose configuration issues'
        }
        notifications={[]}
        unreadCount={0}
      />
      {/* SUPPORT MODE BANNER — fixed top bar while session active */}
      {sessionClinic && (
        <div className='fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-black flex items-center justify-between px-4 py-2 text-sm font-semibold shadow-lg'>
          <span>⚠ SUPPORT MODE — READ ONLY — Clinical data access is blocked</span>
          <div className='flex items-center gap-4'>
            <span className='font-mono'>
              Clinic: <span className='font-bold'>{sessionClinic.name}</span>
            </span>
            <span className='font-mono'>
              Session expires in:{' '}
              <span className={sessionSecondsLeft < 300 ? 'text-red-800' : ''}>
                {fmtTime(sessionSecondsLeft)}
              </span>
            </span>
            <button
              type='button'
              className='bg-black/20 hover:bg-black/30 text-black font-semibold text-xs px-3 py-1 rounded-lg'
              onClick={endSupportSession}
            >
              Exit Support Mode
            </button>
          </div>
        </div>
      )}
      {/* Push content down when banner is visible */}
      {sessionClinic && <div className='h-10' />}

      <div className='admin-page-content'>
        {/* Support Mode Rules */}
        <section className='admin-section'>
          <div className='admin-section__title'>
            <span className='admin-section__accent' />
            <h2 className='admin-section__title-text'>Enter Clinic (Support Mode)</h2>
          </div>

          <Card className='border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 mb-4'>
            <div className='flex gap-3'>
              <div className='shrink-0 mt-0.5'>
                <WarningIcon />
              </div>
              <div>
                <p className='font-semibold text-amber-800 dark:text-amber-300 text-sm mb-1'>
                  Support Mode Restrictions
                </p>
                <ul className='text-sm text-amber-700 dark:text-amber-400 space-y-0.5'>
                  <li>• You can view clinic configuration, settings, and workflows</li>
                  <li>
                    • You <strong>cannot</strong> edit consultations, prescriptions, or patient
                    clinical records
                  </li>
                  <li>• All support interventions are logged in the Audit &amp; Compliance tab</li>
                  <li>• Exit support mode immediately after diagnosing the issue</li>
                </ul>
              </div>
            </div>
          </Card>

          <AdminToolbar
            intro='Search for a clinic and click Enter Clinic to access the clinic admin view in support mode.'
            searchValue={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            searchPlaceholder='Search active clinics…'
            searchAriaLabel='Search active clinics'
            filters={[]}
          />

          {loadingClinics ? (
            <Card>
              <p className='text-sm text-neutral-500 py-6 text-center'>Loading clinics…</p>
            </Card>
          ) : filteredClinics.length === 0 ? (
            <Card>
              <p className='text-sm text-neutral-500 py-6 text-center'>
                {searchTerm ? 'No clinics match your search.' : 'No active clinics found.'}
              </p>
            </Card>
          ) : (
            <Card>
              <ul className='divide-y divide-neutral-100 dark:divide-neutral-700'>
                {filteredClinics.map((clinic) => {
                  const id = clinic._id ?? clinic.tenantId;
                  return (
                    <li key={id} className='flex items-center justify-between py-3 gap-4'>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate'>
                          {clinic.name ?? clinic.clinicName ?? id}
                        </p>
                        <p className='text-xs text-neutral-500 mt-0.5'>
                          {clinic.planName ?? clinic.plan ?? '—'} ·{' '}
                          <span
                            className={
                              clinic.status === 'active'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }
                          >
                            {clinic.status ?? 'active'}
                          </span>
                        </p>
                      </div>
                      <Button
                        variant='secondary'
                        size='xs'
                        onClick={() => {
                          startSupportSession(clinic);
                          router.push(`/admin/clients?tenantId=${encodeURIComponent(id)}`);
                        }}
                      >
                        Enter Clinic →
                      </Button>
                    </li>
                  );
                })}
              </ul>
              <div className='pt-3 border-t border-neutral-100 dark:border-neutral-700 mt-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => router.push('/admin/clients')}
                  className='text-sm text-primary-600'
                >
                  View all clinics in Clinic Management →
                </Button>
              </div>
            </Card>
          )}
        </section>

        {/* Recent support interventions */}
        <section className='admin-section'>
          <div className='admin-section__title'>
            <span className='admin-section__accent' />
            <h2 className='admin-section__title-text'>Recent Interventions</h2>
            <Button
              variant='ghost'
              size='xs'
              onClick={() => router.push('/admin/activity-logs')}
              className='ml-auto text-primary-600 text-xs'
            >
              View all in Audit Logs →
            </Button>
          </div>
          {recentLogs.length === 0 ? (
            <Card>
              <p className='text-sm text-neutral-500 py-4 text-center'>
                No recent support interventions recorded.
              </p>
            </Card>
          ) : (
            <Card>
              <ul className='divide-y divide-neutral-100 dark:divide-neutral-700'>
                {recentLogs.map((log, idx) => (
                  <li key={log._id ?? idx} className='py-3 flex items-start gap-3'>
                    <div className='w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0'>
                      <PersonIcon />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm text-neutral-800 dark:text-neutral-200'>
                        <span className='font-medium'>{log.userId ?? 'Super Admin'}</span>{' '}
                        {log.action ?? 'entered support mode'}
                      </p>
                      <p className='text-xs text-neutral-500 mt-0.5'>
                        {log.resourceId ?? '—'} ·{' '}
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </Layout>
  );
}

function WarningIcon() {
  return (
    <svg
      className='w-5 h-5 text-amber-600 dark:text-amber-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      className='w-4 h-4 text-primary-600 dark:text-primary-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      />
    </svg>
  );
}
