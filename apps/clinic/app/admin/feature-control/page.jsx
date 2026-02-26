'use client';

/**
 * Feature Control Tab – Toggle matrix per Super_Admin.md §5.
 * Modules tab: Clinics (rows) × Feature Modules (columns) — toggle per clinic.
 * Plan Mapping tab: Define which modules are in each plan.
 * Toggle changes: optimistic UI + rollback on error.
 * Super Admin only; no clinical data access.
 */

import { AdminToolbar } from '@/components/admin/AdminToolbar';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { apiClient } from '@/lib/api/client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const MODULES = [
  { key: 'diagnostics', label: 'Diagnostics', plans: ['Pro', 'Enterprise'] },
  { key: 'pharmacy', label: 'Pharmacy', plans: ['Enterprise'] },
  { key: 'procedures', label: 'Procedures', plans: ['Pro', 'Enterprise'] },
  { key: 'chronicCare', label: 'Chronic Care', plans: ['Enterprise'] },
  { key: 'automation', label: 'Automation', plans: ['Enterprise'] },
  { key: 'multiLocation', label: 'Multi-location', plans: ['Pro', 'Enterprise'] },
];

const PLAN_FEATURE_MAP = [
  { feature: 'Appointments & Scheduling', core: true, pro: true, enterprise: true },
  { feature: 'SOAP Notes & Clinical Records', core: true, pro: true, enterprise: true },
  { feature: 'Prescriptions', core: true, pro: true, enterprise: true },
  { feature: 'Billing & Invoicing', core: true, pro: true, enterprise: true },
  { feature: 'Basic Inventory', core: true, pro: true, enterprise: true },
  { feature: 'Video Consultation', core: true, pro: true, enterprise: true },
  { feature: 'Audit Logs', core: true, pro: true, enterprise: true },
  { feature: 'Diagnostics', core: false, pro: true, enterprise: true },
  { feature: 'Procedures', core: false, pro: true, enterprise: true },
  { feature: 'Multi-location (2 locations)', core: false, pro: true, enterprise: true },
  { feature: 'Referrals & Shared Case Access', core: false, pro: true, enterprise: true },
  { feature: 'Pharmacy Management', core: false, pro: false, enterprise: true },
  { feature: 'Chronic Care Plans', core: false, pro: false, enterprise: true },
  { feature: 'Automation & Workflows', core: false, pro: false, enterprise: true },
  { feature: 'Multi-location (unlimited)', core: false, pro: false, enterprise: true },
  { feature: 'Custom Integrations & API', core: false, pro: false, enterprise: true },
];

const ACTIVE_TAB = 'px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white';
const INACTIVE_TAB =
  'px-4 py-2 text-sm font-medium rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700';

