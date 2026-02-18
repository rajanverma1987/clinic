/**
 * Adapter interface for dashboard-engine.
 * The clinic app implements this and passes it into every engine function.
 * Engine never touches DB; all data comes from the adapter.
 *
 * @typedef {Object} DashboardAdapter
 * @property {function(string): Promise<ClinicStatsRaw>} getClinicStats - Raw counts for one tenant (appointments, revenue, patients, queue)
 * @property {function(string, string): Promise<ReportDashboardStats>} getReportDashboardStats - Full report dashboard stats (with trends)
 * @property {function(string, string): Promise<DoctorDashboardRaw|null>} getDoctorDashboard - Doctor KPIs and activity (or null if not doctor)
 * @property {function(string, GetAlertsOptions): Promise<AlertsRaw>} getAlertsRaw - Overdue invoices, low stock, expiring lots, urgent appointments
 * @property {function(string, TrendOptions): Promise<RevenueTrendRaw>} getRevenueTrendRaw - Revenue by period for trend
 * @property {function(string, TrendOptions): Promise<PatientFlowRaw>} getPatientFlowRaw - New/active patients by period
 * @property {function(string, AssignStaffPayload): Promise<{ success: boolean, error?: string }>} assignStaff - Assign staff to role/clinic
 * @property {function(string, RetryPaymentPayload): Promise<{ success: boolean, error?: string }>} retryPayment - Retry failed payment
 */

export const ADAPTER_METHODS = [
  'getClinicStats',
  'getReportDashboardStats',
  'getDoctorDashboard',
  'getAlertsRaw',
  'getRevenueTrendRaw',
  'getPatientFlowRaw',
  'assignStaff',
  'retryPayment',
];

/**
 * Validates that the adapter has the required methods. Throws if not.
 * @param {DashboardAdapter} adapter
 */
export function validateAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') {
    throw new Error('dashboard-engine: adapter is required');
  }
  for (const method of ADAPTER_METHODS) {
    if (typeof adapter[method] !== 'function') {
      throw new Error(`dashboard-engine: adapter.${method} must be a function`);
    }
  }
}
