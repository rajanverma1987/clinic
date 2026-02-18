import { validateAdapter } from '../context.js';

/**
 * Clinic summary for dashboard: appointments, revenue, patients, queue.
 * Uses adapter only; no DB access.
 *
 * @param {string} tenantId
 * @param {import('../context.js').DashboardAdapter} adapter
 * @returns {Promise<ClinicSummary>}
 */
export async function getClinicSummary(tenantId, adapter) {
  validateAdapter(adapter);
  if (!tenantId) return buildEmptyClinicSummary();

  const raw = await adapter.getClinicStats(tenantId);
  if (!raw) return buildEmptyClinicSummary();

  const appointments = raw.appointments || {};
  const revenue = raw.revenue || {};
  const patients = raw.patients || {};
  const queue = raw.queue || {};

  return {
    appointments: {
      today: appointments.today || {},
      todayTotal: appointments.todayTotal ?? 0,
      thisMonth: appointments.thisMonth ?? 0,
      total: appointments.total ?? 0,
      upcoming: appointments.upcoming ?? 0,
    },
    revenue: {
      today: revenue.today || { total: 0, paid: 0 },
      thisMonth: revenue.thisMonth || { total: 0, paid: 0 },
    },
    patients: {
      total: patients.total ?? 0,
      active: patients.active ?? 0,
    },
    queue,
    lastUpdated: raw.lastUpdated || new Date(),
    timestamp: raw.timestamp ?? Date.now(),
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
