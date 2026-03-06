'use client';

/**
 * Role Management Tab – Internal admin roles per Super_Admin.md §11.
 * Predefined internal roles: Super Admin, Billing Admin, Support Agent, Read-Only Auditor.
 * Roles tab: view/create internal roles, clone from existing.
 * Permissions tab: Section × Action matrix (View/Edit/Delete/Override).
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

/** Internal admin platform roles per Super_Admin.md §11 */
const INTERNAL_ROLES = [
  {
    key: 'super_admin',
    name: 'Super Admin',
    desc: 'Full access to all sections — clinics, subscriptions, users, audit, emergency controls.',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    locked: true,
    access: { clinics: 'Full', subscriptions: 'Full', users: 'Full', audit: 'Full', analytics: 'Full', support: 'Full', data: 'Full', roles: 'Full', security: 'Full', emergency: 'Full', notifications: 'Full' },
  },
  {
    key: 'billing_admin',
    name: 'Billing Admin',
    desc: 'Subscriptions & Billing (full), Clinic list (read-only). No access to clinical data, emergency, or user governance.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    locked: true,
    access: { clinics: 'Read', subscriptions: 'Full', users: 'None', audit: 'Read', analytics: 'Read', support: 'None', data: 'None', roles: 'None', security: 'None', emergency: 'None', notifications: 'Read' },
  },
  {
    key: 'support_agent',
    name: 'Support Agent',
    desc: 'Clinic profile (read-only), Support Mode, Users (read). Cannot modify subscriptions, data, or security settings.',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    locked: true,
    access: { clinics: 'Read', subscriptions: 'None', users: 'Read', audit: 'Read', analytics: 'None', support: 'Full', data: 'None', roles: 'None', security: 'None', emergency: 'None', notifications: 'None' },
  },
  {
    key: 'readonly_auditor',
    name: 'Read-Only Auditor',
    desc: 'Audit logs and Analytics — read-only access only. No write operations or interventions allowed.',
    color: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
    locked: true,
    access: { clinics: 'None', subscriptions: 'None', users: 'None', audit: 'Read', analytics: 'Read', support: 'None', data: 'None', roles: 'None', security: 'None', emergency: 'None', notifications: 'None' },
  },
];

const PERMISSION_SECTIONS = [
  { key: 'clinics', label: 'Clinic Management' },
  { key: 'subscriptions', label: 'Subscription & Billing' },
  { key: 'users', label: 'User Governance' },
  { key: 'audit', label: 'Audit & Compliance' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'support', label: 'Support Intervention' },
  { key: 'data', label: 'Data Management' },
  { key: 'roles', label: 'Role Management' },
  { key: 'security', label: 'Security Settings' },
  { key: 'emergency', label: 'Emergency Control' },
  { key: 'notifications', label: 'Notifications' },
];

const ACCESS_BADGE = {
  Full: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Read: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  None: 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500',
};

const ACTIVE_TAB = 'px-4 py-2 text-sm font-medium rounded-md bg-primary-600 text-white';
const INACTIVE_TAB = 'px-4 py-2 text-sm font-medium rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700';

