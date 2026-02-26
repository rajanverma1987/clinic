/**
 * POST /api/dashboard/stats/refresh
 * Force refresh dashboard statistics via dashboard-engine (bypasses cache).
 * Enterprise: consistent { success, data, error } response shape.
 */

import CacheManager from '@/lib/cache/cache-manager.js';
import { optimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';
import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { getClinicSummary } from '@clinic-saas/dashboard-engine';
import { NextResponse } from 'next/server';

const DASHBOARD_CACHE_TTL = 300;

async function postHandler(req, user) {
  try {
    const tenantId = user.tenantId?.toString?.() || user.tenantId;

    if (user.role === 'super_admin' && !tenantId) {
      return NextResponse.json(
        successResponse({
          appointments: { today: 0, completed: 0, upcoming: 0 },
          revenue: { today: 0, monthTotal: 0 },
          patients: { total: 0, newThisMonth: 0 },
          invoices: { pending: 0, paid: 0 },
          lastUpdated: new Date().toISOString(),
        }),
      );
    }

    if (!tenantId) {
      return NextResponse.json(errorResponse('Tenant context required', 'MISSING_TENANT'), {
        status: 400,
      });
    }

    const stats = await getClinicSummary(tenantId, dashboardEngineAdapter);

    if (stats) {
      await CacheManager.set('dashboard', stats, DASHBOARD_CACHE_TTL, 'stats', tenantId);
      optimizedCacheManager.set(`dashboard:stats:${tenantId}`, stats, DASHBOARD_CACHE_TTL * 1000);
    }

    return NextResponse.json(successResponse(stats));
  } catch (error) {
    logger.error('Dashboard stats refresh failed', { code: error?.name, message: error?.message });
    return NextResponse.json(
      errorResponse('Failed to refresh dashboard statistics', 'INTERNAL_ERROR'),
      { status: 500 },
    );
  }
}

export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(postHandler))),
);
