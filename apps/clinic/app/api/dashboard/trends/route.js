/**
 * GET /api/dashboard/trends
 * Revenue + patient trends. CursorMD/new fix.md: check cache before DB (trends 300s).
 */

import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { DEFAULT_TTL, getCache, setCache } from '@clinic-saas/config';
import { getPatientFlow, getRevenueTrend } from '@clinic-saas/dashboard-engine';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  const tenantId = user.tenantId?.toString?.() || user.tenantId;
  if (!tenantId) {
    return NextResponse.json(
      { success: false, message: 'Tenant context required' },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'day';
  const start = Date.now();
  const cacheKey = `trends:${tenantId}:${period}`;

  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      const duration = Date.now() - start;
      return NextResponse.json(
        { success: true, data: cached, fromCache: true },
        { headers: { 'Server-Timing': `trends;dur=${duration}` } },
      );
    }

    const [revenue, patientFlow] = await Promise.all([
      getRevenueTrend(tenantId, { period }, dashboardEngineAdapter),
      getPatientFlow(tenantId, { period }, dashboardEngineAdapter),
    ]);
    const data = { revenue, patientFlow };
    await setCache(cacheKey, data, DEFAULT_TTL.trends);

    const duration = Date.now() - start;
    return NextResponse.json(
      { success: true, data },
      { headers: { 'Server-Timing': `trends;dur=${duration}` } },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch trends', error: error?.message },
      { status: 500 },
    );
  }
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler))),
);
