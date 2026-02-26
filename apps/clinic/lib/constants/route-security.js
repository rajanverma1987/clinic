/**
 * Route & security constants per CursorMD/CLAUDE-AI.md (in-scope items 1–10 + Recommended).
 * Single source for error redirects, session, tenant, validation, audit, rate limits, manager restrictions, feature flags.
 */

import { isManagerPathAllowed } from '@/lib/constants/manager-access.js';

// ─── 7. Error Handling Strategy ───────────────────────────────────────────
export const ERROR_HANDLING = {
  unauthorizedRedirect: '/login',
  forbiddenRedirect: '/dashboard',
  notFoundRedirect: '/dashboard',
  offlineMode: {
    allowedRoutes: ['/queue', '/appointments'],
    syncOnReconnect: true,
  },
};

// ─── 9. Session Management ───────────────────────────────────────────────
export const SESSION_CONFIG = {
  accessTokenTTL: 15 * 60, // 15 min
  refreshTokenTTL: 7 * 24 * 60 * 60, // 7 days
  maxConcurrentSessions: 3,
  inactivityTimeout: 30 * 60, // 30 min
  require2FA: ['super_admin', 'doctor', 'admin', 'clinic_admin'],
};

// ─── 4. Multi-Tenancy Isolation ───────────────────────────────────────────
export const TENANT_ISOLATION = {
  enforceOnAllRoutes: true,
  exceptions: [
    '/login',
    '/pricing',
    '/forgot-password',
    '/reset-password',
    '/about',
    '/contact',
    '/blog',
    '/support',
    '/legal',
    '/privacy',
    '/terms',
  ],
  crossTenantAllowed: [], // Super admin only
  requireTenantContext: true,
};

// ─── 3. Route Validation (file size, types, rate limit, audit per route) ───
export const ROUTE_VALIDATION = {
  '/invoices/new': {
    maxFileSize: '10MB',
    allowedFileTypes: ['pdf', 'jpg', 'png'],
    rateLimit: { requests: 100, window: '1h' },
    auditLevel: 'detailed',
  },
  '/patients/:id/upload': {
    maxFileSize: '5MB',
    allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    auditLevel: 'standard',
  },
  '/api/patients/:id/upload': {
    maxFileSize: '5MB',
    allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    auditLevel: 'standard',
  },
};

// ─── 8. GDPR/HIPAA Data Classification ──────────────────────────────────────
export const DATA_CLASSIFICATION = {
  '/patients/:id': {
    phiLevel: 'high',
    retentionYears: 7,
    encryptionRequired: true,
    consentRequired: ['read', 'export'],
  },
  '/invoices': {
    phiLevel: 'medium',
    pciCompliance: true,
  },
};

// ─── 5. Patient detail tabs (PHI / permission per tab) ───────────────────────
export const PATIENT_DETAIL_TABS = {
  defaultTab: 'overview',
  tabs: [
    {
      id: 'overview',
      labelKey: 'patients.overview',
      requiredPermission: { resource: 'patient', action: 'read' },
      phiLevel: 'basic',
    },
    {
      id: 'visits',
      labelKey: 'patients.visits',
      requiredPermission: { resource: 'appointment', action: 'read' },
      phiLevel: 'basic',
    },
    {
      id: 'timeline',
      labelKey: 'patients.timeline',
      requiredPermission: { resource: 'patient', action: 'read' },
      phiLevel: 'basic',
    },
    {
      id: 'prescriptions',
      labelKey: 'prescriptions.title',
      requiredPermission: { resource: 'prescription', action: 'read' },
      phiLevel: 'sensitive',
    },
    {
      id: 'care-plans',
      labelKey: 'carePlans.title',
      requiredPermission: { resource: 'care_plan', action: 'read' },
      phiLevel: 'sensitive',
    },
    {
      id: 'procedures',
      labelKey: 'procedures.title',
      requiredPermission: { resource: 'procedure', action: 'read' },
      phiLevel: 'sensitive',
    },
    {
      id: 'invoices',
      labelKey: 'invoices.title',
      requiredPermission: { resource: 'invoice', action: 'read' },
      phiLevel: 'medium',
    },
    {
      id: 'lab-tests',
      labelKey: 'reports.labTests',
      requiredPermission: { resource: 'lab_result', action: 'read' },
      phiLevel: 'sensitive',
    },
    {
      id: 'lab-results',
      labelKey: 'lab.labResults',
      requiredPermission: { resource: 'lab_result', action: 'read' },
      phiLevel: 'sensitive',
    },
    {
      id: 'imaging',
      labelKey: 'imaging.title',
      requiredPermission: { resource: 'imaging', action: 'read' },
      phiLevel: 'sensitive',
    },
    {
      id: 'insurance',
      labelKey: 'insurance.title',
      requiredPermission: { resource: 'patient', action: 'read' },
      phiLevel: 'medium',
    },
    {
      id: 'consent',
      labelKey: 'consent.tabTitle',
      requiredPermission: { resource: 'consent', action: 'read' },
      phiLevel: 'sensitive',
    },
    {
      id: 'documents',
      labelKey: 'patients.documents',
      requiredPermission: { resource: 'patient', action: 'read' },
      phiLevel: 'medium',
    },
    {
      id: 'notes',
      labelKey: 'doctors.notes',
      doctorOnly: true,
      requiredPermission: { resource: 'clinical_note', action: 'read' },
      phiLevel: 'sensitive',
      auditAccess: true,
    },
  ],
};

