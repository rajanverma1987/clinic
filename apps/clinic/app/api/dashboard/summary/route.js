/**
 * GET /api/dashboard/summary
 * KPI summary – reads ONLY from clinic_dashboard_metrics.
 * Instant load (<200ms). Falls back to existing stats if metrics not yet populated.
 */

import ClinicDashboardMetrics from '@/models/ClinicDashboardMetrics.js';
import CacheManager from '@/lib/cache/cache-manager.js';
import { getClinicSummaryFromMetrics } from '@clinic-saas/dashboard-engine';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  const tenantId = user.tenantId?.toString?.() || user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, message: 'Tenant context required' }, { status: 400 });
  }

  const start = Date.now();
  try {
    const metrics = await ClinicDashboardMetrics.findOne({ tenantId }).lean();
    if (metrics) {
      const summary = getClinicSummaryFromMetrics(metrics);
      const data = { ...summary, failed_transactions: metrics.failed_transactions ?? 0 };
      const duration = Date.now() - start;
      return NextResponse.json({ success: true, data, fromMetrics: true }, {
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
      return NextResponse.json({ success: true, data, fromCache: true }, {
        headers: { 'Server-Timing': `summary;dur=${duration}` },
      });
    }

    const empty = getClinicSummaryFromMetrics(null);
    const data = { ...empty, failed_transactions: 0 };
    const duration = Date.now() - start;
    return NextResponse.json({ success: true, data }, {
      headers: { 'Server-Timing': `summary;dur=${duration}` },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch summary', error: error?.message },
      { status: 500 },
    );
  }
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
);
