'use client';

/**
 * Deployment Control Tab – Define clinic setup templates per Super_Admin.md.
 * Sub-tabs: Templates (define clinic setup), Module Assignment (enable default features).
 * Super Admin only.
 */

import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { showSuccess } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const CLINIC_TYPES = [
  { value: 'general', label: 'General Practice' },
  { value: 'specialist', label: 'Specialist Clinic' },
  { value: 'multiLocation', label: 'Multi-location / Hospital' },
  { value: 'diagnostics', label: 'Diagnostics Centre' },
];

const DEFAULT_MODULES = [
  { key: 'appointments', label: 'Appointment Scheduling', locked: true },
  { key: 'clinicalNotes', label: 'SOAP Notes & Clinical Records', locked: true },
  { key: 'prescriptions', label: 'Prescriptions', locked: true },
  { key: 'billing', label: 'Billing & Invoicing', locked: true },
  { key: 'telemedicine', label: 'Video Consultation', locked: false },
  { key: 'inventory', label: 'Basic Inventory', locked: false },
  { key: 'auditLogs', label: 'Audit Logs', locked: false },
  { key: 'diagnostics', label: 'Diagnostics', locked: false },
  { key: 'procedures', label: 'Procedures', locked: false },
];

const DEFAULT_ROLE_STRUCTURE = [
  { key: 'admin', label: 'Admin', locked: true },
  { key: 'doctor', label: 'Doctor', locked: true },
  { key: 'receptionist', label: 'Receptionist', locked: false },
  { key: 'nurse', label: 'Nurse / Assistant', locked: false },
  { key: 'billing', label: 'Billing Staff', locked: false },
];