export default function AdminFeatureControlPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('modules');
  const [clinics, setClinics] = useState([]);
  const [clinicFeatures, setClinicFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // { clinicId, moduleKey }
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const fetchData = useCallback(async () => {
    if (user?.role !== 'super_admin') return;
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/clients?limit=100');
      const list = res?.data?.clients ?? res?.clients ?? (Array.isArray(res?.data) ? res.data : []);
      const clinicList = Array.isArray(list) ? list : [];
      setClinics(clinicList);
      // Build initial feature state from clinic data
      const initial = {};
      clinicList.forEach((c) => {
        const id = c._id ?? c.tenantId;
        initial[id] = {};
        MODULES.forEach((m) => {
          initial[id][m.key] = c.enabledModules?.[m.key] ?? c.features?.[m.key] ?? false;
        });
      });
      setClinicFeatures(initial);
    } catch (_) {
      setClinics([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === 'super_admin') fetchData();
  }, [user?.role, fetchData]);

  const handleToggle = async (clinicId, moduleKey) => {
    const current = clinicFeatures[clinicId]?.[moduleKey] ?? false;
    const newVal = !current;
    // Optimistic update
    setClinicFeatures((prev) => ({
      ...prev,
      [clinicId]: { ...prev[clinicId], [moduleKey]: newVal },
    }));
    setSaving({ clinicId, moduleKey });
    try {
      const res = await apiClient.put(`/admin/clients/${clinicId}`, {
        enabledModules: { ...clinicFeatures[clinicId], [moduleKey]: newVal },
      });
      if (!res?.success) {
        // Rollback
        setClinicFeatures((prev) => ({
          ...prev,
          [clinicId]: { ...prev[clinicId], [moduleKey]: current },
        }));
        showError(res?.error?.message || 'Failed to update module.');
      } else {
        showSuccess(`${moduleKey} ${newVal ? 'enabled' : 'disabled'} for clinic.`);
      }
    } catch (err) {
      // Rollback
      setClinicFeatures((prev) => ({
        ...prev,
        [clinicId]: { ...prev[clinicId], [moduleKey]: current },
      }));
      showError(err?.message || 'Failed to update module.');
    } finally {
      setSaving(null);
    }
  };

  if (!user || user?.role !== 'super_admin') return null;

  const filteredClinics = clinics.filter((c) =>
    (c.name ?? c.clinicName ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Layout>
      <PageHeader
        title={t('admin.tabFeatureControl') || 'Feature Control'}
        subtitle='Enable or disable platform modules per clinic, and manage plan-to-feature mapping'
        notifications={[]}
        unreadCount={0}
      />
      <div className='admin-page-content'>
        <div className='flex gap-2 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-fit'>
          <button
            type='button'
            className={activeTab === 'modules' ? ACTIVE_TAB : INACTIVE_TAB}
            onClick={() => setActiveTab('modules')}
          >
            Modules
          </button>
          <button
            type='button'
            className={activeTab === 'planMapping' ? ACTIVE_TAB : INACTIVE_TAB}
            onClick={() => setActiveTab('planMapping')}
          >
            Plan Mapping
          </button>
        </div>

        <section className={activeTab === 'modules' ? 'admin-section' : 'hidden'}>
          <div className='admin-section__title'>
            <span className='admin-section__accent' />
            <h2 className='admin-section__title-text'>Module Toggle Matrix</h2>
          </div>
          <p className='text-sm text-neutral-500 dark:text-neutral-400 mb-4'>
            Toggle modules per clinic. Changes are immediate with optimistic UI rollback on error.
            Module availability also depends on the clinic's subscription plan.
          </p>
          <AdminToolbar
            searchValue={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            searchPlaceholder='Search clinics…'
            searchAriaLabel='Search clinics'
            filters={[]}
          />
          {loading ? (
            <Card>
              <p className='text-sm text-neutral-500 py-8 text-center'>Loading clinics…</p>
            </Card>
          ) : filteredClinics.length === 0 ? (
            <Card>
              <p className='text-sm text-neutral-500 py-8 text-center'>
                {searchTerm ? 'No clinics match your search.' : 'No clinics found.'}
              </p>
            </Card>
          ) : (
            <Card>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-neutral-100 dark:border-neutral-700'>
                      <th className='text-left py-3 pr-4 font-medium text-neutral-600 dark:text-neutral-400 min-w-[180px] sticky left-0 bg-white dark:bg-neutral-800 z-10'>
                        Clinic
                      </th>
                      {MODULES.map((m) => (
                        <th
                          key={m.key}
                          className='text-center py-3 px-3 font-medium text-neutral-600 dark:text-neutral-400 min-w-[110px]'
                        >
                          <div className='flex flex-col items-center gap-1.5'>
                            <span>{m.label}</span>
                            <div className='flex gap-1 flex-wrap justify-center'>
                              {m.plans.map((p) => (
                                <span
                                  key={p}
                                  className='text-body-xs font-medium px-2 py-0.5 rounded bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200 border border-primary-200/60 dark:border-primary-700/50'
                                >
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-neutral-50 dark:divide-neutral-800'>
                    {filteredClinics.map((clinic) => {
                      const id = clinic._id ?? clinic.tenantId;
                      return (
                        <tr key={id} className='hover:bg-neutral-50 dark:hover:bg-neutral-800/50'>
                          <td className='py-3 pr-4 sticky left-0 bg-white dark:bg-neutral-800 z-10'>
                            <p className='font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[170px]'>
                              {clinic.name ?? clinic.clinicName ?? id}
                            </p>
                            <p className='text-body-xs text-neutral-600 dark:text-neutral-400 mt-0.5'>
                              {clinic.planName ?? clinic.plan ?? '—'}
                            </p>
                          </td>
                          {MODULES.map((m) => {
                            const enabled = clinicFeatures[id]?.[m.key] ?? false;
                            const isSaving = saving?.clinicId === id && saving?.moduleKey === m.key;
                            return (
                              <td key={m.key} className='py-3 px-3 text-center'>
                                <label className='relative inline-flex items-center cursor-pointer'>
                                  <input
                                    type='checkbox'
                                    className='sr-only peer'
                                    checked={enabled}
                                    disabled={isSaving}
                                    onChange={() => handleToggle(id, m.key)}
                                    aria-label={`${m.label} for ${clinic.name ?? id}`}
                                  />
                                  <div
                                    className={`w-9 h-5 rounded-full border border-neutral-300 dark:border-neutral-500 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-0 after:rounded-full after:h-3.5 after:w-3.5 after:shadow-sm after:transition-all peer-checked:bg-primary-600 peer-checked:border-primary-600 peer-focus:ring-2 peer-focus:ring-primary-300 ${isSaving ? 'opacity-50 cursor-wait' : 'bg-neutral-200 dark:bg-neutral-600'}`}
                                  />
                                </label>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className='text-body-xs text-neutral-500 dark:text-neutral-400 mt-4'>
                {filteredClinics.length} clinic{filteredClinics.length !== 1 ? 's' : ''} shown. Some
                modules require a matching plan tier to become active.
              </p>
            </Card>
          )}
        </section>

        <section className={activeTab === 'planMapping' ? 'admin-section' : 'hidden'}>
          <div className='admin-section__title'>
            <span className='admin-section__accent' />
            <h2 className='admin-section__title-text'>Plan Mapping</h2>
          </div>
          <p className='text-sm text-neutral-500 dark:text-neutral-400 mb-4'>
            Feature availability by subscription plan. Changes to plan mapping affect all future
            assignments — not retroactive. To adjust plans, go to{' '}
            <button
              type='button'
              className='text-primary-600 hover:underline'
              onClick={() => router.push('/admin/subscriptions')}
            >
              Subscription &amp; Billing
            </button>
            .
          </p>
          <Card>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b border-neutral-100 dark:border-neutral-700'>
                    <th className='text-left py-3 pr-4 font-medium text-neutral-600 dark:text-neutral-400 w-1/2'>
                      Feature
                    </th>
                    <th className='text-center py-3 px-3 font-medium text-neutral-600 dark:text-neutral-400'>
                      Core
                    </th>
                    <th className='text-center py-3 px-3 font-medium text-neutral-600 dark:text-neutral-400'>
                      Pro
                    </th>
                    <th className='text-center py-3 px-3 font-medium text-neutral-600 dark:text-neutral-400'>
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-neutral-50 dark:divide-neutral-800'>
                  {PLAN_FEATURE_MAP.map((row) => (
                    <tr
                      key={row.feature}
                      className='hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    >
                      <td className='py-2.5 pr-4 text-neutral-800 dark:text-neutral-200'>
                        {row.feature}
                      </td>
                      <td className='py-2.5 px-3 text-center'>
                        {row.core ? <CheckIcon /> : <DashIcon />}
                      </td>
                      <td className='py-2.5 px-3 text-center'>
                        {row.pro ? <CheckIcon /> : <DashIcon />}
                      </td>
                      <td className='py-2.5 px-3 text-center'>
                        {row.enterprise ? <CheckIcon /> : <DashIcon />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className='text-xs text-neutral-400 mt-4'>
              Plan mapping changes affect all future clinic assignments. Existing clinics are not
              retroactively updated.
            </p>
          </Card>
        </section>
      </div>
    </Layout>
  );
}

function CheckIcon() {
  return (
    <svg
      className='inline-block w-4 h-4 text-green-600 dark:text-green-400'
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
    >
      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
    </svg>
  );
}

function DashIcon() {
  return <span className='text-neutral-300 dark:text-neutral-600'>—</span>;
}
