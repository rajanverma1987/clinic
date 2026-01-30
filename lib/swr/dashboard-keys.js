/**
 * SWR cache keys for dashboard and related data.
 * Used for event-driven invalidation and cache warming.
 */

export const DASHBOARD_STATS_KEY = ['reports', 'dashboard'];
export const DASHBOARD_CHARTS_KEY = ['dashboard', 'charts'];
export const DASHBOARD_LISTS_KEY = ['dashboard', 'lists'];

export function appointmentsKey(params = {}) {
  return ['appointments', params];
}

export const PATIENTS_LIST_KEY = ['patients'];

export function patientsKey(params = {}) {
  return ['patients', params];
}

export function patientKey(id) {
  return ['patient', id];
}
