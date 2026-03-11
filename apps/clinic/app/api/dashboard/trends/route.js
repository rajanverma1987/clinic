/**
 * GET /api/dashboard/trends
 * Revenue + patient trends. Single getDashboardStats call then derive both trends.
 */

import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

function buildRevenueTrend(stats, period) {
  const current = stats?.todayRevenue ?? 0;
  const trend = stats?.revenueTrend ?? 0;
  const previous = trend !== 0 ? current / (1 + trend / 100) : 0;
  const trendPercent =
    previous > 0 ? parseFloat((((current - previous) / previous) * 100).toFixed(1)) : current > 0 ? 100 : 0;
  return { current, previous, trendPercent, period: period || 'day' };
}

function buildPatientFlow(stats, period) {
  const newPatients = stats?.newPatientsThisMonth ?? 0;
  const trend = stats?.patientsTrend ?? stats?.newPatientsTrend ?? 0;
  const previousNew = trend !== 0 ? newPatients / (1 + trend / 100) : 0;
  const trendPercent =
    previousNew > 0 ? parseFloat((((newPatients - previousNew) / previousNew) * 100).toFixed(1)) : newPatients > 0 ? 100 : 0;
  return {
    newPatients,
    activePatients: stats?.activePatients ?? 0,
    trendPercent,
    period: period || 'month',
  };
}

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

  try {
    const stats = await dashboardEngineAdapter.getReportDashboardStats(tenantId, user.userId || user.id);
    const revenue = buildRevenueTrend(stats, period);
    const patientFlow = buildPatientFlow(stats, period);
    const data = { revenue, patientFlow };
    return NextResponse.json({ success: true, data });
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
