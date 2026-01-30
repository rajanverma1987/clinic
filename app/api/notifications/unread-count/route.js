/**
 * Unread Notification Count API Route
 * 
 * Returns the count of unread notifications for the current user
 * 
 * @module app/api/notifications/unread-count/route
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import Notification from '@/models/Notification.js';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
async function getHandler(req, user) {
  try {
    await connectDB();
    
    const tenantId = user.tenantId;
    const userId = user.userId;

    const count = await Notification.countDocuments(
      withTenant(tenantId, {
        userId,
        'channels.inApp.read': { $ne: true },
      })
    );

    return NextResponse.json(
      successResponse({
        count,
      })
    );
  } catch (error) {
    logger.error('Failed to get unread notification count', error);
    return NextResponse.json(
      errorResponse('Failed to get unread count', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export const GET = withErrorHandler(
  withAuth(getHandler)
);
