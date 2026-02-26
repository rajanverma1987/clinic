/**
 * CursorMD/New clinic-complete-specification.md – Permission matrix as capability checks.
 * Each row of the spec matrix is implemented here for use in API and UI.
 */

import { ACTIONS, hasPermission, resolveRole, RESOURCES } from './constants.js';

/**
 * Resolve role for matrix (clinic_admin -> admin)
 */
function r(role) {
  return resolveRole(role);
}

/**
 * DASHBOARD OVERVIEW
 */
export function canViewAllClinics(role) {
  return r(role) === 'super_admin';
}

export function canViewOwnClinicStats(role) {
  return ['super_admin', 'doctor', 'admin', 'manager'].includes(r(role));
}

export function canViewRealtimeAnalytics(role) {
  return ['super_admin', 'doctor', 'admin', 'manager'].includes(r(role));
}

export function canExportReports(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role)) && r(role) !== 'manager';
}

/**
 * PATIENT MANAGEMENT
 */
export function canAddPatient(role) {
  return (
    hasPermission(role, RESOURCES.PATIENT, ACTIONS.CREATE) ||
    hasPermission(role, RESOURCES.PATIENT, ACTIONS.MANAGE)
  );
}

export function canEditPatient(role) {
  return (
    hasPermission(role, RESOURCES.PATIENT, ACTIONS.UPDATE) ||
    hasPermission(role, RESOURCES.PATIENT, ACTIONS.MANAGE)
  );
}

export function canDeletePatient(role) {
  return (
    hasPermission(role, RESOURCES.PATIENT, ACTIONS.DELETE) ||
    hasPermission(role, RESOURCES.PATIENT, ACTIONS.MANAGE)
  );
}

export function canAccessSensitiveData(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

/**
 * APPOINTMENTS
 */
export function canManageSchedules(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

/**
 * BILLING & PAYMENTS
 */
export function canIssueRefund(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canViewRevenueReports(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canManagePricing(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canAccessInsuranceClaims(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

/**
 * MEDICAL RECORDS – Admin view-only prescription/treatment; Manager no access
 */
export function canCreatePrescription(role) {
  return (
    hasPermission(role, RESOURCES.PRESCRIPTION, ACTIONS.CREATE) ||
    hasPermission(role, RESOURCES.PRESCRIPTION, ACTIONS.MANAGE)
  );
}

export function canAddDiagnosis(role) {
  return ['super_admin', 'doctor'].includes(r(role));
}

export function canCreateTreatmentPlan(role) {
  return ['super_admin', 'doctor'].includes(r(role));
}

export function canAddMedicalNotes(role) {
  return ['super_admin', 'doctor'].includes(r(role));
}

/**
 * INVENTORY – Manager view-only or no update
 */
export function canAddMedicineItem(role) {
  return (
    hasPermission(role, RESOURCES.INVENTORY, ACTIONS.CREATE) ||
    hasPermission(role, RESOURCES.INVENTORY, ACTIONS.MANAGE)
  );
}

export function canUpdateStock(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canManageSuppliers(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

/**
 * STAFF MANAGEMENT – Spec: only Doctor (clinic owner) and Super Admin can assign Admin/Manager.
 * Admin cannot assign or remove Admin or Manager roles.
 */
export function canAssignAdminManager(role) {
  return ['super_admin', 'doctor'].includes(r(role));
}

export function canAddStaff(role) {
  return (
    hasPermission(role, RESOURCES.USER, ACTIONS.CREATE) ||
    hasPermission(role, RESOURCES.USER, ACTIONS.MANAGE)
  );
}

export function canDeleteStaff(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canManageSchedulesStaff(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

/**
 * REPORTS & ANALYTICS – Manager view-only / basic
 */
export function canViewDailyReports(role) {
  return (
    hasPermission(role, RESOURCES.REPORT, ACTIONS.READ) ||
    hasPermission(role, RESOURCES.REPORT, ACTIONS.MANAGE)
  );
}

export function canViewMonthlyReports(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canViewRevenueAnalytics(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canExportData(role) {
  return (
    hasPermission(role, RESOURCES.REPORT, ACTIONS.EXPORT) ||
    hasPermission(role, RESOURCES.REPORT, ACTIONS.MANAGE)
  );
}

/**
 * COMMUNICATION
 */
export function canBulkMessage(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

/**
 * SETTINGS – Clinic Admin has full access to clinic settings (add/edit/change) as per plan
 */
export function canEditClinicSettings(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canEditUserPermissions(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canEditBillingSettings(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canEditIntegrationSettings(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

export function canBackupRestore(role) {
  return ['super_admin', 'doctor', 'admin'].includes(r(role));
}

/**
 * SYSTEM ADMIN – Super Admin only
 */
export function canManageSubscriptions(role) {
  return r(role) === 'super_admin';
}

export function canAccessSystemLogs(role) {
  return r(role) === 'super_admin';
}

export function canManageDatabase(role) {
  return r(role) === 'super_admin';
}

export function canViewAllClinicsOverview(role) {
  return r(role) === 'super_admin';
}
