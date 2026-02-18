/**
 * POST /api/dashboard/actions
 * assignStaff | retryPayment. Calls dashboard-engine.
 */

import { assignStaff, retryPayment } from '@clinic-saas/dashboard-engine';
import { dashboardEngineAdapter } from '@/lib/dashboard-engine-adapter';
import { notifyStaffAssignment } from '@/lib/realtime/integration-helpers';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { NextResponse } from 'next/server';

async function postHandler(req, user) {
  const tenantId = user.tenantId?.toString?.() || user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ success: false, message: 'Tenant context required' }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body;
  if (!action) {
    return NextResponse.json({ success: false, message: 'action required' }, { status: 400 });
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
      return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: result.success, data: result, error: result.error });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Action failed', error: error?.message },
      { status: 500 },
    );
  }
}

export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(postHandler))),
);
