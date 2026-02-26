'use client';

/**
 * Security Settings – per Super_Admin.md §13.
 * Sub-tabs: 2FA Enforcement, IP Restrictions.
 * 2FA: platform-wide for super admins + per-clinic requirement + report of clinics with 2FA disabled.
 * IP Restrictions: super admin panel IP allowlist + per-clinic allowlist + CIDR support + test tool.
 */

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const defaultValues = {
  sessionTimeoutMinutes: 30,
  passwordMinLength: 8,
  passwordRequireSpecial: true,
  require2FAForAdmin: false,
  require2FAForAllClinics: false,
  failedLoginMaxAttempts: 5,
  failedLoginLockoutMinutes: 15,
  ipWhitelistEnabled: false,
  auditLogRetentionDays: 365,
  emergencyLock: false,
  superAdminIpWhitelistEnabled: false,
  superAdminIpWhitelist: '',
};

const ACTIVE_TAB = 'px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white';
const INACTIVE_TAB = 'px-4 py-2 text-sm font-medium rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700';

export default function AdminSettingsSecurityPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('2fa');
  const [form, setForm] = useState(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // IP test tool
  const [testIp, setTestIp] = useState('');
  const [testIpResult, setTestIpResult] = useState(null);

  // Clinics without 2FA
  const [clinicsNo2FA, setClinicsNo2FA] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const report2FAFetchedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'super_admin') {
        router.push('/dashboard');
        return;
      }
      fetchSettings();
    }
  }, [authLoading, user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/settings/security');
      if (response.success && response.data) {
        const d = response.data;
        setForm({
          ...defaultValues,
          ...d,
          superAdminIpWhitelist: Array.isArray(d.superAdminIpWhitelist)
            ? d.superAdminIpWhitelist.join('\n')
            : d.superAdminIpWhitelist || '',
        });
      }
    } catch (_) {
      showError(t('admin.failedToLoadSettings') || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetch2FAReport = useCallback(async () => {
    setLoadingReport(true);
    try {
      const res = await apiClient.get('/admin/clients?limit=100');
      const list = res?.data?.clients ?? res?.clients ?? (Array.isArray(res?.data) ? res.data : []);
      // Filter to clinics where 2FA is not enforced
      const no2fa = (Array.isArray(list) ? list : []).filter(
        (c) => !c.require2FA && !c.twoFactorEnabled,
      );
      setClinicsNo2FA(no2fa);
    } catch (_) {
      setClinicsNo2FA([]);
    } finally {
      setLoadingReport(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === '2fa' && user?.role === 'super_admin' && !report2FAFetchedRef.current) {
      report2FAFetchedRef.current = true;
      fetch2FAReport();
    }
  }, [activeTab, user?.role, fetch2FAReport]);

  const handleSave = async (e) => {
    e?.preventDefault();
    const session = Math.min(1440, Math.max(5, Number(form.sessionTimeoutMinutes) || 30));
    const pwdLen = Math.min(32, Math.max(6, Number(form.passwordMinLength) || 8));
    const maxAttempts = Math.min(20, Math.max(3, Number(form.failedLoginMaxAttempts) || 5));
    const lockout = Math.min(1440, Math.max(5, Number(form.failedLoginLockoutMinutes) || 15));
    const retention = Math.min(3650, Math.max(30, Number(form.auditLogRetentionDays) || 365));
    try {
      setSaving(true);
      const payload = {
        sessionTimeoutMinutes: session,
        passwordMinLength: pwdLen,
        passwordRequireSpecial: !!form.passwordRequireSpecial,
        require2FAForAdmin: !!form.require2FAForAdmin,
        require2FAForAllClinics: !!form.require2FAForAllClinics,
        failedLoginMaxAttempts: maxAttempts,
        failedLoginLockoutMinutes: lockout,
        ipWhitelistEnabled: !!form.ipWhitelistEnabled,
        auditLogRetentionDays: retention,
        emergencyLock: !!form.emergencyLock,
        superAdminIpWhitelistEnabled: !!form.superAdminIpWhitelistEnabled,
        superAdminIpWhitelist: (form.superAdminIpWhitelist || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const response = await apiClient.put('/admin/settings/security', payload);
      if (response.success) {
        showSuccess(t('admin.settingsSaved') || 'Settings saved.');
        await fetchSettings();
      } else {
        showError(response.error?.message || t('admin.failedToSaveSettings') || 'Failed to save.');
      }
    } catch (_) {
      showError(t('admin.failedToSaveSettings') || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestIp = () => {
    const allowlist = (form.superAdminIpWhitelist || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!allowlist.length) {
      setTestIpResult({ allowed: true, reason: 'No IP restrictions configured.' });
      return;
    }
    const matched = allowlist.some((entry) => {
      if (entry.includes('/')) {
        // Basic CIDR check (simplified)
        return testIp.startsWith(entry.split('/')[0].split('.').slice(0, 3).join('.'));
      }
      return entry === testIp;
    });
    setTestIpResult({ allowed: matched, reason: matched ? 'IP is in allowlist.' : 'IP is NOT in allowlist — would be blocked.' });
  };

  if (authLoading || loading) return <Loader type="page" text={t('common.loading') || 'Loading…'} />;
  if (user?.role !== 'super_admin') return null;

  return (
    <Layout
      title={t('admin.settingsSecurityTitle') || 'Security Settings'}
      subtitle={t('admin.settingsSecuritySubtitle') || 'Manage 2FA enforcement and IP access restrictions'}
    >
      <div className="admin-page-content">
        <div className="flex gap-2 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-fit">
          <button type="button" className={activeTab === '2fa' ? ACTIVE_TAB : INACTIVE_TAB} onClick={() => setActiveTab('2fa')}>
            2FA Enforcement
          </button>
          <button type="button" className={activeTab === 'ip' ? ACTIVE_TAB : INACTIVE_TAB} onClick={() => setActiveTab('ip')}>
            IP Restrictions
          </button>
          <button type="button" className={activeTab === 'general' ? ACTIVE_TAB : INACTIVE_TAB} onClick={() => setActiveTab('general')}>
            General
          </button>
        </div>

        {/* 2FA Enforcement Tab */}
        {activeTab === '2fa' && (
          <>
            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Platform 2FA Requirements</h2>
              </div>
              <Card className="max-w-2xl">
                <div className="space-y-5">
                  <ToggleField
                    id="require2FAForAdmin"
                    label="Require 2FA for all Super Admin users"
                    desc="All users with super_admin role must have 2FA enabled to log in to the admin panel."
                    checked={form.require2FAForAdmin}
                    onChange={(v) => setForm((f) => ({ ...f, require2FAForAdmin: v }))}
                  />
                  <ToggleField
                    id="require2FAForAllClinics"
                    label="Require 2FA for all clinic users (platform-wide)"
                    desc="Enforces 2FA across all clinic accounts. Individual clinic admins cannot override this."
                    checked={form.require2FAForAllClinics}
                    onChange={(v) => setForm((f) => ({ ...f, require2FAForAllClinics: v }))}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} isLoading={saving}>
                      Save 2FA Settings
                    </Button>
                  </div>
                </div>
              </Card>
            </section>

            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Clinics Without 2FA</h2>
                <Button variant="ghost" size="xs" onClick={fetch2FAReport} className="ml-auto text-primary-600 text-xs">
                  Refresh
                </Button>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Clinics where 2FA is not currently enforced. Use this report to identify security gaps.
              </p>
              <Card>
                {loadingReport ? (
                  <p className="text-sm text-neutral-500 py-6 text-center">Loading report…</p>
                ) : clinicsNo2FA.length === 0 ? (
                  <div className="flex items-center gap-3 py-4">
                    <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckIcon />
                    </span>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                      All clinics have 2FA enforced.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-3">
                      {clinicsNo2FA.length} clinic{clinicsNo2FA.length !== 1 ? 's' : ''} without 2FA
                    </p>
                    <ul className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {clinicsNo2FA.map((c) => {
                        const id = c._id ?? c.tenantId;
                        return (
                          <li key={id} className="flex items-center justify-between py-2.5 gap-4">
                            <div>
                              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                {c.name ?? c.clinicName ?? id}
                              </p>
                              <p className="text-xs text-neutral-500">{c.planName ?? c.plan ?? '—'}</p>
                            </div>
                            <Button variant="ghost" size="xs" onClick={() => router.push(`/admin/clients?tenantId=${encodeURIComponent(id)}`)} className="text-primary-600 text-xs">
                              View →
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </Card>
            </section>
          </>
        )}

        {/* IP Restrictions Tab */}
        {activeTab === 'ip' && (
          <>
            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Super Admin Panel IP Allowlist</h2>
              </div>
              <Card className="max-w-2xl">
                <div className="space-y-4">
                  <ToggleField
                    id="superAdminIpWhitelistEnabled"
                    label="Enable IP restriction for Super Admin panel"
                    desc="Only IPs in the allowlist below can access the super admin panel. Leave disabled for no restriction."
                    checked={form.superAdminIpWhitelistEnabled}
                    onChange={(v) => setForm((f) => ({ ...f, superAdminIpWhitelistEnabled: v }))}
                  />
                  {form.superAdminIpWhitelistEnabled && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Allowed IPs / CIDR ranges <span className="text-neutral-400 font-normal">(one per line)</span>
                      </label>
                      <textarea
                        className="input w-full min-h-[100px] font-mono text-sm resize-y"
                        value={form.superAdminIpWhitelist}
                        onChange={(e) => setForm((f) => ({ ...f, superAdminIpWhitelist: e.target.value }))}
                        placeholder={'192.168.1.0/24\n10.0.0.1\n203.0.113.42'}
                      />
                      <p className="text-xs text-neutral-400 mt-1">Supports single IPs and CIDR notation (e.g., 192.168.0.0/24).</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} isLoading={saving}>
                      Save IP Settings
                    </Button>
                  </div>
                </div>
              </Card>
            </section>

            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Per-Clinic IP Allowlist</h2>
              </div>
              <Card className="max-w-2xl">
                <ToggleField
                  id="ipWhitelistEnabled"
                  label="Enable per-clinic IP restrictions"
                  desc="Allow clinic admins to set IP allowlists for their own clinic access. Requires clinic-level configuration."
                  checked={form.ipWhitelistEnabled}
                  onChange={(v) => setForm((f) => ({ ...f, ipWhitelistEnabled: v }))}
                />
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 mb-3">
                  Per-clinic IP allowlists are configured in Clinic Management → clinic profile → Security.
                </p>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} isLoading={saving}>
                    Save
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => router.push('/admin/clients')}>
                    Manage Clinics →
                  </Button>
                </div>
              </Card>
            </section>

            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Test IP Against Allowlist</h2>
              </div>
              <Card className="max-w-2xl">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                  Check whether a specific IP address would be allowed or blocked by the current
                  Super Admin allowlist configuration.
                </p>
                <div className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={testIp}
                    onChange={(e) => { setTestIp(e.target.value); setTestIpResult(null); }}
                    placeholder="e.g. 203.0.113.42"
                    className="input font-mono text-sm w-48"
                  />
                  <Button variant="secondary" size="sm" onClick={handleTestIp} disabled={!testIp.trim()}>
                    Test IP
                  </Button>
                </div>
                {testIpResult && (
                  <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium ${testIpResult.allowed ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                    {testIpResult.allowed ? '✓ Allowed' : '✗ Blocked'} — {testIpResult.reason}
                  </div>
                )}
              </Card>
            </section>
          </>
        )}

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <section className="admin-section">
            <div className="admin-section__title">
              <span className="admin-section__accent" />
              <h2 className="admin-section__title-text">General Security Settings</h2>
            </div>
            <Card className="max-w-2xl">
              <form onSubmit={handleSave} className="space-y-4">
                <FormField label="Session timeout (minutes)">
                  <input type="number" min={5} max={1440} value={form.sessionTimeoutMinutes} onChange={(e) => setForm((f) => ({ ...f, sessionTimeoutMinutes: e.target.value }))} className="input w-32" />
                </FormField>
                <FormField label="Password minimum length">
                  <input type="number" min={6} max={32} value={form.passwordMinLength} onChange={(e) => setForm((f) => ({ ...f, passwordMinLength: e.target.value }))} className="input w-32" />
                </FormField>
                <ToggleField
                  id="passwordRequireSpecial"
                  label="Require special characters in password"
                  checked={form.passwordRequireSpecial}
                  onChange={(v) => setForm((f) => ({ ...f, passwordRequireSpecial: v }))}
                />
                <FormField label="Failed login max attempts">
                  <input type="number" min={3} max={20} value={form.failedLoginMaxAttempts} onChange={(e) => setForm((f) => ({ ...f, failedLoginMaxAttempts: e.target.value }))} className="input w-32" />
                </FormField>
                <FormField label="Failed login lockout (minutes)">
                  <input type="number" min={5} max={1440} value={form.failedLoginLockoutMinutes} onChange={(e) => setForm((f) => ({ ...f, failedLoginLockoutMinutes: e.target.value }))} className="input w-32" />
                </FormField>
                <FormField label="Audit log retention (days)">
                  <input type="number" min={30} max={3650} value={form.auditLogRetentionDays} onChange={(e) => setForm((f) => ({ ...f, auditLogRetentionDays: e.target.value }))} className="input w-32" />
                </FormField>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" variant="primary" size="sm" disabled={saving} isLoading={saving}>
                    {saving ? 'Saving…' : 'Save General Settings'}
                  </Button>
                </div>
              </form>
            </Card>
          </section>
        )}
      </div>
    </Layout>
  );
}

function ToggleField({ id, label, desc, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
          {label}
        </label>
        {desc && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
        <input
          type="checkbox"
          id={id}
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:bg-neutral-600 dark:peer-checked:bg-primary-600" />
      </label>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
