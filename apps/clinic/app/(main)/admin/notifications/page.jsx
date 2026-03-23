'use client';

/**
 * Notifications Tab – per Super_Admin.md §15.
 * Alerts Configuration: delivery channels (In-app / Email / SMS) per alert type,
 * recipients list, escalation rules, configurable thresholds.
 * Alert types: Trial Ending, Payment Failure, Storage Near Limit, Clinic Inactive,
 * Security Anomaly, Backup Failed.
 * Super Admin only.
 */

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_ALERTS = {
  trialEnding: {
    enabled: true, channels: { inApp: true, email: true, sms: false },
    daysBefore: 7, configurable: true, escalateHours: 24,
    recipients: '',
  },
  paymentFailure: {
    enabled: true, channels: { inApp: true, email: true, sms: false },
    configurable: false, escalateHours: 4,
    recipients: '',
  },
  storageNearLimit: {
    enabled: true, channels: { inApp: true, email: true, sms: false },
    thresholdPercent: 85, configurable: true, escalateHours: 48,
    recipients: '',
  },
  clinicInactive: {
    enabled: true, channels: { inApp: true, email: false, sms: false },
    inactiveDays: 30, configurable: true, escalateHours: 72,
    recipients: '',
  },
  securityAnomaly: {
    enabled: true, channels: { inApp: true, email: true, sms: true },
    failedLoginsPerHour: 5, configurable: true, escalateHours: 1,
    recipients: '',
  },
  backupFailed: {
    enabled: true, channels: { inApp: true, email: true, sms: false },
    configurable: false, escalateHours: 2,
    recipients: '',
  },
};

