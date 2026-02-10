import CacheManager from '@/lib/cache/cache-manager.js';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

/** Server-side cache TTL for dashboard stats (seconds). Redis optional; fails gracefully. */
const DASHBOARD_CACHE_TTL = 300; // 5 minutes - matches background job interval

/**
 * Load calculateDashboardStats from jobs file (CommonJS)
 */
async function getCalculateDashboardStats() {
  const dashboardStatsModule = await import('@/jobs/dashboard-stats.js');
  return dashboardStatsModule.calculateDashboardStats;
}

/**
 * POST /api/reports/dashboard/refresh
 * Force refresh dashboard stats (bypasses cache).
 */
async function postHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    const calculateDashboardStats = await getCalculateDashboardStats();
    const stats = await calculateDashboardStats(tenantId);
    await CacheManager.set('dashboard', stats, DASHBOARD_CACHE_TTL, 'stats', tenantId);

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics refreshed',
    });
  } catch (error) {
    logger.error('Dashboard refresh error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to refresh dashboard statistics',
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.UPDATE)(postHandler))),
);
