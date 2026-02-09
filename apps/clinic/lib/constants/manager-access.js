/**
 * Manager access options: subscription accounts (Doctor/Clinic Admin) can create Manager accounts
 * and select which access to grant from this list. Only options allowed by the clinic's plan
 * should be offered; selected keys are stored on User.managerAccess.
 */

/** All possible manager access keys (path prefix or area id). Used for validation. */
export const MANAGER_ACCESS_IDS = [
  'dashboard',
  'appointments',
  'queue',
  'patients',
  'staff',
  'prescriptions',
  'invoices',
  'inventory',
  'reports',
  'settings',
  'telemedicine',
];

/**
 * Options for "Select access" when creating a Manager. Each option is shown only if the
 * clinic's subscription includes requiredFeature (null = always show).
 */
export const MANAGER_ACCESS_OPTIONS = [
  { id: 'dashboard', labelKey: 'settings.managerAccessDashboard', requiredFeature: null },
  {
    id: 'appointments',
    labelKey: 'settings.managerAccessAppointments',
    requiredFeature: 'Appointment Scheduling',
  },
  { id: 'queue', labelKey: 'settings.managerAccessQueue', requiredFeature: 'Queue Management' },
  {
    id: 'patients',
    labelKey: 'settings.managerAccessPatients',
    requiredFeature: 'Patient Management',
  },
  { id: 'staff', labelKey: 'settings.managerAccessStaff', requiredFeature: null },
  {
    id: 'prescriptions',
    labelKey: 'settings.managerAccessPrescriptions',
    requiredFeature: 'Prescriptions Management',
  },
  {
    id: 'invoices',
    labelKey: 'settings.managerAccessInvoices',
    requiredFeature: 'Invoice & Billing',
  },
  {
    id: 'inventory',
    labelKey: 'settings.managerAccessInventory',
    requiredFeature: 'Inventory Management',
  },
  {
    id: 'reports',
    labelKey: 'settings.managerAccessReports',
    requiredFeature: 'Reports & Analytics',
  },
  { id: 'settings', labelKey: 'settings.managerAccessSettings', requiredFeature: null },
  { id: 'telemedicine', labelKey: 'settings.managerAccessTelemedicine', requiredFeature: null },
];

/**
 * Map each access id to path prefixes that this access grants. A path is allowed for a manager
 * if it matches (equals or starts with) one of the pathPrefixes for any of their managerAccess.
 */
const ACCESS_PATH_PREFIXES = {
  dashboard: ['/dashboard'],
  appointments: ['/appointments', '/dashboard'],
  queue: ['/queue'],
  patients: ['/patients'],
  staff: ['/staff'],
  prescriptions: ['/prescriptions', '/dashboard'],
  invoices: ['/invoices'],
  inventory: ['/inventory'],
  reports: ['/reports'],
  settings: ['/settings'],
  telemedicine: ['/telemedicine'],
};

/**
 * Check if a path is allowed for a manager given their selected managerAccess.
 * @param {string} path - e.g. '/patients/123', '/invoices'
 * @param {string[]} managerAccess - e.g. ['patients', 'invoices']
 * @returns {boolean} true if path is allowed (manager has access to this area)
 */
export function isManagerPathAllowed(path, managerAccess) {
  if (!path || !Array.isArray(managerAccess) || managerAccess.length === 0) return false;
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
  for (const accessId of managerAccess) {
    const prefixes = ACCESS_PATH_PREFIXES[accessId];
    if (!prefixes) continue;
    for (const prefix of prefixes) {
      if (normalized === prefix || normalized.startsWith(prefix + '/')) return true;
    }
    // Dashboard tab: /dashboard?tab=appointments → allow if appointments in managerAccess
    if (accessId === 'appointments' && normalized === '/dashboard') return true;
    if (accessId === 'prescriptions' && normalized === '/dashboard') return true;
  }
  return false;
}

/**
 * Check if a sidebar href is allowed for a manager. Handles /dashboard?tab=appointments etc.
 * @param {string} href - e.g. '/dashboard?tab=appointments', '/patients'
 * @param {string[]} managerAccess
 * @returns {boolean}
 */
export function isManagerHrefAllowed(href, managerAccess) {
  if (!href || !Array.isArray(managerAccess) || managerAccess.length === 0) return false;
  const path = href.split('?')[0].replace(/\/$/, '') || '/';
  const tab = href.includes('tab=')
    ? new URLSearchParams(href.split('?')[1] || '').get('tab')
    : null;

  for (const accessId of managerAccess) {
    const prefixes = ACCESS_PATH_PREFIXES[accessId];
    if (!prefixes) continue;
    for (const prefix of prefixes) {
      if (path === prefix || path.startsWith(prefix + '/')) {
        if (path === '/dashboard' && tab) {
          if (tab === 'appointments' && accessId === 'appointments') return true;
          if (tab === 'prescriptions' && accessId === 'prescriptions') return true;
          if (tab === 'overview' || !tab) return accessId === 'dashboard';
          continue;
        }
        return true;
      }
    }
  }
  return false;
}

/** Map sidebar href to access id for "does manager have this access". */
export function getAccessIdForHref(href) {
  if (!href) return null;
  const path = href.split('?')[0].replace(/\/$/, '') || '/';
  const tab = href.includes('tab=')
    ? new URLSearchParams(href.split('?')[1] || '').get('tab')
    : null;
  if (path === '/dashboard' && tab === 'appointments') return 'appointments';
  if (path === '/dashboard' && tab === 'prescriptions') return 'prescriptions';
  if (path === '/dashboard') return 'dashboard';
  if (path.startsWith('/appointments')) return 'appointments';
  if (path.startsWith('/queue')) return 'queue';
  if (path.startsWith('/patients')) return 'patients';
  if (path.startsWith('/staff')) return 'staff';
  if (path.startsWith('/prescriptions')) return 'prescriptions';
  if (path.startsWith('/invoices')) return 'invoices';
  if (path.startsWith('/inventory')) return 'inventory';
  if (path.startsWith('/reports')) return 'reports';
  if (path.startsWith('/settings')) return 'settings';
  if (path.startsWith('/telemedicine')) return 'telemedicine';
  return null;
}
