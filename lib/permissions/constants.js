/**
 * Permission Constants
 * Defines all permissions for RBAC system.
 * Aligned with CursorMD/New clinic-complete-specification.md (Super Admin, Doctor, Admin, Manager).
 *
 * THREE-TIER ACCESS MODEL:
 * 1. Super Admin – Full access. No subscription or tenant; sees all system features and /admin.
 * 2. Doctor – Access as per subscription. Clinic features (nav, modules) are gated by subscription
 *    (FeatureContext.hasFeature from /api/features → tenant’s plan). Doctor creates Admin/Manager
 *    accounts and assigns their role = required access for clinic work.
 * 3. Admin / Manager – Access as per role assigned by Doctor when creating the account.
 *    Admin = full clinic access (this matrix). Manager = limited clinic access (this matrix).
 *    Only Doctor (and Super Admin) can create or assign Admin/Manager (see canAssignAdminManager).
 *    Admin and Manager can only see/use what the clinic’s subscription plan allows (same plan as
 *    Doctor); the Doctor cannot grant access to features the plan does not include.
 */

// Resource types
export const RESOURCES = {
  PATIENT: 'patient',
  APPOINTMENT: 'appointment',
  PRESCRIPTION: 'prescription',
  INVOICE: 'invoice',
  PAYMENT: 'payment',
  LAB_TEST: 'lab_test',
  LAB_ORDER: 'lab_order',
  LAB_RESULT: 'lab_result',
  CLINICAL_NOTE: 'clinical_note',
  INVENTORY: 'inventory',
  USER: 'user',
  DOCTOR: 'doctor',
  DEPARTMENT: 'department',
  REPORT: 'report',
  SETTINGS: 'settings',
  AUDIT_LOG: 'audit_log',
  SUBSCRIPTION: 'subscription',
  NOTIFICATION: 'notification',
  TELEMEDICINE: 'telemedicine',
  QUEUE: 'queue',
};

// Action types
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
  MANAGE: 'manage', // Full access
  APPROVE: 'approve',
  VERIFY: 'verify',
  CANCEL: 'cancel',
  ASSIGN: 'assign',
};

/**
 * Permission matrix: Role -> Resource -> Actions
 * Based on NEW-PLANS.md role definitions
 */
