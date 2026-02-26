/**
 * GET /api/dashboard/summary
 * KPI summary – reads ONLY from clinic_dashboard_metrics.
 * Enterprise: consistent { success, data, error } response shape.
 */

import CacheManager from '@/lib/cache/cache-manager.js';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import ClinicDashboardMetrics from '@/models/ClinicDashboardMetrics.js';
import { getClinicSummaryFromMetrics } from '@clinic-saas/dashboard-engine';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  const tenantId = user.tenantId?.toString?.() || user.tenantId;

  // Super admin has no tenantId; return empty summary (they use /admin/stats)
  if (user.role === 'super_admin' && !tenantId) {
    const empty = getClinicSummaryFromMetrics(null);
    return NextResponse.json(successResponse({ ...empty, failed_transactions: 0 }));
  }

  if (!tenantId) {
    return NextResponse.json(errorResponse('Tenant context required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }

  const start = Date.now();
  try {
    const metrics = await ClinicDashboardMetrics.findOne({ tenantId }).lean();
    if (metrics) {
      const summary = getClinicSummaryFromMetrics(metrics);
      const data = { ...summary, failed_transactions: metrics.failed_transactions ?? 0 };
      const duration = Date.now() - start;
      return NextResponse.json(successResponse({ ...data, fromMetrics: true }), {
        headers: { 'Server-Timing': `summary;dur=${duration}` },
      });
    }

    // Fallback: use existing cache (until update-dashboard-metrics populates table)
    const cached = await CacheManager.get('dashboard', 'stats', tenantId);
    if (cached) {
      const metricsDoc = {
        tenantId,
        data: {
          appointments: cached.appointments || {},
          revenue: cached.revenue || {},
          patients: cached.patients || {},
          queue: cached.queue || {},
        },
        revenue_today: cached?.revenue?.today?.paid ?? cached?.revenue?.today?.total ?? 0,
        pending_appointments: cached?.appointments?.todayTotal ?? 0,
        today_patients: cached?.patients?.total ?? 0,
        updated_at: cached?.lastUpdated || new Date(),
      };
      const summary = getClinicSummaryFromMetrics(metricsDoc);
      const data = { ...summary, failed_transactions: cached?.failedTransactions ?? 0 };
      const duration = Date.now() - start;
      return NextResponse.json(successResponse({ ...data, fromCache: true }), {
        headers: { 'Server-Timing': `summary;dur=${duration}` },
      });
    }

    const empty = getClinicSummaryFromMetrics(null);
    const data = { ...empty, failed_transactions: 0 };
    const duration = Date.now() - start;
    return NextResponse.json(successResponse(data), {
      headers: { 'Server-Timing': `summary;dur=${duration}` },
    });
  } catch (error) {
    return NextResponse.json(errorResponse('Failed to fetch summary', 'INTERNAL_ERROR'), {
      status: 500,
    });
  }
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
);
