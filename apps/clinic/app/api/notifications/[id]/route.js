/**
 * Notification Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import {
  getNotificationById,
  markNotificationAsRead,
  deleteNotification,
} from '@/services/notification.service';

/**
 * GET /api/notifications/[id]
 * Get notification by ID
 */
async function getHandler(req, user, { params }) {
  const notificationId = params.id;

  const notification = await getNotificationById(notificationId, user.tenantId, user.userId);

  if (!notification) {
    return NextResponse.json(
      errorResponse('Notification not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(notification));
}

/**
 * PUT /api/notifications/[id]/read
 * Mark notification as read
 */
async function putHandler(req, user, { params }) {
  const notificationId = params.id;

  const notification = await markNotificationAsRead(notificationId, user.tenantId, user.userId);

  if (!notification) {
    return NextResponse.json(
      errorResponse('Notification not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(notification));
}

/**
 * DELETE /api/notifications/[id]
 * Delete notification
 */
async function deleteHandler(req, user, { params }) {
  const notificationId = params.id;

  const deleted = await deleteNotification(notificationId, user.tenantId, user.userId);

  if (!deleted) {
    return NextResponse.json(
      errorResponse('Notification not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Notification deleted successfully' }));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NOTIFICATION, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
