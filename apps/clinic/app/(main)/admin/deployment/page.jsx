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
    showSuccess(t('admin.deploymentTemplateSaved'));
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
            {t('admin.deploymentTabTemplates')}
          </button>
          <button
            type="button"
            className={activeTab === 'moduleAssignment' ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS}
            onClick={() => setActiveTab('moduleAssignment')}
          >
            {t('admin.deploymentTabModuleAssignment')}
          </button>
        </div>

        {activeTab === 'templates' && (
          <>
            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">{t('admin.deploymentClinicSetupTemplates')}</h2>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                {t('admin.deploymentTemplatesIntro')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {DEPLOYMENT_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedTemplate === tpl.id
                        ? 'border-primary-600 bg-primary-50 text-neutral-800 dark:bg-neutral-600 dark:border-primary-400 dark:ring-2 dark:ring-primary-400 dark:ring-offset-2 dark:ring-offset-neutral-900 dark:!text-white'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <p className={`font-semibold mb-1 ${selectedTemplate === tpl.id ? 'text-neutral-800 dark:!text-white' : 'text-neutral-800 dark:text-neutral-200'}`}>
                      {t(`admin.deploymentTemplate${tpl.id.charAt(0).toUpperCase() + tpl.id.slice(1)}`)}
                    </p>
                    <p className={`text-sm mb-2 ${selectedTemplate === tpl.id ? 'text-neutral-600 dark:!text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'}`}>
                      {t(`admin.deploymentTemplate${tpl.id.charAt(0).toUpperCase() + tpl.id.slice(1)}Desc`)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tpl.modules.slice(0, 4).map((m) => (
                        <span
                          key={m}
                          className={`text-xs px-1.5 py-0.5 rounded ${selectedTemplate === tpl.id ? 'bg-neutral-500/80 dark:bg-neutral-500 dark:!text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}`}
                        >
                          {t(`admin.deploymentModule${((DEFAULT_MODULES.find((dm) => dm.key === m)?.key ?? m).charAt(0).toUpperCase() + (DEFAULT_MODULES.find((dm) => dm.key === m)?.key ?? m).slice(1))}`)}
                        </span>
                      ))}
                      {tpl.modules.length > 4 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${selectedTemplate === tpl.id ? 'bg-neutral-500/80 dark:bg-neutral-500 dark:!text-white' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'}`}>
                          +{tpl.modules.length - 4} {t('admin.deploymentMore')}
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
                <h2 className="admin-section__title-text">{t('admin.deploymentTemplateConfig')}</h2>
              </div>
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {t('admin.deploymentDefaultWorkflow')}
                    </label>
                    <select
                      value={workflowTemplate}
                      onChange={(e) => setWorkflowTemplate(e.target.value)}
                      className="input w-full"
                    >
                      <option value="standard">{t('admin.deploymentWorkflowStandard')}</option>
                      <option value="soap">{t('admin.deploymentWorkflowSoap')}</option>
                      <option value="procedure">{t('admin.deploymentWorkflowProcedure')}</option>
                      <option value="minimal">{t('admin.deploymentWorkflowMinimal')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {t('admin.deploymentClinicType')}
                    </label>
                    <select
                      value={clinicType}
                      onChange={(e) => setClinicType(e.target.value)}
                      className="input w-full"
                    >
                      {CLINIC_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {t(`admin.deploymentClinicType${ct.value === 'multiLocation' ? 'Multi' : ct.value.charAt(0).toUpperCase() + ct.value.slice(1)}`)}
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
                    {t('admin.deploymentSaveTemplate')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/admin/clients')}
                  >
                    {t('admin.deploymentApplyToClinic')}
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
                <h2 className="admin-section__title-text">{t('admin.deploymentDefaultModuleAssignment')}</h2>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                {t('admin.deploymentModuleIntro')}
              </p>
              <Card>
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-700" role="list">
                  {DEFAULT_MODULES.map((mod) => (
                    <li key={mod.key} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {t(`admin.deploymentModule${mod.key.charAt(0).toUpperCase() + mod.key.slice(1)}`)}
                        </span>
                        {mod.locked && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-500">
                            {t('admin.deploymentRequired')}
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
                <h2 className="admin-section__title-text">{t('admin.deploymentDefaultRoleStructure')}</h2>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                {t('admin.deploymentRoleIntro')}
              </p>
              <Card>
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-700" role="list">
                  {DEFAULT_ROLE_STRUCTURE.map((role) => (
                    <li key={role.key} className="flex items-center justify-between py-3 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {t(`admin.deploymentRole${role.key.charAt(0).toUpperCase() + role.key.slice(1)}`)}
                        </span>
                        {role.locked && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-500">
                            {t('admin.deploymentRequired')}
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
                    {t('admin.deploymentSaveAssignments')}
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
