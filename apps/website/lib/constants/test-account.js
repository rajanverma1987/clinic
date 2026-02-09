/**
 * TEST ACCOUNT – single source of truth for 706359@gmail.com.
 * Gives full access: login bypass, all features, all permissions, role override, tenant bypass.
 *
 * REMOVAL (very easy):
 * 1. Set TEST_ACCOUNT_ENABLED = false below (or env TEST_ACCOUNT_ENABLED=false). Restart. Done.
 * 2. Or delete this file and: (a) in auth.service.js remove isTestAccount usage and bypass logic;
 *    (b) in middleware/auth.js remove the role-override block; (c) in middleware/feature-check.js
 *    remove isTestAccount bypass; (d) in middleware/permission-check.js remove isTestAccount bypass;
 *    (e) in app/api/auth/me/route.js remove test-account tenant bypass; (f) in Layout, login, AuthContext,
 *    FeatureContext, api/features, api/users remove test-account UI/API usage.
 */

const FROM_ENV = typeof process !== 'undefined' && process.env?.TEST_ACCOUNT_EMAIL?.trim();
export const TEST_ACCOUNT_EMAIL = (FROM_ENV || '706359@gmail.com').toLowerCase();

/** Set to false (or env TEST_ACCOUNT_ENABLED=false) to disable all test-account bypasses. */
export const TEST_ACCOUNT_ENABLED =
  typeof process !== 'undefined' && process.env?.TEST_ACCOUNT_ENABLED === 'false' ? false : true;

export const TEST_ACCOUNT_ROLE_OVERRIDE_KEY = 'TEST_ACCOUNT_ROLE_OVERRIDE';

export const TEST_ACCOUNT_ALLOWED_ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'clinic_admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'super_admin', label: 'Super Admin' },
];

export function getTestAccountRoleOverride() {
  if (!TEST_ACCOUNT_ENABLED || typeof window === 'undefined') return null;
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
  if (!TEST_ACCOUNT_ENABLED || typeof window === 'undefined') return;
  const allowed = TEST_ACCOUNT_ALLOWED_ROLES.map((r) => r.value);
  if (allowed.includes(role)) {
    sessionStorage.setItem(TEST_ACCOUNT_ROLE_OVERRIDE_KEY, role);
  }
}

export function clearTestAccountRoleOverride() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TEST_ACCOUNT_ROLE_OVERRIDE_KEY);
}

/** Use everywhere for test-account bypass. Returns false when TEST_ACCOUNT_ENABLED is false. */
export function isTestAccount(email) {
  if (!TEST_ACCOUNT_ENABLED || !TEST_ACCOUNT_EMAIL) return false;
  return String(email || '').toLowerCase() === TEST_ACCOUNT_EMAIL;
}