export const PERMISSIONS = {
  // Super Admin - Full access to everything
  super_admin: {
    [RESOURCES.PATIENT]: [ACTIONS.MANAGE],
    [RESOURCES.APPOINTMENT]: [ACTIONS.MANAGE],
    [RESOURCES.PRESCRIPTION]: [ACTIONS.MANAGE],
    [RESOURCES.INVOICE]: [ACTIONS.MANAGE],
    [RESOURCES.PAYMENT]: [ACTIONS.MANAGE],
    [RESOURCES.LAB_TEST]: [ACTIONS.MANAGE],
    [RESOURCES.LAB_ORDER]: [ACTIONS.MANAGE],
    [RESOURCES.LAB_RESULT]: [ACTIONS.MANAGE],
    [RESOURCES.CLINICAL_NOTE]: [ACTIONS.MANAGE],
    [RESOURCES.INVENTORY]: [ACTIONS.MANAGE],
    [RESOURCES.USER]: [ACTIONS.MANAGE],
    [RESOURCES.DOCTOR]: [ACTIONS.MANAGE],
    [RESOURCES.DEPARTMENT]: [ACTIONS.MANAGE],
    [RESOURCES.REPORT]: [ACTIONS.MANAGE],
    [RESOURCES.SETTINGS]: [ACTIONS.MANAGE],
    [RESOURCES.AUDIT_LOG]: [ACTIONS.MANAGE],
    [RESOURCES.SUBSCRIPTION]: [ACTIONS.MANAGE],
    [RESOURCES.NOTIFICATION]: [ACTIONS.MANAGE],
    [RESOURCES.TELEMEDICINE]: [ACTIONS.MANAGE],
  },

  // Admin (CursorMD/New: same as Doctor but cannot assign Admin/Manager, no billing config, no clinic profile)
  // clinic_admin in DB is treated as Admin in permissions (see hasPermission)
  admin: {
    [RESOURCES.PATIENT]: [ACTIONS.MANAGE],
    [RESOURCES.APPOINTMENT]: [ACTIONS.MANAGE],
    [RESOURCES.PRESCRIPTION]: [ACTIONS.MANAGE],
    [RESOURCES.INVOICE]: [ACTIONS.MANAGE],
    [RESOURCES.PAYMENT]: [ACTIONS.MANAGE],
    [RESOURCES.LAB_TEST]: [ACTIONS.MANAGE],
    [RESOURCES.LAB_ORDER]: [ACTIONS.MANAGE],
    [RESOURCES.LAB_RESULT]: [ACTIONS.MANAGE],
    [RESOURCES.CLINICAL_NOTE]: [ACTIONS.MANAGE],
    [RESOURCES.INVENTORY]: [ACTIONS.MANAGE],
    [RESOURCES.USER]: [ACTIONS.MANAGE],
    [RESOURCES.DOCTOR]: [ACTIONS.MANAGE],
    [RESOURCES.DEPARTMENT]: [ACTIONS.MANAGE],
    [RESOURCES.REPORT]: [ACTIONS.MANAGE],
    [RESOURCES.SETTINGS]: [ACTIONS.MANAGE],
    [RESOURCES.AUDIT_LOG]: [ACTIONS.READ],
    [RESOURCES.SUBSCRIPTION]: [ACTIONS.READ],
    [RESOURCES.NOTIFICATION]: [ACTIONS.MANAGE],
    [RESOURCES.TELEMEDICINE]: [ACTIONS.MANAGE],
    [RESOURCES.QUEUE]: [ACTIONS.MANAGE],
  },

  // Clinic Admin - alias for Admin (full access within clinic; backward compat)
  clinic_admin: {
    [RESOURCES.PATIENT]: [ACTIONS.MANAGE],
    [RESOURCES.APPOINTMENT]: [ACTIONS.MANAGE],
    [RESOURCES.PRESCRIPTION]: [ACTIONS.MANAGE],
    [RESOURCES.INVOICE]: [ACTIONS.MANAGE],
    [RESOURCES.PAYMENT]: [ACTIONS.MANAGE],
    [RESOURCES.LAB_TEST]: [ACTIONS.MANAGE],
    [RESOURCES.LAB_ORDER]: [ACTIONS.MANAGE],
    [RESOURCES.LAB_RESULT]: [ACTIONS.MANAGE],
    [RESOURCES.CLINICAL_NOTE]: [ACTIONS.MANAGE],
    [RESOURCES.INVENTORY]: [ACTIONS.MANAGE],
    [RESOURCES.USER]: [ACTIONS.MANAGE],
    [RESOURCES.DOCTOR]: [ACTIONS.MANAGE],
    [RESOURCES.DEPARTMENT]: [ACTIONS.MANAGE],
    [RESOURCES.REPORT]: [ACTIONS.MANAGE],
    [RESOURCES.SETTINGS]: [ACTIONS.MANAGE],
    [RESOURCES.AUDIT_LOG]: [ACTIONS.READ],
    [RESOURCES.SUBSCRIPTION]: [ACTIONS.READ],
    [RESOURCES.NOTIFICATION]: [ACTIONS.MANAGE],
    [RESOURCES.TELEMEDICINE]: [ACTIONS.MANAGE],
    [RESOURCES.QUEUE]: [ACTIONS.MANAGE],
  },

  // Doctor - Clinical operations
  doctor: {
    [RESOURCES.PATIENT]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.APPOINTMENT]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.CANCEL],
    [RESOURCES.PRESCRIPTION]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.INVOICE]: [ACTIONS.READ],
    [RESOURCES.PAYMENT]: [ACTIONS.READ],
    [RESOURCES.LAB_TEST]: [ACTIONS.READ],
    [RESOURCES.LAB_ORDER]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.LAB_RESULT]: [ACTIONS.READ, ACTIONS.VERIFY],
    [RESOURCES.CLINICAL_NOTE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.INVENTORY]: [ACTIONS.READ],
    [RESOURCES.USER]: [ACTIONS.READ],
    [RESOURCES.DOCTOR]: [ACTIONS.READ, ACTIONS.UPDATE], // Own profile
    [RESOURCES.DEPARTMENT]: [ACTIONS.READ],
    [RESOURCES.REPORT]: [ACTIONS.READ],
    [RESOURCES.SETTINGS]: [ACTIONS.READ],
    [RESOURCES.AUDIT_LOG]: [], // No access
    [RESOURCES.SUBSCRIPTION]: [], // No access
    [RESOURCES.NOTIFICATION]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.TELEMEDICINE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.QUEUE]: [ACTIONS.READ, ACTIONS.UPDATE],
  },

  // Nurse - Clinical support
  nurse: {
    [RESOURCES.PATIENT]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.APPOINTMENT]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.PRESCRIPTION]: [ACTIONS.READ],
    [RESOURCES.INVOICE]: [ACTIONS.READ],
    [RESOURCES.PAYMENT]: [ACTIONS.READ],
    [RESOURCES.LAB_TEST]: [ACTIONS.READ],
    [RESOURCES.LAB_ORDER]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.LAB_RESULT]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.CLINICAL_NOTE]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.INVENTORY]: [ACTIONS.READ],
    [RESOURCES.USER]: [ACTIONS.READ],
    [RESOURCES.DOCTOR]: [ACTIONS.READ],
    [RESOURCES.DEPARTMENT]: [ACTIONS.READ],
    [RESOURCES.REPORT]: [ACTIONS.READ],
    [RESOURCES.SETTINGS]: [ACTIONS.READ],
    [RESOURCES.AUDIT_LOG]: [],
    [RESOURCES.SUBSCRIPTION]: [],
    [RESOURCES.NOTIFICATION]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.TELEMEDICINE]: [ACTIONS.READ],
  },

  // Receptionist - Front desk operations
  receptionist: {
    [RESOURCES.PATIENT]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.APPOINTMENT]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.CANCEL],
    [RESOURCES.PRESCRIPTION]: [ACTIONS.READ],
    [RESOURCES.INVOICE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.PAYMENT]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.LAB_TEST]: [ACTIONS.READ],
    [RESOURCES.LAB_ORDER]: [ACTIONS.READ],
    [RESOURCES.LAB_RESULT]: [ACTIONS.READ],
    [RESOURCES.CLINICAL_NOTE]: [ACTIONS.READ],
    [RESOURCES.INVENTORY]: [ACTIONS.READ],
    [RESOURCES.USER]: [ACTIONS.READ],
    [RESOURCES.DOCTOR]: [ACTIONS.READ],
    [RESOURCES.DEPARTMENT]: [ACTIONS.READ],
    [RESOURCES.REPORT]: [ACTIONS.READ],
    [RESOURCES.SETTINGS]: [ACTIONS.READ],
    [RESOURCES.AUDIT_LOG]: [],
    [RESOURCES.SUBSCRIPTION]: [],
    [RESOURCES.NOTIFICATION]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.TELEMEDICINE]: [ACTIONS.READ],
    [RESOURCES.QUEUE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
  },

  // Accountant - Financial operations
  accountant: {
    [RESOURCES.PATIENT]: [ACTIONS.READ],
    [RESOURCES.APPOINTMENT]: [ACTIONS.READ],
    [RESOURCES.PRESCRIPTION]: [ACTIONS.READ],
    [RESOURCES.INVOICE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE],
    [RESOURCES.PAYMENT]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.LAB_TEST]: [ACTIONS.READ],
    [RESOURCES.LAB_ORDER]: [ACTIONS.READ],
    [RESOURCES.LAB_RESULT]: [ACTIONS.READ],
    [RESOURCES.CLINICAL_NOTE]: [ACTIONS.READ],
    [RESOURCES.INVENTORY]: [ACTIONS.READ],
    [RESOURCES.USER]: [ACTIONS.READ],
    [RESOURCES.DOCTOR]: [ACTIONS.READ],
    [RESOURCES.DEPARTMENT]: [ACTIONS.READ],
    [RESOURCES.REPORT]: [ACTIONS.READ, ACTIONS.EXPORT],
    [RESOURCES.SETTINGS]: [ACTIONS.READ],
    [RESOURCES.AUDIT_LOG]: [],
    [RESOURCES.SUBSCRIPTION]: [ACTIONS.READ],
    [RESOURCES.NOTIFICATION]: [ACTIONS.READ],
    [RESOURCES.TELEMEDICINE]: [],
  },

  // Pharmacist - Pharmacy operations
  pharmacist: {
    [RESOURCES.PATIENT]: [ACTIONS.READ],
    [RESOURCES.APPOINTMENT]: [ACTIONS.READ],
    [RESOURCES.PRESCRIPTION]: [ACTIONS.READ, ACTIONS.UPDATE], // Dispense
    [RESOURCES.INVOICE]: [ACTIONS.READ],
    [RESOURCES.PAYMENT]: [ACTIONS.READ],
    [RESOURCES.LAB_TEST]: [ACTIONS.READ],
    [RESOURCES.LAB_ORDER]: [ACTIONS.READ],
    [RESOURCES.LAB_RESULT]: [ACTIONS.READ],
    [RESOURCES.CLINICAL_NOTE]: [ACTIONS.READ],
    [RESOURCES.INVENTORY]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.USER]: [ACTIONS.READ],
    [RESOURCES.DOCTOR]: [ACTIONS.READ],
    [RESOURCES.DEPARTMENT]: [ACTIONS.READ],
    [RESOURCES.REPORT]: [ACTIONS.READ],
    [RESOURCES.SETTINGS]: [ACTIONS.READ],
    [RESOURCES.AUDIT_LOG]: [],
    [RESOURCES.SUBSCRIPTION]: [],
    [RESOURCES.NOTIFICATION]: [ACTIONS.READ],
    [RESOURCES.TELEMEDICINE]: [],
    [RESOURCES.QUEUE]: [ACTIONS.READ],
  },

  // Manager (CursorMD/New: view-only reports, add/edit patients basic, book appointments, create invoices no pricing, no medical records, no inventory manage, no staff, no settings)
  manager: {
    [RESOURCES.PATIENT]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.APPOINTMENT]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.CANCEL],
    [RESOURCES.PRESCRIPTION]: [],
    [RESOURCES.INVOICE]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.PAYMENT]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.LAB_TEST]: [ACTIONS.READ],
    [RESOURCES.LAB_ORDER]: [ACTIONS.READ],
    [RESOURCES.LAB_RESULT]: [ACTIONS.READ],
    [RESOURCES.CLINICAL_NOTE]: [],
    [RESOURCES.INVENTORY]: [ACTIONS.READ],
    [RESOURCES.USER]: [],
    [RESOURCES.DOCTOR]: [ACTIONS.READ],
    [RESOURCES.DEPARTMENT]: [ACTIONS.READ],
    [RESOURCES.REPORT]: [ACTIONS.READ],
    [RESOURCES.SETTINGS]: [],
    [RESOURCES.AUDIT_LOG]: [],
    [RESOURCES.SUBSCRIPTION]: [],
    [RESOURCES.NOTIFICATION]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.TELEMEDICINE]: [],
    [RESOURCES.QUEUE]: [ACTIONS.READ, ACTIONS.UPDATE],
  },
};

/** CursorMD/New: clinic_admin in DB maps to Admin role in spec. Normalize to lowercase for permission lookup. */
export function resolveRole(role) {
  if (!role) return '';
  if (role === 'clinic_admin') return 'admin';
  return String(role).toLowerCase();
}

/**
 * Check if a role has permission for a resource and action
 */
export function hasPermission(role, resource, action) {
  const r = resolveRole(role);
  if (!PERMISSIONS[r]) {
    return false;
  }

  const rolePermissions = PERMISSIONS[r];
  if (!rolePermissions[resource]) {
    return false;
  }

  const allowedActions = rolePermissions[resource];

  // MANAGE permission grants all actions
  if (allowedActions.includes(ACTIONS.MANAGE)) {
    return true;
  }

  return allowedActions.includes(action);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role) {
  return PERMISSIONS[resolveRole(role)] || {};
}

/**
 * Get all roles that have permission for a resource and action
 */
export function getRolesWithPermission(resource, action) {
  const roles = [];
  for (const [role, permissions] of Object.entries(PERMISSIONS)) {
    if (hasPermission(role, resource, action)) {
      roles.push(role);
    }
  }
  return roles;
}
