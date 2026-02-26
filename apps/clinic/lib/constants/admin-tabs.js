/**
 * Super Admin Dashboard – 15-tab structure.
 * Used by AdminTabNav and Sidebar for consistent navigation.
 * Principle: Platform, Access, Plans, Features – no editing of consultation/prescription/clinical records.
 * First ADMIN_PRIMARY_TABS are shown in the bar; rest in "More" dropdown for a cleaner look.
 */
export const ADMIN_PRIMARY_TABS = 8;

/** Icon key per tab – Sidebar maps these to icon components. */
export const ADMIN_TAB_ICONS = {
  overview: 'LayoutDashboard',
  clinicManagement: 'Building2',
  subscriptionBilling: 'CreditCard',
  userGovernance: 'Users',
  featureControl: 'Zap',
  deploymentControl: 'Settings',
  analytics: 'BarChart2',
  auditCompliance: 'RefreshCw',
  supportIntervention: 'Chat',
  dataManagement: 'Document',
  roleManagement: 'UserIcon',
  featureRollout: 'Star',
  security: 'Shield',
  emergencyControl: 'Warning',
  notifications: 'Bell',
};

export const ADMIN_TABS = [
  { path: '/admin', labelKey: 'admin.tabOverview', exact: true, iconKey: 'overview' },
  { path: '/admin/clients', labelKey: 'admin.tabClinicManagement', iconKey: 'clinicManagement' },
  { path: '/admin/subscriptions', labelKey: 'admin.tabSubscriptionBilling', iconKey: 'subscriptionBilling' },
  { path: '/admin/users', labelKey: 'admin.tabUserGovernance', iconKey: 'userGovernance' },
  { path: '/admin/feature-control', labelKey: 'admin.tabFeatureControl', iconKey: 'featureControl' },
  { path: '/admin/deployment', labelKey: 'admin.tabDeploymentControl', iconKey: 'deploymentControl' },
  { path: '/admin/analytics', labelKey: 'admin.tabAnalytics', iconKey: 'analytics' },
  { path: '/admin/activity-logs', labelKey: 'admin.tabAuditCompliance', iconKey: 'auditCompliance' },
  { path: '/admin/support', labelKey: 'admin.tabSupportIntervention', iconKey: 'supportIntervention' },
  { path: '/admin/data-management', labelKey: 'admin.tabDataManagement', iconKey: 'dataManagement' },
  { path: '/admin/role-management', labelKey: 'admin.tabRoleManagement', iconKey: 'roleManagement' },
  { path: '/admin/feature-rollout', labelKey: 'admin.tabFeatureRollout', iconKey: 'featureRollout' },
  { path: '/admin/settings/security', labelKey: 'admin.tabSecurity', iconKey: 'security' },
  { path: '/admin/emergency', labelKey: 'admin.tabEmergencyControl', iconKey: 'emergencyControl' },
  { path: '/admin/notifications', labelKey: 'admin.tabNotifications', iconKey: 'notifications' },
];

/**
 * Returns whether path matches the tab (handles exact for /admin).
 */
export function isAdminTabActive(tab, pathname) {
  const path = (pathname || '').replace(/\/$/, '') || '/admin';
  const tabPath = tab.path.replace(/\/$/, '') || '/admin';
  if (tab.exact) return path === tabPath;
  return path === tabPath || path.startsWith(tabPath + '/');
}
