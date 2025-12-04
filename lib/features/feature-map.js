/**
 * Feature to Route/Functionality Mapping
 * Maps subscription plan features to actual application functionality
 */

export const FEATURE_MAP = {
  'Patient Management': [
    '/patients',
    '/api/patients',
  ],
  'Appointment Scheduling': [
    '/appointments',
    '/api/appointments',
  ],
  'Queue Management': [
    '/queue',
    '/api/queue',
  ],
  'Prescriptions Management': [
    '/prescriptions',
    '/api/prescriptions',
  ],
  'Invoice & Billing': [
    '/invoices',
    '/api/invoices',
    '/api/payments',
  ],
  'Inventory Management': [
    '/inventory',
    '/api/inventory',
  ],
  'Reports & Analytics': [
    '/reports',
    '/api/reports',
  ],
  'Advanced Reports & Analytics': [
    '/reports/advanced',
    '/api/reports/advanced',
  ],
  'Multi-Location Support': [
    '/settings/locations',
    '/api/locations',
  ],
  'Telemedicine': [
    '/telemedicine',
    '/api/telemedicine',
  ],
  'API Access': [
    '/api',
  ],
  'Custom Branding': [
    '/settings/branding',
    '/api/settings/branding',
  ],
  'Data Export': [
    '/api/export',
    '/reports/export',
  ],
  'Audit Logs': [
    '/audit-logs',
    '/api/audit-logs',
  ],
  'HIPAA/GDPR Compliance': [
    '/settings/compliance',
    '/api/compliance',
  ],
  'White Label Solution': [
    '/settings/white-label',
    '/api/white-label',
  ],
  'Priority Support': [
    '/support/priority',
    '/api/support/priority',
  ],
  'Dedicated Support': [
    '/support/dedicated',
    '/api/support/dedicated',
  ],
  'Automated Reminders': [
    '/settings/reminders',
    '/api/reminders',
  ],
};

/**
 * Get all routes/paths that require a specific feature
 */
export function getRoutesForFeature(feature) {
  return FEATURE_MAP[feature] || [];
}

/**
 * Get all features required for a route/path
 */
export function getFeaturesForRoute(route) {
  const features = [];
  for (const [feature, routes] of Object.entries(FEATURE_MAP)) {
    if (routes.some(r => route.startsWith(r))) {
      features.push(feature);
    }
  }
  return features;
}

/**
 * Check if a route requires any features
 */
export function routeRequiresFeatures(route) {
  return getFeaturesForRoute(route).length > 0;
}