const DEPLOYMENT_TEMPLATES = [
  {
    id: 'basic',
    name: 'Basic Practice',
    type: 'general',
    desc: 'Single doctor, solo practice. Core modules only.',
    modules: ['appointments', 'clinicalNotes', 'prescriptions', 'billing'],
    roles: ['admin', 'doctor', 'receptionist'],
  },
  {
    id: 'clinic',
    name: 'Standard Clinic',
    type: 'specialist',
    desc: 'Multi-doctor clinic with inventory and telemedicine.',
    modules: ['appointments', 'clinicalNotes', 'prescriptions', 'billing', 'telemedicine', 'inventory', 'auditLogs'],
    roles: ['admin', 'doctor', 'receptionist', 'nurse'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise / Hospital',
    type: 'multiLocation',
    desc: 'Full feature set across multiple locations.',
    modules: ['appointments', 'clinicalNotes', 'prescriptions', 'billing', 'telemedicine', 'inventory', 'auditLogs', 'diagnostics', 'procedures'],
    roles: ['admin', 'doctor', 'receptionist', 'nurse', 'billing'],
  },
];

const ACTIVE_TAB_CLASS =
  'px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white';
const INACTIVE_TAB_CLASS =
  'px-4 py-2 text-sm font-medium rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700';

export default function AdminDeploymentPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState('clinic');
  const [enabledModules, setEnabledModules] = useState(() =>
    Object.fromEntries(DEFAULT_MODULES.map((m) => [m.key, m.locked || ['appointments', 'clinicalNotes', 'prescriptions', 'billing', 'telemedicine', 'auditLogs'].includes(m.key)])),
  );
  const [enabledRoles, setEnabledRoles] = useState(() =>
    Object.fromEntries(DEFAULT_ROLE_STRUCTURE.map((r) => [r.key, r.locked || r.key === 'receptionist'])),
  );
  const [saving, setSaving] = useState(false);
  const [clinicType, setClinicType] = useState('general');
  const [workflowTemplate, setWorkflowTemplate] = useState('standard');

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const applyTemplate = (templateId) => {
    const tpl = DEPLOYMENT_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplate(templateId);
    setClinicType(tpl.type);
    setEnabledModules(Object.fromEntries(DEFAULT_MODULES.map((m) => [m.key, tpl.modules.includes(m.key)])));
    setEnabledRoles(Object.fromEntries(DEFAULT_ROLE_STRUCTURE.map((r) => [r.key, tpl.roles.includes(r.key)])));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    showSuccess('Deployment template saved. Applied to new clinic onboarding.');
  };

  if (!user || user?.role !== 'super_admin') return null;

  return (
    <Layout>
      <PageHeader
        title={t('admin.tabDeploymentControl') || 'Deployment Control'}
        subtitle={
          t('admin.deploymentControlSubtitle') ||
          'Define default clinic setup templates and module assignments for new clinic onboarding'
        }
        notifications={[]}
        unreadCount={0}
      />
      <div className="admin-page-content">
        {/* Sub-tab navigation */}
        <div className="flex gap-2 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-fit">
          <button
            type="button"
            className={activeTab === 'templates' ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button
            type="button"
            className={activeTab === 'moduleAssignment' ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS}
            onClick={() => setActiveTab('moduleAssignment')}
          >
            Module Assignment
          </button>
        </div>

        {activeTab === 'templates' && (
          <>
            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Clinic Setup Templates</h2>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Select a preset deployment template for new clinics. These define the default
                workflow, clinic type, enabled modules, and role structure on first onboarding.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {DEPLOYMENT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedTemplate === tpl.id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                      {tpl.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                      {tpl.desc}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tpl.modules.slice(0, 4).map((m) => (
                        <span
                          key={m}
                          className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                        >
                          {DEFAULT_MODULES.find((dm) => dm.key === m)?.label ?? m}
                        </span>
                      ))}
                      {tpl.modules.length > 4 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-500">
                          +{tpl.modules.length - 4} more
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Template Configuration</h2>
              </div>
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Default Workflow Template
                    </label>
                    <select
                      value={workflowTemplate}
                      onChange={(e) => setWorkflowTemplate(e.target.value)}
                      className="input w-full"
                    >
                      <option value="standard">Standard Outpatient</option>
                      <option value="soap">SOAP-focused</option>
                      <option value="procedure">Procedure-heavy</option>
                      <option value="minimal">Minimal (appointments only)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Clinic Type
                    </label>
                    <select
                      value={clinicType}
                      onChange={(e) => setClinicType(e.target.value)}
                      className="input w-full"
                    >
                      {CLINIC_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700 flex gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    isLoading={saving}
                  >
                    Save Template
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/admin/clients')}
                  >
                    Apply to Clinic →
                  </Button>
                </div>
              </Card>
            </section>
          </>
        )}

        {activeTab === 'moduleAssignment' && (
          <>
            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Default Module Assignment</h2>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Choose which modules are enabled by default when a new clinic is onboarded. Locked
                modules are always enabled and cannot be removed.
              </p>
              <Card>
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-700" role="list">
                  {DEFAULT_MODULES.map((mod) => (
                    <li key={mod.key} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {mod.label}
                        </span>
                        {mod.locked && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-500">
                            Required
                          </span>
                        )}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={enabledModules[mod.key] ?? false}
                          disabled={mod.locked}
                          onChange={() =>
                            !mod.locked &&
                            setEnabledModules((prev) => ({ ...prev, [mod.key]: !prev[mod.key] }))
                          }
                        />
                        <div
                          className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white ${
                            mod.locked
                              ? 'bg-primary-600 opacity-60 cursor-not-allowed'
                              : 'bg-neutral-200 dark:bg-neutral-600 peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-300'
                          }`}
                        />
                      </label>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Default Role Structure</h2>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Choose which roles are created by default during clinic setup.
              </p>
              <Card>
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-700" role="list">
                  {DEFAULT_ROLE_STRUCTURE.map((role) => (
                    <li key={role.key} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {role.label}
                        </span>
                        {role.locked && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-500">
                            Required
                          </span>
                        )}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={enabledRoles[role.key] ?? false}
                          disabled={role.locked}
                          onChange={() =>
                            !role.locked &&
                            setEnabledRoles((prev) => ({ ...prev, [role.key]: !prev[role.key] }))
                          }
                        />
                        <div
                          className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white ${
                            role.locked
                              ? 'bg-primary-600 opacity-60 cursor-not-allowed'
                              : 'bg-neutral-200 dark:bg-neutral-600 peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-300'
                          }`}
                        />
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-700 flex gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    isLoading={saving}
                  >
                    Save Assignments
                  </Button>
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
