/**
 * POST /api/dashboard/stats/refresh
 * Force refresh dashboard statistics via dashboard-engine (bypasses cache).
 */

import { getClinicSummary } from '@clinic-saas/dashboard-engine';
import CacheManager from '@/lib/cache/cache-manager.js';
import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { optimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

const DASHBOARD_CACHE_TTL = 300;

async function postHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    const stats = await getClinicSummary(tenantId, dashboardEngineAdapter);

    if (stats) {
      await CacheManager.set('dashboard', stats, DASHBOARD_CACHE_TTL, 'stats', tenantId);
      optimizedCacheManager.set(`dashboard:stats:${tenantId}`, stats, DASHBOARD_CACHE_TTL * 1000);
    }

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Dashboard stats refresh error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refresh dashboard statistics', error: error.message },
      { status: 500 },
    );
  }
}

export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(postHandler))),
);