export default function AdminRoleManagementPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('roles');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [cloneFrom, setCloneFrom] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    showSuccess(`Role "${newRoleName}" created (feature coming in next release).`);
    setShowCreateForm(false);
    setNewRoleName('');
    setNewRoleDesc('');
    setCloneFrom('');
  };

  if (!user || user?.role !== 'super_admin') return null;

  return (
    <Layout>
      <PageHeader
        title={t('admin.tabRoleManagement') || 'Role Management'}
        subtitle="Manage internal platform admin roles and their section-level permissions"
        notifications={[]}
        unreadCount={0}
      />
      <div className="admin-page-content">
        <div className="flex gap-2 mb-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-fit">
          <button type="button" className={activeTab === 'roles' ? ACTIVE_TAB : INACTIVE_TAB} onClick={() => setActiveTab('roles')}>
            Roles
          </button>
          <button type="button" className={activeTab === 'permissions' ? ACTIVE_TAB : INACTIVE_TAB} onClick={() => setActiveTab('permissions')}>
            Permissions
          </button>
        </div>

        {activeTab === 'roles' && (
          <>
            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Predefined Internal Roles</h2>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                These are the built-in platform admin roles. They cannot be deleted or modified.
                Assign these roles to internal team members via User Governance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {INTERNAL_ROLES.map((role) => (
                  <Card key={role.key}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 mt-0.5 ${role.color}`}>
                        {role.name}
                      </span>
                      {role.locked && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-500 flex items-center gap-1 shrink-0">
                          <LockIcon /> System
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {role.desc}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(role.access)
                        .filter(([, v]) => v !== 'None')
                        .map(([k, v]) => (
                          <span key={k} className={`text-xs px-2 py-0.5 rounded font-medium ${ACCESS_BADGE[v]}`}>
                            {PERMISSION_SECTIONS.find((s) => s.key === k)?.label ?? k}
                            {v === 'Read' && ' (read)'}
                          </span>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-50 dark:border-neutral-700">
                      <Button variant="ghost" size="xs" onClick={() => router.push('/admin/users')} className="text-xs text-primary-600">
                        Assign to users →
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section__title">
                <span className="admin-section__accent" />
                <h2 className="admin-section__title-text">Custom Internal Roles</h2>
              </div>
              {!showCreateForm ? (
                <Card>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    Create a custom internal role by cloning an existing role and adjusting its
                    permissions. Custom roles cannot have more permissions than your own role.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
                    + Create Custom Role
                  </Button>
                </Card>
              ) : (
                <Card>
                  <h3 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
                    New Custom Role
                  </h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Clone from <span className="text-neutral-400">(optional)</span>
                      </label>
                      <select
                        value={cloneFrom}
                        onChange={(e) => setCloneFrom(e.target.value)}
                        className="input w-full"
                      >
                        <option value="">Start from scratch</option>
                        {INTERNAL_ROLES.map((r) => (
                          <option key={r.key} value={r.key}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Role name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder={t('admin.placeholderRoleName')}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                        placeholder={t('admin.placeholderRoleDescription')}
                        rows={2}
                        className="input w-full resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="primary" size="sm" onClick={handleCreateRole} disabled={!newRoleName.trim() || saving} isLoading={saving}>
                        Create Role
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </section>
          </>
        )}

        {activeTab === 'permissions' && (
          <section className="admin-section">
            <div className="admin-section__title">
              <span className="admin-section__accent" />
              <h2 className="admin-section__title-text">Permission Matrix</h2>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Section-level access per internal admin role. Admins cannot create roles with more
              permissions than their own. Legend: <strong>Full</strong> = View + Edit + Delete + Override;{' '}
              <strong>Read</strong> = View only; <strong>—</strong> = No access.
            </p>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-700">
                      <th className="text-left py-3 pr-4 font-medium text-neutral-600 dark:text-neutral-400 w-1/3">Section</th>
                      {INTERNAL_ROLES.map((r) => (
                        <th key={r.key} className="text-center py-3 px-2 font-medium text-neutral-600 dark:text-neutral-400 min-w-[120px]">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${r.color}`}>
                            {r.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                    {PERMISSION_SECTIONS.map((sec) => (
                      <tr key={sec.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="py-2.5 pr-4 text-neutral-700 dark:text-neutral-300 font-medium">
                          {sec.label}
                        </td>
                        {INTERNAL_ROLES.map((r) => {
                          const access = r.access[sec.key] ?? 'None';
                          return (
                            <td key={r.key} className="py-2.5 px-2 text-center">
                              {access === 'None' ? (
                                <span className="text-neutral-300 dark:text-neutral-600 text-xs">—</span>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACCESS_BADGE[access]}`}>
                                  {access}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-neutral-400 mt-4">
                This matrix shows default access levels. Custom roles can be configured with
                granular View / Edit / Delete / Override permissions per section.
              </p>
            </Card>
          </section>
        )}
      </div>
    </Layout>
  );
}

function LockIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}
