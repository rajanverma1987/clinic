/**
 * GET /api/dashboard/widgets
 *
 * Combined dashboard widgets endpoint — replaces 8 parallel HTTP calls with a
 * single server-side parallel fetch. All DB queries run in one request,
 * share the same auth/middleware stack, and the result is cached 60 s in-memory.
 *
 * Shape matches EMPTY_LISTS_PAYLOAD in hooks/useSWRDashboard.js.
 */

import { optimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { listAppointments } from '@/services/appointment.service';
import { listInvoices } from '@/services/billing.service';
import { getLowStockItems, getAllLots } from '@/services/inventory.service';
import { listPrescriptions } from '@/services/prescription.service';
import { searchPatients } from '@/services/patient.service';
import { listQueueEntries } from '@/services/queue.service';
import { NextResponse } from 'next/server';

const WIDGETS_CACHE_TTL_MS = 60_000; // 60 seconds

async function getHandler(req, user) {
  const tenantId = user.tenantId?.toString?.() || user.tenantId;
  const userId = user.userId || user.id;

  const data = await optimizedCacheManager.getOrFetch(
    `dashboard:widgets:${tenantId}`,
    async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const [
        todayAptsRes,
        patientsRes,
        invoicesRes,
        lowStockRes,
        prescriptionsRes,
        queueRes,
        lotsRes,
        requestsRes,
      ] = await Promise.allSettled([
        listAppointments({ date: today, limit: '5' }, tenantId, userId),
        searchPatients({ limit: '5', sortBy: 'createdAt', sortOrder: 'desc' }, tenantId, userId),
        listInvoices({ status: 'pending', limit: '5' }, tenantId, userId),
        getLowStockItems(tenantId, userId),
        listPrescriptions({ status: 'active', limit: '5' }, tenantId, userId),
        listQueueEntries({ status: 'waiting', limit: '100' }, tenantId, userId),
        getAllLots(tenantId, userId, { expiringSoon: true }),
        // 'pending' maps to 'scheduled' in the route; call service directly with 'scheduled'
        listAppointments({ status: 'scheduled', limit: '5' }, tenantId, userId),
      ]);

      // All list services return { data: [], pagination: {} } via createPaginationResult.
      // getLowStockItems and getAllLots return arrays directly.
      const todayAppointments = (todayAptsRes.status === 'fulfilled'
        ? (todayAptsRes.value?.data ?? [])
        : []
      ).slice(0, 5);

      const recentPatients = (patientsRes.status === 'fulfilled'
        ? (patientsRes.value?.data ?? [])
        : []
      ).slice(0, 5);

      const overdueInvoices = (invoicesRes.status === 'fulfilled'
        ? (invoicesRes.value?.data ?? [])
        : []
      ).slice(0, 5);

      const lowStockList = (lowStockRes.status === 'fulfilled' && Array.isArray(lowStockRes.value)
        ? lowStockRes.value
        : []
      ).slice(0, 5);

      const prescriptionRefills = (prescriptionsRes.status === 'fulfilled'
        ? (prescriptionsRes.value?.data ?? [])
        : []
      ).slice(0, 5);

      const queueRaw = queueRes.status === 'fulfilled'
        ? (queueRes.value?.data ?? [])
        : [];
      const queueStatus = {
        active: queueRaw.filter((q) => q.status === 'waiting' || q.status === 'in_progress').length,
        waiting: queueRaw.filter((q) => q.status === 'waiting').length,
        inProgress: queueRaw.filter((q) => q.status === 'in_progress').length,
      };

      const expiringLots = (lotsRes.status === 'fulfilled' && Array.isArray(lotsRes.value)
        ? lotsRes.value
        : []
      ).slice(0, 5);

      const appointmentRequests = (requestsRes.status === 'fulfilled'
        ? (requestsRes.value?.data ?? [])
        : []
      ).slice(0, 5);

      // Critical alerts — computed server-side (previously done client-side)
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const urgentCount = todayAppointments.filter((apt) => {
        const t = new Date(apt.appointmentDate || apt.date);
        return t >= now && t <= oneHourLater;
      }).length;

      const criticalAlerts = [];
      if (urgentCount > 0) {
        criticalAlerts.push({
          type: 'appointment',
          severity: 'info',
          message: `${urgentCount} appointment(s) starting within the next hour`,
          count: urgentCount,
        });
      }
      if (overdueInvoices.length > 0) {
        criticalAlerts.push({
          type: 'invoice',
          severity: 'warning',
          message: `${overdueInvoices.length} overdue invoice(s) require attention`,
          count: overdueInvoices.length,
        });
      }
      if (lowStockList.length > 0) {
        criticalAlerts.push({
          type: 'inventory',
          severity: 'error',
          message: `${lowStockList.length} item(s) running low on stock`,
          count: lowStockList.length,
        });
      }
      if (expiringLots.length > 0) {
        criticalAlerts.push({
          type: 'lot',
          severity: 'warning',
          message: `${expiringLots.length} lot(s) expiring soon`,
          count: expiringLots.length,
        });
      }

      // Log any individual service failures at debug level (non-fatal)
      [todayAptsRes, patientsRes, invoicesRes, lowStockRes, prescriptionsRes, queueRes, lotsRes, requestsRes]
        .forEach((r, i) => {
          if (r.status === 'rejected') {
            logger.debug(`Dashboard widget service[${i}] failed:`, r.reason?.message);
          }
        });

      return {
        todayAppointments,
        recentPatients,
        overdueInvoices,
        lowStockList,
        prescriptionRefills,
        queueStatus,
        criticalAlerts,
        expiringLots,
        appointmentRequests,
      };
    },
    WIDGETS_CACHE_TTL_MS,
  );

  return NextResponse.json({ success: true, data });
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
);
