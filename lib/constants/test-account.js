/**
 * TEMPORARY: Test account for development – REMOVE before production.
 * Allows 706359@gmail.com to:
 * - Choose role (Doctor/Admin/Manager/Super Admin) and access all dashboards
 * - Get premium access (all features, high limits, ACTIVE subscription) for testing
 */

export const TEST_ACCOUNT_EMAIL = '706359@gmail.com';
export const TEST_ACCOUNT_ROLE_OVERRIDE_KEY = 'TEST_ACCOUNT_ROLE_OVERRIDE';

export const TEST_ACCOUNT_ALLOWED_ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'clinic_admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'super_admin', label: 'Super Admin' },
];

export function getTestAccountRoleOverride() {
  if (typeof window === 'undefined') return null;
  try {
    const v = sessionStorage.getItem(TEST_ACCOUNT_ROLE_OVERRIDE_KEY);
    if (!v) return null;
    const allowed = TEST_ACCOUNT_ALLOWED_ROLES.map((r) => r.value);
    return allowed.includes(v) ? v : null;
  } catch {
    return null;
  }
}

export function setTestAccountRoleOverride(role) {
  if (typeof window === 'undefined') return;
  const allowed = TEST_ACCOUNT_ALLOWED_ROLES.map((r) => r.value);
  if (allowed.includes(role)) {
    sessionStorage.setItem(TEST_ACCOUNT_ROLE_OVERRIDE_KEY, role);
  }
}

export function clearTestAccountRoleOverride() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TEST_ACCOUNT_ROLE_OVERRIDE_KEY);
}

export function isTestAccount(email) {
  return String(email || '').toLowerCase() === TEST_ACCOUNT_EMAIL.toLowerCase();
}
