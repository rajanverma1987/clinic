/**
 * POST /api/dashboard/actions
 * assignStaff | retryPayment. Calls dashboard-engine.
 * Enterprise: consistent { success, data, error: { message, code } } response shape.
 */

import { assignStaff, retryPayment } from '@clinic-saas/dashboard-engine';
import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { notifyStaffAssignment } from '@/lib/realtime/integration-helpers';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

async function postHandler(req, user) {
  const tenantId = user.tenantId?.toString?.() || user.tenantId;
  if (!tenantId) {
    return NextResponse.json(errorResponse('Tenant context required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(errorResponse('Invalid JSON', 'VALIDATION_ERROR'), { status: 400 });
  }

  const { action } = body;
  if (!action) {
    return NextResponse.json(errorResponse('action required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }

  try {
    let result;
    if (action === 'assignStaff') {
      result = await assignStaff(tenantId, body.payload || body, dashboardEngineAdapter);
      if (result?.success) {
        notifyStaffAssignment(tenantId, body.payload || body).catch(() => {});
      }
    } else if (action === 'retryPayment') {
      result = await retryPayment(tenantId, body.payload || body, dashboardEngineAdapter);
    } else {
      return NextResponse.json(errorResponse('Unknown action', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }

    if (result?.success) {
      return NextResponse.json(successResponse(result));
    }
    return NextResponse.json(
      errorResponse(result?.error || 'Action failed', 'ACTION_FAILED'),
      { status: 422 },
    );
  } catch (error) {
    logger.error('Dashboard action failed', { action, message: error?.message });
    return NextResponse.json(
      errorResponse(error?.message || 'Action failed', 'INTERNAL_ERROR'),
      { status: 500 },
    );
  }
}

export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(postHandler))),
);