// ─── 2. Manager Restrictions (CLAUDE-AI §2) ───────────────────────────────────
// Manager: no Settings, no reports, no staff; inventory read-only (items only, no lots);
// prescriptions read-only; invoices limited (no pricing).
export const MANAGER_RESTRICTIONS = {
  cannotAccess: ['/staff', '/settings', '/reports', '/prescriptions/new', '/inventory/lots'],
  readOnly: ['/inventory', '/prescriptions'],
  limitedWrite: ['/invoices'], // Cannot edit pricing
};

/** Explicit list of paths managers cannot access. Use for nav filtering; isManagerPathForbidden() also matches subpaths. */
export const MANAGER_FORBIDDEN_PATHS = [...MANAGER_RESTRICTIONS.cannotAccess];

/**
 * Returns true if the given path is forbidden for manager.
 * When managerAccess is provided (array of selected access keys), path is allowed only if it matches one of those areas; otherwise uses MANAGER_RESTRICTIONS.cannotAccess.
 * @param {string} path
 * @param {string[]} [managerAccess] - User.managerAccess; when set, use allow-list; when empty/undefined, use default forbidden list.
 */
export function isManagerPathForbidden(path, managerAccess) {
  if (!path) return false;
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';

  if (Array.isArray(managerAccess) && managerAccess.length > 0) {
    return !isManagerPathAllowed(path, managerAccess);
  }

  return MANAGER_RESTRICTIONS.cannotAccess.some(
    (p) => normalized === p || normalized.startsWith(p + '/'),
  );
}

// ─── Recommended: Audit ───────────────────────────────────────────────────
export const AUDIT_CONFIG = {
  alwaysAudit: ['/patients/:id', '/prescriptions', '/invoices'],
  auditActions: ['create', 'update', 'delete', 'export', 'print'],
  retentionDays: 2555, // 7 years
};

// ─── Recommended: Rate Limits (per route) ──────────────────────────────────
export const RATE_LIMITS = {
  '/api/auth/login': { max: 5, window: '15m', blockDuration: '1h' },
  '/api/patients': { max: 1000, window: '1h' },
  '/api/prescriptions/new': { max: 100, window: '1h' },
};

// ─── Recommended: Permission matrix (route-level, align with CursorMD/New) ──
export const PERMISSION_MATRIX = {
  manager: {
    '/patients': { read: true, write: true, delete: false },
    '/invoices': { read: true, write: 'limited', delete: false },
    '/settings': { read: false, write: false, delete: false },
    '/staff': { read: false, write: false, delete: false },
    '/reports': { read: false, write: false, delete: false },
    '/inventory': { read: true, write: false, delete: false },
  },
  // Other roles follow lib/permissions/constants.js PERMISSIONS; this is route-level override for UI/nav.
};

// ─── Recommended: Feature flags per environment ─────────────────────────────
export const FEATURE_FLAGS = {
  production: { TELEMEDICINE: true, BETA_FEATURES: false },
  staging: { TELEMEDICINE: true, BETA_FEATURES: true },
  development: { TELEMEDICINE: true, BETA_FEATURES: true },
};

/**
 * Returns true if the given path is read-only for manager.
 */
export function isManagerPathReadOnly(path) {
  if (!path) return false;
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
  return MANAGER_RESTRICTIONS.readOnly.some(
    (p) => normalized === p || normalized.startsWith(p + '/'),
  );
}

/**
 * Returns true if the given path has limited write for manager (e.g. invoices without pricing).
 */
export function isManagerPathLimitedWrite(path) {
  if (!path) return false;
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
  return MANAGER_RESTRICTIONS.limitedWrite.some(
    (p) => normalized === p || normalized.startsWith(p + '/'),
  );
}

/**
 * Get data classification for a path (PHI level, retention, etc.). Used by audit/GDPR.
 * @param {string} path - e.g. '/patients/123', '/invoices'
 * @returns {Object|null} DATA_CLASSIFICATION entry or null
 */
export function getDataClassification(path) {
  if (!path) return null;
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
  for (const [pattern, config] of Object.entries(DATA_CLASSIFICATION)) {
    const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '$');
    if (regex.test(normalized)) return config;
  }
  return null;
}

/**
 * Whether the path is an exception to tenant enforcement (e.g. /login, /pricing).
 */
export function isTenantException(path) {
  if (!path) return true;
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
  return TENANT_ISOLATION.exceptions.some(
    (p) => normalized === p || normalized.startsWith(p + '/'),
  );
}

/**
 * Whether the request path requires tenant context (user.tenantId). Super admin may bypass.
 */
export function pathRequiresTenant(path) {
  if (!TENANT_ISOLATION.requireTenantContext) return false;
  return !isTenantException(path);
}
