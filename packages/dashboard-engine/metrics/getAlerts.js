import { validateAdapter } from '../context.js';

/**
 * Critical alerts for dashboard: overdue invoices, low stock, expiring lots, urgent appointments.
 * Uses adapter only; no DB access.
 *
 * @param {string} tenantId
 * @param {GetAlertsOptions} [options]
 * @param {import('../context.js').DashboardAdapter} adapter
 * @returns {Promise<AlertItem[]>}
 */
export async function getAlerts(tenantId, options, adapter) {
  validateAdapter(adapter);
  if (!tenantId) return [];

  const raw = await adapter.getAlertsRaw(tenantId, options || {});
  if (!raw) return [];

  const alerts = [];

  if (raw.overdueInvoices && raw.overdueInvoices.length > 0) {
    alerts.push({
      type: 'invoice',
      severity: 'warning',
      message: `${raw.overdueInvoices.length} overdue invoice(s) require attention`,
      count: raw.overdueInvoices.length,
    });
  }

  if (raw.lowStock && raw.lowStock.length > 0) {
    alerts.push({
      type: 'inventory',
      severity: 'error',
      message: `${raw.lowStock.length} item(s) running low on stock`,
      count: raw.lowStock.length,
    });
  }

  if (raw.expiringLots && raw.expiringLots.length > 0) {
    alerts.push({
      type: 'lot',
      severity: 'warning',
      message: raw.expiringLotsMessage || `${raw.expiringLots.length} lot(s) expiring soon`,
      count: raw.expiringLots.length,
    });
  }

  if (raw.urgentAppointments && raw.urgentAppointments.length > 0) {
    alerts.push({
      type: 'appointments',
      severity: 'info',
      message: `${raw.urgentAppointments.length} appointment(s) starting within the next hour`,
      count: raw.urgentAppointments.length,
    });
  }

  return alerts;
}
