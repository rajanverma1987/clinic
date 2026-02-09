/**
 * Process Reminders API Route
 * This should be called by a cron job
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse } from '@/lib/utils/api-response';
import { processAllReminders } from '@/services/reminder.service';

/**
 * POST /api/reminders/process
 * Process all pending reminders (appointments, payments, prescriptions)
 * This endpoint should be called by a cron job
 */
async function postHandler(req, user) {
  const results = await processAllReminders(user.tenantId);

  return NextResponse.json(
    successResponse({
      message: 'Reminders processed',
      results,
    })
  );
}

// Apply middleware stack (system/admin only)
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.MANAGE)(postHandler)
    )
  )
);
