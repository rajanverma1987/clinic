/**
 * @clinic-saas/dashboard-engine
 * Dashboard metrics, trends, and actions. No DB – clinic app injects data via adapter.
 */

export { ADAPTER_METHODS, validateAdapter } from './context.js';

export { getAlerts } from './metrics/getAlerts.js';
export { getClinicSummary } from './metrics/getClinicSummary.js';
export { getClinicSummaryFromMetrics } from './metrics/getClinicSummaryFromMetrics.js';
export { getDoctorSummary } from './metrics/getDoctorSummary.js';
export { getTodayStats } from './metrics/getTodayStats.js';
export { updateDashboardMetrics } from './metrics/updateDashboardMetrics.js';

export { getPatientFlow } from './trends/getPatientFlow.js';
export { getRevenueTrend } from './trends/getRevenueTrend.js';

export { assignStaff } from './actions/assignStaff.js';
export { retryPayment } from './actions/retryPayment.js';
