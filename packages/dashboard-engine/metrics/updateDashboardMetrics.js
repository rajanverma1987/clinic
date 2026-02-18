/**
 * updateDashboardMetrics – background aggregator.
 * Pulls from raw tables via adapter, computes daily stats, updates clinic_dashboard_metrics.
 * Run via cron every 1 minute (scripts/update-dashboard-metrics.js).
 *
 * @param {string} tenantId
 * @param {import('../context.js').MetricsAggregatorAdapter} adapter
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function updateDashboardMetrics(tenantId, adapter) {
  if (!tenantId || !adapter) {
    return { success: false, error: 'tenantId and adapter are required' };
  }
  try {
    const raw = await adapter.pullRawStats(tenantId);
    if (!raw) return { success: false, error: 'No raw stats' };

    const metrics = {
      tenantId,
      today_patients: raw.todayPatients ?? 0,
      revenue_today: raw.revenueToday ?? 0,
      failed_transactions: raw.failedTransactions ?? 0,
      pending_appointments: raw.pendingAppointments ?? 0,
      active_staff: raw.activeStaff ?? 0,
      data: raw.data ?? {},
      updated_at: new Date(),
    };

    await adapter.saveMetrics(tenantId, metrics);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || String(err) };
  }
}