const ALERT_META = [
  { key: 'trialEnding', label: 'Trial Ending', desc: 'Alert when a clinic trial is expiring soon.', defaultThreshold: '7 days before expiry' },
  { key: 'paymentFailure', label: 'Payment Failure', desc: 'Alert on first payment failure.', defaultThreshold: 'On first failure' },
  { key: 'storageNearLimit', label: 'Storage Near Limit', desc: 'Alert when clinic storage exceeds threshold.', defaultThreshold: '85% of quota' },
  { key: 'clinicInactive', label: 'Clinic Inactive', desc: 'Alert when no activity for N days.', defaultThreshold: '30 days no activity' },
  { key: 'securityAnomaly', label: 'Security Anomaly', desc: 'Alert on suspicious login patterns.', defaultThreshold: '5 failed logins / hour' },
  { key: 'backupFailed', label: 'Backup Failed', desc: 'Alert when a scheduled backup fails.', defaultThreshold: 'On failure' },
];

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(null);

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
        if (!cancelled && res?.success && res?.data?.notificationAlerts) {
          setAlerts((prev) => ({ ...prev, ...res.data.notificationAlerts }));
        }
      } catch (_) {
        // Keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.role]);

  const update = (key, field, value) =>
    setAlerts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const updateChannel = (alertKey, channel, value) =>
    setAlerts((prev) => ({
      ...prev,
      [alertKey]: { ...prev[alertKey], channels: { ...prev[alertKey].channels, [channel]: value } },
    }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await apiClient.put('/admin/settings/security', { notificationAlerts: alerts });
      if (res?.success) {
        showSuccess('Notification settings saved.');
      } else {
        showError(res?.error?.message || 'Failed to save.');
      }
    } catch (err) {
      showError(err?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user?.role !== 'super_admin') return null;

  return (
    <Layout>
      <PageHeader
        title={t('admin.tabNotifications') || 'Notifications'}
        subtitle="Configure alert thresholds, delivery channels, recipients, and escalation rules"
        notifications={[]}
        unreadCount={0}
      />
      <div className="admin-page-content">
        {/* Active alerts overview */}
        <section className="admin-section">
          <div className="admin-section__title">
            <span className="admin-section__accent" />
            <h2 className="admin-section__title-text">Active Alerts Overview</h2>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Current platform-wide alert counts.{' '}
            <button type="button" className="text-primary-600 hover:underline" onClick={() => router.push('/admin')}>
              View on Overview →
            </button>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Trial Ending Soon', link: '/admin/subscriptions', color: 'border-amber-300 bg-amber-50 dark:bg-amber-900/10' },
              { label: 'Payment Failures', link: '/admin/subscriptions', color: 'border-red-300 bg-red-50 dark:bg-red-900/10' },
              { label: 'Storage Near Limit', link: '/admin/clients', color: 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' },
              { label: 'Inactive Clinics', link: '/admin/clients?status=inactive', color: 'border-neutral-200 bg-neutral-50 dark:bg-neutral-800' },
              { label: 'Security Anomalies', link: '/admin/settings/security', color: 'border-purple-300 bg-purple-50 dark:bg-purple-900/10' },
              { label: 'Backup Failures', link: '/admin/data-management', color: 'border-red-300 bg-red-50 dark:bg-red-900/10' },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => router.push(a.link)}
                className={`text-left px-4 py-3 rounded-lg border text-sm font-medium transition-opacity hover:opacity-80 ${a.color}`}
              >
                <span className="block text-neutral-800 dark:text-neutral-200">{a.label}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 block">View details →</span>
              </button>
            ))}
          </div>
        </section>

        {/* Alert Configuration */}
        <section className="admin-section">
          <div className="admin-section__title">
            <span className="admin-section__accent" />
            <h2 className="admin-section__title-text">Alert Configuration</h2>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Configure delivery channels, recipients, thresholds, and escalation for each alert type.
            Click an alert to expand its settings.
          </p>

          {loading ? (
            <Card><p className="text-sm text-neutral-500 py-6 text-center">Loading…</p></Card>
          ) : (
            <Card>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {ALERT_META.map((meta) => {
                  const cfg = alerts[meta.key];
                  const isOpen = expandedAlert === meta.key;
                  return (
                    <div key={meta.key}>
                      {/* Alert header row */}
                      <div className="flex items-center gap-4 py-4">
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={cfg.enabled}
                            onChange={(e) => update(meta.key, 'enabled', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 dark:bg-neutral-600 dark:peer-checked:bg-primary-600" />
                        </label>
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            className="text-left w-full"
                            onClick={() => setExpandedAlert(isOpen ? null : meta.key)}
                          >
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">{meta.label}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {meta.desc} Default: <span className="text-neutral-600 dark:text-neutral-300">{meta.defaultThreshold}</span>
                            </p>
                          </button>
                        </div>
                        {/* Channels summary */}
                        <div className="flex gap-1 shrink-0">
                          {cfg.channels.inApp && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">In-app</span>}
                          {cfg.channels.email && <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">Email</span>}
                          {cfg.channels.sms && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">SMS</span>}
                        </div>
                        <button
                          type="button"
                          className="text-neutral-400 shrink-0"
                          onClick={() => setExpandedAlert(isOpen ? null : meta.key)}
                          aria-label={isOpen ? 'Collapse' : 'Expand'}
                        >
                          <ChevronIcon open={isOpen} />
                        </button>
                      </div>

                      {/* Expanded settings */}
                      {isOpen && (
                        <div className="pb-5 pl-14 space-y-4 border-t border-neutral-50 dark:border-neutral-800 pt-4">
                          {/* Delivery channels */}
                          <div>
                            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">Delivery Channels</p>
                            <div className="flex flex-wrap gap-4">
                              {[
                                { key: 'inApp', label: 'In-app' },
                                { key: 'email', label: 'Email' },
                                { key: 'sms', label: 'SMS' },
                              ].map((ch) => (
                                <label key={ch.key} className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                    checked={cfg.channels[ch.key] ?? false}
                                    onChange={(e) => updateChannel(meta.key, ch.key, e.target.checked)}
                                  />
                                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{ch.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Recipients */}
                          <div>
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">
                              Recipients <span className="text-neutral-400 font-normal normal-case">(comma-separated emails/phones)</span>
                            </label>
                            <input
                              type="text"
                              value={cfg.recipients ?? ''}
                              onChange={(e) => update(meta.key, 'recipients', e.target.value)}
                              placeholder="admin@company.com, +1234567890"
                              className="input w-full text-sm max-w-md"
                            />
                          </div>

                          {/* Threshold (configurable alerts) */}
                          {meta.key === 'trialEnding' && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-neutral-600 dark:text-neutral-400">Notify</label>
                              <input type="number" min={1} max={30} value={cfg.daysBefore} onChange={(e) => update(meta.key, 'daysBefore', Number(e.target.value))} className="input w-16 text-sm text-center" />
                              <label className="text-sm text-neutral-600 dark:text-neutral-400">days before trial ends</label>
                            </div>
                          )}
                          {meta.key === 'storageNearLimit' && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-neutral-600 dark:text-neutral-400">Alert at</label>
                              <input type="number" min={50} max={99} value={cfg.thresholdPercent} onChange={(e) => update(meta.key, 'thresholdPercent', Number(e.target.value))} className="input w-16 text-sm text-center" />
                              <label className="text-sm text-neutral-600 dark:text-neutral-400">% storage usage</label>
                            </div>
                          )}
                          {meta.key === 'clinicInactive' && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-neutral-600 dark:text-neutral-400">Inactive for more than</label>
                              <input type="number" min={7} max={180} value={cfg.inactiveDays} onChange={(e) => update(meta.key, 'inactiveDays', Number(e.target.value))} className="input w-16 text-sm text-center" />
                              <label className="text-sm text-neutral-600 dark:text-neutral-400">days</label>
                            </div>
                          )}
                          {meta.key === 'securityAnomaly' && (
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-neutral-600 dark:text-neutral-400">Trigger after</label>
                              <input type="number" min={3} max={20} value={cfg.failedLoginsPerHour} onChange={(e) => update(meta.key, 'failedLoginsPerHour', Number(e.target.value))} className="input w-16 text-sm text-center" />
                              <label className="text-sm text-neutral-600 dark:text-neutral-400">failed logins / hour</label>
                            </div>
                          )}

                          {/* Escalation */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Escalate if unacknowledged after</label>
                            <input
                              type="number"
                              min={1}
                              max={168}
                              value={cfg.escalateHours}
                              onChange={(e) => update(meta.key, 'escalateHours', Number(e.target.value))}
                              className="input w-16 text-sm text-center"
                            />
                            <label className="text-sm text-neutral-600 dark:text-neutral-400">hour(s)</label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700 flex flex-wrap gap-3 items-center mt-2">
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} isLoading={saving}>
                  Save Notification Settings
                </Button>
                <p className="text-xs text-neutral-400">
                  Alert counts are shown on the Overview dashboard. Delivery channels apply to all recipients.
                </p>
              </div>
            </Card>
          )}
        </section>
      </div>
    </Layout>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
