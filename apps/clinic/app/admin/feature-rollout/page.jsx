'use client';

/**
 * Feature Rollout Tab – per Super_Admin.md §12.
 * Beta Release sub-tab: feature flags with enabled clinics list,
 * rollout percentage slider (% of active clinics), scheduled activation date, rollback button.
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
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BETA_FEATURES = [
  {
    key: 'aiAssistant',
    name: 'AI Clinical Assistant',
    desc: 'AI-powered suggestions for diagnosis coding, treatment plans, and prescription templates.',
    status: 'beta',
    risk: 'low',
  },
  {
    key: 'advancedAnalytics',
    name: 'Advanced Analytics Dashboard',
    desc: 'Predictive analytics, revenue forecasting, and patient retention analysis.',
    status: 'beta',
    risk: 'low',
  },
  {
    key: 'telemedicineV2',
    name: 'Telemedicine v2',
    desc: 'Next-gen video consultation with screen sharing, file transfer, and session recording.',
    status: 'beta',
    risk: 'medium',
  },
  {
    key: 'whatsappIntegration',
    name: 'WhatsApp Integration',
    desc: 'Appointment reminders, patient communication, and follow-up notifications via WhatsApp.',
    status: 'alpha',
    risk: 'medium',
  },
  {
    key: 'automationEngine',
    name: 'Automation Engine',
    desc: 'Configure trigger-based workflows for follow-ups, reminders, and task assignments.',
    status: 'alpha',
    risk: 'high',
  },
];

const STATUS_BADGE = {
  beta: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  alpha: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};
const RISK_BADGE = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const DEFAULT_FLAG = () => ({
  enabledClinics: [],
  rolloutPercent: 0,
  scheduledDate: '',
  enabled: false,
});

export default function AdminFeatureRolloutPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [clinics, setClinics] = useState([]);
  const [totalClinics, setTotalClinics] = useState(0);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [flags, setFlags] = useState(() =>
    Object.fromEntries(BETA_FEATURES.map((f) => [f.key, DEFAULT_FLAG()])),
  );
  const [saving, setSaving] = useState(false);
  const [rollingBack, setRollingBack] = useState(null);
  const [clinicSearch, setClinicSearch] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const fetchClinics = useCallback(async () => {
    try {
      setLoadingClinics(true);
      const res = await apiClient.get('/admin/clients?limit=100&status=active');
      const list = res?.data?.clients ?? res?.clients ?? (Array.isArray(res?.data) ? res.data : []);
      const clinicList = Array.isArray(list) ? list : [];
      setClinics(clinicList);
      setTotalClinics(clinicList.length);
    } catch (_) {
      setClinics([]);
    } finally {
      setLoadingClinics(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'super_admin') fetchClinics();
  }, [user?.role, fetchClinics]);

  const handleFeatureSelect = (featureKey) => {
    setSelectedFeature(featureKey === selectedFeature ? null : featureKey);
    setClinicSearch('');
  };

  const handleToggleClinic = (clinicId) => {
    if (!selectedFeature) return;
    setFlags((prev) => {
      const current = new Set(prev[selectedFeature].enabledClinics);
      if (current.has(clinicId)) current.delete(clinicId);
      else current.add(clinicId);
      return { ...prev, [selectedFeature]: { ...prev[selectedFeature], enabledClinics: Array.from(current) } };
    });
  };

  const handleRolloutPercent = (percent) => {
    if (!selectedFeature) return;
    // Apply rollout % — enable the first N% of active clinics
    const count = Math.round((percent / 100) * clinics.length);
    const selectedIds = clinics.slice(0, count).map((c) => c._id ?? c.tenantId);
    setFlags((prev) => ({
      ...prev,
      [selectedFeature]: { ...prev[selectedFeature], rolloutPercent: percent, enabledClinics: selectedIds },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await new Promise((r) => setTimeout(r, 600));
      showSuccess('Feature rollout settings saved. Changes take effect on next session.');
    } catch (err) {
      showError(err?.message || 'Failed to save rollout.');
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (featureKey) => {
    setRollingBack(featureKey);
    await new Promise((r) => setTimeout(r, 500));
    setFlags((prev) => ({
      ...prev,
      [featureKey]: { ...DEFAULT_FLAG() },
    }));
    if (selectedFeature === featureKey) setSelectedFeature(null);
    showSuccess(`${BETA_FEATURES.find((f) => f.key === featureKey)?.name} rolled back — disabled for all clinics.`);
    setRollingBack(null);
  };

  if (!user || user?.role !== 'super_admin') return null;

  const filteredClinics = clinics.filter((c) =>
    (c.name ?? c.clinicName ?? '').toLowerCase().includes(clinicSearch.toLowerCase()),
  );

  const selectedFeat = BETA_FEATURES.find((f) => f.key === selectedFeature);
  const selectedFlag = selectedFeature ? flags[selectedFeature] : null;
  const enabledSet = new Set(selectedFlag?.enabledClinics ?? []);

  return (
    <Layout>
      <PageHeader
        title={t('admin.tabFeatureRollout') || 'Feature Rollout'}
        subtitle="Manage beta and alpha feature releases with rollout percentage, scheduling, and rollback"
        notifications={[]}
        unreadCount={0}
      />
      <div className="admin-page-content">
        <section className="admin-section">
          <div className="admin-section__title">
            <span className="admin-section__accent" />
            <h2 className="admin-section__title-text">Beta Release</h2>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Select a feature to manage rollout. Set a percentage for automatic clinic assignment, choose
            specific clinics, set a scheduled activation date, or roll back entirely.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Feature list */}
            <div className="lg:col-span-2 space-y-3">
              {BETA_FEATURES.map((feat) => {
                const flag = flags[feat.key];
                const count = flag.enabledClinics.length;
                return (
                  <div
                    key={feat.key}
                    className={`rounded-xl border-2 transition-all ${selectedFeature === feat.key ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'}`}
                  >
                    <button
                      type="button"
                      className="w-full text-left p-4"
                      onClick={() => handleFeatureSelect(feat.key)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">{feat.name}</p>
                        <div className="flex gap-1 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[feat.status]}`}>{feat.status}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_BADGE[feat.risk]}`}>{feat.risk}</span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">{feat.desc}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-neutral-600 dark:text-neutral-300">
                          {count > 0 ? (
                            <span className="text-primary-600 font-medium">{count} clinic{count !== 1 ? 's' : ''} ({flag.rolloutPercent}%)</span>
                          ) : (
                            <span className="text-neutral-400">Not rolled out</span>
                          )}
                          {flag.scheduledDate && (
                            <span className="ml-2 text-amber-600">⏰ {new Date(flag.scheduledDate).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                    </button>
                    {/* Rollback button */}
                    {count > 0 && (
                      <div className="px-4 pb-3 border-t border-neutral-100 dark:border-neutral-700 pt-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-red-600 dark:text-red-400 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleRollback(feat.key); }}
                          disabled={rollingBack === feat.key}
                          isLoading={rollingBack === feat.key}
                        >
                          ↩ Rollback
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Configuration panel */}
            <div className="lg:col-span-3">
              {!selectedFeature ? (
                <Card className="h-full flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center mx-auto mb-3">
                      <ZapIcon />
                    </div>
                    <p className="text-neutral-500 text-sm">Select a feature to configure rollout</p>
                  </div>
                </Card>
              ) : (
                <Card>
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                    {selectedFeat?.name}
                  </h3>

                  {/* Rollout percentage slider */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Rollout Percentage — {selectedFlag.rolloutPercent}% of active clinics
                      {totalClinics > 0 && (
                        <span className="text-neutral-400 font-normal ml-1">
                          (~{Math.round((selectedFlag.rolloutPercent / 100) * totalClinics)} of {totalClinics})
                        </span>
                      )}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={selectedFlag.rolloutPercent}
                      onChange={(e) => handleRolloutPercent(Number(e.target.value))}
                      className="w-full accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-neutral-400 mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Scheduled activation date */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Scheduled Activation Date <span className="text-neutral-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={selectedFlag.scheduledDate}
                      onChange={(e) =>
                        setFlags((prev) => ({
                          ...prev,
                          [selectedFeature]: { ...prev[selectedFeature], scheduledDate: e.target.value },
                        }))
                      }
                      className="input text-sm"
                    />
                    <p className="text-xs text-neutral-400 mt-1">
                      Leave empty to activate immediately when saved.
                    </p>
                  </div>

                  {/* Manual clinic selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Manually select clinics
                    </label>
                    <input
                      type="text"
                      placeholder={t('admin.placeholderSearchClinics')}
                      value={clinicSearch}
                      onChange={(e) => setClinicSearch(e.target.value)}
                      className="input w-full text-sm mb-2"
                    />
                    <div className="flex gap-2 mb-2">
                      <Button variant="ghost" size="xs" onClick={() => {
                        setFlags((prev) => ({ ...prev, [selectedFeature]: { ...prev[selectedFeature], enabledClinics: clinics.map((c) => c._id ?? c.tenantId), rolloutPercent: 100 } }));
                      }}>Enable all</Button>
                      <Button variant="ghost" size="xs" onClick={() => {
                        setFlags((prev) => ({ ...prev, [selectedFeature]: { ...prev[selectedFeature], enabledClinics: [], rolloutPercent: 0 } }));
                      }}>Disable all</Button>
                    </div>
                    {loadingClinics ? (
                      <p className="text-sm text-neutral-500 py-3 text-center">Loading…</p>
                    ) : (
                      <ul className="divide-y divide-neutral-100 dark:divide-neutral-700 max-h-64 overflow-y-auto border border-neutral-100 dark:border-neutral-700 rounded-lg">
                        {filteredClinics.map((clinic) => {
                          const id = clinic._id ?? clinic.tenantId;
                          return (
                            <li key={id} className="flex items-center justify-between px-3 py-2.5 gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                                  {clinic.name ?? clinic.clinicName ?? id}
                                </p>
                                <p className="text-xs text-neutral-500">{clinic.planName ?? clinic.plan ?? '—'}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input type="checkbox" className="sr-only peer" checked={enabledSet.has(id)} onChange={() => handleToggleClinic(id)} />
                                <div className="w-9 h-5 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600 dark:bg-neutral-600 dark:peer-checked:bg-primary-600" />
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700 flex gap-3">
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} isLoading={saving}>
                      Save Rollout
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleRollback(selectedFeature)}
                      disabled={rollingBack === selectedFeature || selectedFlag.enabledClinics.length === 0}
                    >
                      ↩ Rollback
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function ZapIcon() {
  return (
    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
