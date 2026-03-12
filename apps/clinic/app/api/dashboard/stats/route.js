import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import ClinicDashboardMetrics from '@/models/ClinicDashboardMetrics.js';
import { getClinicSummary, getClinicSummaryFromMetrics } from '@clinic-saas/dashboard-engine';
import { NextResponse } from 'next/server';

/**
 * GET /api/dashboard/stats
 * Dashboard statistics via dashboard-engine. Prefer ClinicDashboardMetrics; else compute via getClinicSummary.
 */
async function getHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    // Super admin has no tenantId; return empty stats so UI doesn't break (they use /admin/stats)
    if (user.role === 'super_admin' && !tenantId) {
      return NextResponse.json({
        success: true,
        data: {
          appointments: { today: 0, completed: 0, upcoming: 0 },
          revenue: { today: 0, monthTotal: 0 },
          patients: { total: 0, newThisMonth: 0 },
          invoices: { pending: 0, paid: 0 },
          lastUpdated: new Date().toISOString(),
        },
        fromCache: false,
      });
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Tenant context required' },
        { status: 400 },
      );
    }

    const metrics = await ClinicDashboardMetrics.findOne({ tenantId }).lean();
    const stats = metrics?.data
      ? getClinicSummaryFromMetrics(metrics)
      : await getClinicSummary(tenantId, dashboardEngineAdapter);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
);
