/**
 * getClinicSummaryFromMetrics – reads ONLY from clinic_dashboard_metrics.
 * Caller must fetch the metrics doc from the table; this function never queries DB.
 *
 * @param {Object} metricsDoc - Row from clinic_dashboard_metrics
 * @returns {Object} ClinicSummary
 */
export function getClinicSummaryFromMetrics(metricsDoc) {
  if (!metricsDoc) return buildEmptyClinicSummary();

  const data = metricsDoc.data || {};
  const appointments = data.appointments || {};
  const revenue = data.revenue || {};
  const patients = data.patients || {};
  const queue = data.queue || {};

  return {
    appointments: {
      today: appointments.today || {},
      todayTotal: appointments.todayTotal ?? metricsDoc.pending_appointments ?? 0,
      thisMonth: appointments.thisMonth ?? 0,
      total: appointments.total ?? 0,
      upcoming: appointments.upcoming ?? 0,
    },
    revenue: {
      today: revenue.today || { total: metricsDoc.revenue_today ?? 0, paid: metricsDoc.revenue_today ?? 0 },
      thisMonth: revenue.thisMonth || { total: 0, paid: 0 },
    },
    patients: {
      total: patients.total ?? metricsDoc.today_patients ?? 0,
      active: patients.active ?? 0,
    },
    queue: queue || {},
    lastUpdated: metricsDoc.updated_at || new Date(),
    timestamp: metricsDoc.updated_at ? new Date(metricsDoc.updated_at).getTime() : Date.now(),
  };
}

function buildEmptyClinicSummary() {
  return {
    appointments: { today: {}, todayTotal: 0, thisMonth: 0, total: 0, upcoming: 0 },
    revenue: { today: { total: 0, paid: 0 }, thisMonth: { total: 0, paid: 0 } },
    patients: { total: 0, active: 0 },
    queue: {},
    lastUpdated: new Date(),
    timestamp: Date.now(),
  };
}
