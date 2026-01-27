/**
 * Mark Notification as Read API Route
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
 * PUT /api/notifications/[id]/read
 * Mark notification as read
 */
async function putHandler(req, user, { params }) {
  await connectDB();

  const notificationId = params.id;

  try {
    const notification = await Notification.findOneAndUpdate(
      withTenant(user.tenantId, {
        _id: notificationId,
        userId: user.userId,
      }),
      {
        $set: {
          'channels.inApp.read': true,
          'channels.inApp.readAt': new Date(),
        },
      },
      { new: true }
    );

    // Emit real-time update
    try {
      const { emitNotificationUpdate } = await import('@/lib/realtime/realtime-manager.js');
      emitNotificationUpdate(user.tenantId, user.userId, {
        _id: notification._id.toString(),
        channels: notification.channels,
      });
    } catch (realtimeError) {
      logger.warn('Failed to emit real-time notification update', realtimeError);
    }

    if (!notification) {
      return NextResponse.json(errorResponse('Notification not found', 'NOT_FOUND'), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse(notification));
  } catch (err) {
    logger.error('Failed to mark notification as read:', err);
    return NextResponse.json(errorResponse('Failed to mark as read', 'UPDATE_ERROR'), {
      status: 500,
    });
  }
}

export const PUT = withErrorHandler(apiRateLimit(withAuth(putHandler)));
