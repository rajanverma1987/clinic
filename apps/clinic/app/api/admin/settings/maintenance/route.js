/**
 * GET/PUT /api/admin/settings/maintenance
 * Maintenance mode toggle — Super Admin only
 */

import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import SystemSettings from '@/models/SystemSettings';
import { NextResponse } from 'next/server';

const SLUG = 'platform';

async function getHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const doc = await SystemSettings.findOne({ slug: SLUG }).select('maintenanceMode').lean();
  return NextResponse.json(
    successResponse({ maintenanceMode: !!doc?.maintenanceMode }),
  );
}

async function putHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const maintenanceMode = !!body.maintenanceMode;
  await connectDB();
  await SystemSettings.findOneAndUpdate(
    { slug: SLUG },
    { $set: { maintenanceMode, updatedAt: new Date() } },
    { upsert: true },
  );
  return NextResponse.json(successResponse({ maintenanceMode }));
}

export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler))),
  ),
);
export const PUT = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.UPDATE)(putHandler))),
  ),
);
