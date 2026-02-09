/**
 * Mark All Notifications as Read API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse } from '@/lib/utils/api-response';
import { markAllNotificationsAsRead } from '@/services/notification.service';

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
async function putHandler(req, user) {
  const result = await markAllNotificationsAsRead(user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    })
  );
}

// Apply middleware stack
export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.UPDATE)(putHandler)
    )
  )
);
