/**
 * POST /api/dashboard/stats/refresh
 * Force refresh dashboard statistics (bypasses cache).
 * Calculates fresh stats and updates cache.
 * Matches ENTERPRISE_DASHBOARD_PERFORMANCE.md spec.
 */

import CacheManager from '@/lib/cache/cache-manager.js';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

/** Server-side cache TTL for dashboard stats (seconds). */
const DASHBOARD_CACHE_TTL = 300; // 5 minutes - matches background job interval

async function postHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    // Calculate fresh stats
    const dashboardStatsModule = await import('@/jobs/dashboard-stats.js');
    const calculateDashboardStats = dashboardStatsModule.calculateDashboardStats;
    const stats = await calculateDashboardStats(tenantId);

    // Update cache
    if (stats) {
      await CacheManager.set('dashboard', stats, DASHBOARD_CACHE_TTL, 'stats', tenantId);
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Dashboard stats refresh error:', error);
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

export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(postHandler))),
);
