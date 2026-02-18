import { validateAdapter } from '../context.js';

/**
 * Today's stats for dashboard (clinic view): today vs yesterday for trends.
 * Uses report-service-style stats from adapter.
 *
 * @param {string} tenantId
 * @param {string} [userId] - For audit when adapter uses it
 * @param {import('../context.js').DashboardAdapter} adapter
 * @returns {Promise<TodayStats>}
 */
export async function getTodayStats(tenantId, userId, adapter) {
  validateAdapter(adapter);
  if (!tenantId) return buildEmptyTodayStats();

  const stats = await adapter.getReportDashboardStats(tenantId, userId || '');
  if (!stats) return buildEmptyTodayStats();

  return {
    todayAppointments: stats.todayAppointments ?? 0,
    todayRevenue: stats.todayRevenue ?? 0,
    monthRevenue: stats.monthRevenue ?? 0,
    activePatients: stats.activePatients ?? 0,
    newPatientsThisMonth: stats.newPatientsThisMonth ?? 0,
    completedToday: stats.completedToday ?? 0,
    pendingInvoices: stats.pendingInvoices ?? 0,
    appointmentsTrend: stats.appointmentsTrend ?? 0,
    revenueTrend: stats.revenueTrend ?? 0,
    patientsTrend: stats.patientsTrend ?? 0,
    newPatientsTrend: stats.newPatientsTrend ?? 0,
    completionTrend: stats.completionTrend ?? 0,
    invoicesTrend: stats.invoicesTrend ?? 0,
  };
}

function buildEmptyTodayStats() {
  return {
    todayAppointments: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    activePatients: 0,
    newPatientsThisMonth: 0,
    completedToday: 0,
    pendingInvoices: 0,
    appointmentsTrend: 0,
    revenueTrend: 0,
    patientsTrend: 0,
    newPatientsTrend: 0,
    completionTrend: 0,
    invoicesTrend: 0,
  };
}
