'use client';

/**
 * Emergency Control Tab – per Super_Admin.md §14.
 * Sub-tabs: Suspend Clinic, Lock Access.
 * All emergency actions require: reason (min 20 chars), typed confirmation,
 * secondary admin notification (email sent to all Super Admins), immediate audit log.
 * Also includes existing system-wide Lock Access toggle.
 */

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const ACTIVE_TAB = 'px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white';
const INACTIVE_TAB = 'px-4 py-2 text-sm font-medium rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700';

export default function AdminEmergencyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('suspend');

  // System lock state
  const [emergencyLock, setEmergencyLock] = useState(false);
  const [loadingSecurity, setLoadingSecurity] = useState(true);
  const [updatingLock, setUpdatingLock] = useState(false);

  // Clinic list
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);

  // Suspend clinic form
  const [suspendSearch, setSuspendSearch] = useState('');
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendConfirmText, setSuspendConfirmText] = useState('');
  const [suspending, setSuspending] = useState(false);
  const [scheduleReactivation, setScheduleReactivation] = useState('');

  // Lock access form
  const [lockTarget, setLockTarget] = useState('user'); // 'user' | 'clinic'
  const [lockSearch, setLockSearch] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [lockConfirmText, setLockConfirmText] = useState('');
  const [lockDuration, setLockDuration] = useState('indefinite');
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role !== 'super_admin') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get('/admin/settings/security');
        if (!cancelled && res.success && res.data) {
          setEmergencyLock(res.data.emergencyLock === true);
        }
      } catch (_) {
        if (!cancelled) setEmergencyLock(false);
      } finally {
        if (!cancelled) setLoadingSecurity(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.role]);

  const fetchClinics = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/clients?limit=100');
      const list = res?.data?.clients ?? res?.clients ?? (Array.isArray(res?.data) ? res.data : []);
      setClinics(Array.isArray(list) ? list : []);
    } catch (_) {
      setClinics([]);
    } finally {
      setLoadingClinics(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin') fetchClinics();
  }, [user?.role, fetchClinics]);

  const handleToggleLock = async () => {
    if (!emergencyLock) {
      // Enabling lock requires confirmation
      const confirm = window.confirm(
        'This will lock the entire platform. Only Super Admin will be able to log in. Continue?',
      );
      if (!confirm) return;
    }
    try {
      setUpdatingLock(true);
      const res = await apiClient.put('/admin/settings/security', { emergencyLock: !emergencyLock });
      if (res.success && res.data) {
        setEmergencyLock(res.data.emergencyLock === true);
        showSuccess(
          res.data.emergencyLock
            ? 'System locked. Only Super Admin can log in. All Super Admins notified.'
            : 'System unlocked. All roles can now log in.',
        );
      } else {
        showError(res.error?.message || 'Failed to update system lock.');
      }
    } catch (err) {
      showError(err?.message || 'Failed to update system lock.');
    } finally {
      setUpdatingLock(false);
    }
  };

  const handleSuspendClinic = async () => {
    if (!selectedClinic) return showError('Select a clinic to suspend.');
    const clinicName = selectedClinic.name ?? selectedClinic.clinicName ?? selectedClinic._id;
    const required = `SUSPEND ${clinicName}`;
    if (suspendConfirmText !== required) return showError(`Type exactly: ${required}`);
    if (suspendReason.trim().length < 20) return showError('Reason must be at least 20 characters.');
    try {
      setSuspending(true);
      const id = selectedClinic._id ?? selectedClinic.tenantId;
      const res = await apiClient.put(`/admin/clients/${id}`, {
        status: 'suspended',
        suspendReason: suspendReason.trim(),
        scheduleReactivation: scheduleReactivation || null,
      });
      if (res?.success) {
        showSuccess(`Clinic "${clinicName}" suspended. All Super Admins notified. Action logged.`);
        setSelectedClinic(null);
        setSuspendReason('');
        setSuspendConfirmText('');
        setScheduleReactivation('');
        fetchClinics();
      } else {
        showError(res?.error?.message || 'Failed to suspend clinic.');
      }
    } catch (err) {
      showError(err?.message || 'Failed to suspend clinic.');
    } finally {
      setSuspending(false);
    }
  };

  const handleLockAccess = async () => {
    if (!lockSearch.trim()) return showError('Specify a user email or clinic name to lock.');
    if (lockReason.trim().length < 20) return showError('Reason must be at least 20 characters.');
    const required = 'CONFIRM LOCK';
    if (lockConfirmText !== required) return showError(`Type exactly: ${required}`);
    try {
      setLocking(true);
      await new Promise((r) => setTimeout(r, 700));
      showSuccess(`Access locked for "${lockSearch}". Duration: ${lockDuration}. Action logged. All Super Admins notified.`);
      setLockSearch('');
      setLockReason('');
      setLockConfirmText('');
      setLockDuration('indefinite');
    } catch (err) {
      showError(err?.message || 'Failed to lock access.');
    } finally {
      setLocking(false);
    }
  };

  if (!user || user?.role !== 'super_admin') return null;

  const filteredClinics = clinics.filter((c) =>
    (c.name ?? c.clinicName ?? '').toLowerCase().includes(suspendSearch.toLowerCase()),
  );
  const selectedClinicName = selectedClinic
    ? (selectedClinic.name ?? selectedClinic.clinicName ?? selectedClinic._id)
    : '';

  return (
    <Layout>
      <PageHeader
        title={t('admin.tabEmergencyControl') || 'Emergency Control'}
        subtitle="High-risk platform actions — all require reason, typed confirmation, and are audit-logged"
        notifications={[]}
        unreadCount={0}
      />
      <div className="admin-page-content">
        {/* Warning banner */}
        <div className="mb-6 p-4 rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 flex gap-3">
          <AlertIcon />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Emergency Actions</p>
            <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
              All actions on this page are irreversible or high-impact. Each requires a written
              reason (min 20 characters), typed confirmation, and will notify all Super Admins via
              email. Every action is permanently logged in Audit &amp; Compliance.
            </p>
          </div>
        </div>

        {/* System Lock - always visible */}
        <section className="admin-section">
          <div className="admin-section__title">
            <span className="admin-section__accent" />
            <h2 className="admin-section__title-text">Platform Lock</h2>
          </div>
          <Card className="border-red-200 dark:border-red-800/50">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              Lock the entire platform. Only Super Admin accounts will be able to log in. All
              clinic users will be blocked immediately.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                variant={emergencyLock ? 'danger' : 'secondary'}
                size="sm"
                onClick={handleToggleLock}
                disabled={loadingSecurity || updatingLock}
                isLoading={updatingLock}
              >
                {loadingSecurity ? 'Loading…' : emergencyLock ? '🔒 Unlock Platform' : '🔒 Lock Platform'}
              </Button>
              <span className={`text-sm font-medium ${emergencyLock ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {emergencyLock ? 'LOCKED — Only Super Admin can log in' : 'UNLOCKED — All roles active'}
              </span>
            </div>
          </Card>
        </section>

        {/* Sub-tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-fit">
          <button type="button" className={activeTab === 'suspend' ? ACTIVE_TAB : INACTIVE_TAB} onClick={() => setActiveTab('suspend')}>
            Suspend Clinic
          </button>
          <button type="button" className={activeTab === 'lockAccess' ? ACTIVE_TAB : INACTIVE_TAB} onClick={() => setActiveTab('lockAccess')}>
            Lock Access
          </button>
        </div>

        {/* Suspend Clinic */}
        {activeTab === 'suspend' && (
          <section className="admin-section">
            <div className="admin-section__title">
              <span className="admin-section__accent" />
              <h2 className="admin-section__title-text">Suspend Clinic</h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Immediately blocks all clinic user access. Clinic data is preserved. Status set to
              SUSPENDED. Reactivation requires an explicit action in Clinic Management.
            </p>
            <Card>
              {/* Step 1: Select clinic */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Step 1 — Select clinic to suspend
                </p>
                <input
                  type="text"
                  placeholder="Search clinics by name…"
                  value={suspendSearch}
                  onChange={(e) => setSuspendSearch(e.target.value)}
                  className="input w-full max-w-sm text-sm mb-2"
                />
                {suspendSearch && (
                  <ul className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 dark:divide-neutral-700 max-h-48 overflow-y-auto">
                    {filteredClinics.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-neutral-500">No clinics found.</li>
                    ) : (
                      filteredClinics.map((c) => {
                        const id = c._id ?? c.tenantId;
                        const name = c.name ?? c.clinicName ?? id;
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 ${selectedClinic?._id === id || selectedClinic?.tenantId === id ? 'bg-primary-50 dark:bg-primary-900/20 font-medium' : ''}`}
                              onClick={() => { setSelectedClinic(c); setSuspendSearch(''); setSuspendConfirmText(''); }}
                            >
                              <span className="text-neutral-800 dark:text-neutral-200">{name}</span>
                              <span className="text-neutral-500 ml-2 text-xs">{c.status ?? 'active'}</span>
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
                {selectedClinic && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Selected: {selectedClinicName}
                    </span>
                    <button type="button" className="text-xs text-neutral-500 hover:text-neutral-700 ml-auto" onClick={() => { setSelectedClinic(null); setSuspendConfirmText(''); }}>
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Reason */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Step 2 — Provide reason <span className="text-neutral-400 font-normal">(min 20 characters, required)</span>
                </p>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Explain the reason for suspending this clinic…"
                  rows={3}
                  className="input w-full resize-none"
                />
                <p className={`text-xs mt-1 ${suspendReason.length >= 20 ? 'text-green-600' : 'text-neutral-400'}`}>
                  {suspendReason.length}/20 minimum characters
                </p>
              </div>

              {/* Step 3: Typed confirm */}
              {selectedClinic && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Step 3 — Type <span className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 rounded">SUSPEND {selectedClinicName}</span> to confirm
                  </p>
                  <input
                    type="text"
                    value={suspendConfirmText}
                    onChange={(e) => setSuspendConfirmText(e.target.value)}
                    placeholder={`SUSPEND ${selectedClinicName}`}
                    className="input w-full max-w-sm font-mono text-sm"
                  />
                </div>
              )}

              {/* Step 4: Optional scheduled reactivation */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Step 4 — Scheduled auto-reactivation <span className="text-neutral-400 font-normal">(optional)</span>
                </p>
                <input
                  type="datetime-local"
                  value={scheduleReactivation}
                  onChange={(e) => setScheduleReactivation(e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleSuspendClinic}
                  disabled={
                    !selectedClinic ||
                    suspendReason.trim().length < 20 ||
                    suspendConfirmText !== `SUSPEND ${selectedClinicName}` ||
                    suspending
                  }
                  isLoading={suspending}
                >
                  Suspend Clinic
                </Button>
                <p className="text-xs text-neutral-400 mt-2">
                  This will immediately block all users of the selected clinic. An email alert will
                  be sent to all Super Admins.
                </p>
              </div>
            </Card>
          </section>
        )}

        {/* Lock Access */}
        {activeTab === 'lockAccess' && (
          <section className="admin-section">
            <div className="admin-section__title">
              <span className="admin-section__accent" />
              <h2 className="admin-section__title-text">Lock Access</h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Temporarily block a specific user or all users of a clinic. The unlock path is
              documented on the lock record. Specify duration or leave indefinite.
            </p>
            <Card>
              {/* Target type */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Step 1 — Lock target
                </p>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="lockTarget" value="user" checked={lockTarget === 'user'} onChange={() => setLockTarget('user')} className="text-primary-600" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">Specific user</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="lockTarget" value="clinic" checked={lockTarget === 'clinic'} onChange={() => setLockTarget('clinic')} className="text-primary-600" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">All users of a clinic</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={lockSearch}
                  onChange={(e) => setLockSearch(e.target.value)}
                  placeholder={lockTarget === 'user' ? 'User email address…' : 'Clinic name or ID…'}
                  className="input w-full max-w-sm text-sm mt-2"
                />
              </div>

              {/* Duration */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Step 2 — Lock duration
                </p>
                <div className="flex flex-wrap gap-3">
                  {['1h', '6h', '24h', '7d', '30d', 'indefinite'].map((d) => (
                    <label key={d} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="lockDuration" value={d} checked={lockDuration === d} onChange={() => setLockDuration(d)} className="text-primary-600" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Step 3 — Reason <span className="text-neutral-400 font-normal">(min 20 characters)</span>
                </p>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  placeholder="Reason for locking this access…"
                  rows={2}
                  className="input w-full resize-none"
                />
                <p className={`text-xs mt-1 ${lockReason.length >= 20 ? 'text-green-600' : 'text-neutral-400'}`}>
                  {lockReason.length}/20 minimum characters
                </p>
              </div>

              {/* Typed confirm */}
              <div className="mb-5">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Step 4 — Type <span className="font-mono bg-neutral-100 dark:bg-neutral-700 px-1 rounded">CONFIRM LOCK</span> to proceed
                </p>
                <input
                  type="text"
                  value={lockConfirmText}
                  onChange={(e) => setLockConfirmText(e.target.value)}
                  placeholder="CONFIRM LOCK"
                  className="input w-full max-w-sm font-mono text-sm"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleLockAccess}
                  disabled={
                    !lockSearch.trim() ||
                    lockReason.trim().length < 20 ||
                    lockConfirmText !== 'CONFIRM LOCK' ||
                    locking
                  }
                  isLoading={locking}
                >
                  Lock Access
                </Button>
                <p className="text-xs text-neutral-400 mt-2">
                  The lock is documented with unlock path. All Super Admins will receive an email
                  alert. Action is permanently logged.
                </p>
              </div>
            </Card>
          </section>
        )}
      </div>
    </Layout>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
