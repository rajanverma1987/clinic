/**
 * Notifications API Route
 * Handle user notifications
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Notification from '@/models/Notification';
import { withTenant } from '@/lib/db/tenant-helper';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/notifications
 * Get notifications for current user
 */
async function getHandler(req, user) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    const notifications = await Notification.find(
      withTenant(user.tenantId, {
        userId: user.userId,
        deletedAt: null,
      })
    )
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      successResponse({
        notifications,
        total: notifications.length,
      })
    );
  } catch (err) {
    logger.error('Failed to fetch notifications:', err);
    return NextResponse.json(errorResponse('Failed to fetch notifications', 'FETCH_ERROR'), {
      status: 500,
    });
  }
}

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
async function postReadAllHandler(req, user) {
  await connectDB();

  try {
    await Notification.updateMany(
      withTenant(user.tenantId, {
        userId: user.userId,
        read: false,
        deletedAt: null,
      }),
      {
        $set: { read: true, readAt: new Date() },
      }
    );

    return NextResponse.json(successResponse({ message: 'All notifications marked as read' }));
  } catch (err) {
    logger.error('Failed to mark all as read:', err);
    return NextResponse.json(errorResponse('Failed to mark all as read', 'UPDATE_ERROR'), {
      status: 500,
    });
  }
}

// Apply middleware
export const GET = withErrorHandler(apiRateLimit(withAuth(getHandler)));
export const POST = withErrorHandler(apiRateLimit(withAuth(postReadAllHandler)));
