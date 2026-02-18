/**
 * Dashboard-engine adapter: implements all data access for metrics, trends, and actions.
 * Clinic UI never touches DB directly; API routes call dashboard-engine with this adapter.
 */

import connectDB from '@/lib/db/connection';
import { getDoctorDashboardData } from '@/services/dashboard-doctor.service';
import { getDashboardStats } from '@/services/report.service';
import { listAppointments } from '@/services/appointment.service';
import { getLowStockItems, getAllLots } from '@/services/inventory.service';
import Invoice from '@/models/Invoice';

/** Raw clinic stats (appointments, revenue, patients, queue) for getClinicSummary. */
async function getClinicStats(tenantId) {
  const { calculateDashboardStats } = await import('@/jobs/dashboard-stats.js');
  return calculateDashboardStats(tenantId);
}

/** Report dashboard stats with trends for getTodayStats, getRevenueTrend, getPatientFlow. */
async function getReportDashboardStats(tenantId, userId) {
  await connectDB();
  return getDashboardStats(tenantId, userId);
}

/** Doctor dashboard raw data for getDoctorSummary. */
async function getDoctorDashboard(tenantId, userId) {
  return getDoctorDashboardData(tenantId, userId);
}

/** Raw data for getAlerts: overdue invoices, low stock, expiring lots, urgent appointments. */
async function getAlertsRaw(tenantId, options = {}) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  const [todayAppointments, overdueInvoices, lowStock, expiringLots] = await Promise.all([
    listAppointments({ date: today, limit: '20' }, tenantId, null).then((r) => (r?.data ?? []).slice(0, 20)),
    getOverdueInvoices(tenantId),
    getLowStockItems(tenantId, null).then((arr) => (Array.isArray(arr) ? arr : []).slice(0, 10)),
    getAllLots(tenantId, null, { expiringSoon: true }).then((arr) => (Array.isArray(arr) ? arr : []).slice(0, 10)),
  ]);

  const urgentAppointments = (todayAppointments || []).filter((apt) => {
    const t = new Date(apt.appointmentDate || apt.date);
    return t >= now && t <= oneHourLater;
  });

  return {
    overdueInvoices,
    lowStock,
    expiringLots,
    expiringLotsMessage: expiringLots.length > 0 ? `${expiringLots.length} lot(s) expiring soon` : undefined,
    urgentAppointments,
  };
}

async function getOverdueInvoices(tenantId) {
  await connectDB();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const list = await Invoice.find({
    tenantId,
    status: { $in: ['pending', 'partial'] },
    dueDate: { $lt: todayStart },
    deletedAt: null,
  })
    .limit(10)
    .lean();
  return list || [];
}

/** Revenue trend raw: current and previous period, derived from report stats. */
async function getRevenueTrendRaw(tenantId, options = {}) {
  const stats = await getReportDashboardStats(tenantId, '');
  if (!stats) return { current: 0, previous: 0, period: options.period || 'day' };
  const current = stats.todayRevenue ?? 0;
  const trend = stats.revenueTrend ?? 0;
  const previous = trend !== 0 ? current / (1 + trend / 100) : 0;
  return { current, previous, period: options.period || 'day' };
}

/** Patient flow raw: new/active patients, derived from report stats. */
async function getPatientFlowRaw(tenantId, options = {}) {
  const stats = await getReportDashboardStats(tenantId, '');
  if (!stats) return { newPatients: 0, previousNew: 0, activePatients: 0, period: options.period || 'month' };
  const newPatients = stats.newPatientsThisMonth ?? 0;
  const trend = stats.patientsTrend ?? stats.newPatientsTrend ?? 0;
  const previousNew = trend !== 0 ? newPatients / (1 + trend / 100) : 0;
  return {
    newPatients,
    previousNew,
    activePatients: stats.activePatients ?? 0,
    period: options.period || 'month',
  };
}

/** Assign staff to role/clinic. Delegates to user service when available. */
async function assignStaff(tenantId, payload) {
  try {
    const { updateUserRole } = await import('@/services/user.service').catch(() => ({}));
    if (typeof updateUserRole === 'function') {
      await updateUserRole({ tenantId, ...payload });
      return { success: true };
    }
    return { success: false, error: 'Assign staff not implemented' };
  } catch (err) {
    return { success: false, error: err?.message || 'Assign staff failed' };
  }
}

/** Retry failed payment via PayPal service. */
async function retryPayment(tenantId, payload) {
  try {
    const { retryPayPalPayment } = await import('@/services/paypal.service');
    const subscriptionId = payload?.subscriptionId;
    const maxRetries = payload?.maxRetries ?? 3;
    if (!subscriptionId) return { success: false, error: 'subscriptionId required' };
    await retryPayPalPayment(subscriptionId, maxRetries);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message || 'Retry payment failed' };
  }
}

/** Single adapter instance for dashboard-engine. Use in API routes only. */
export const dashboardEngineAdapter = {
  getClinicStats,
  getReportDashboardStats,
  getDoctorDashboard,
  getAlertsRaw,
  getRevenueTrendRaw,
  getPatientFlowRaw,
  assignStaff,
  retryPayment,
};
