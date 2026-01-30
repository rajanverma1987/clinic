/**
 * Mark Message as Read API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Message, { MessageStatus } from '@/models/Message';
import { withTenant } from '@/lib/db/tenant-helper';
import { logger } from '@/lib/utils/logger.js';

/**
 * PUT /api/messages/[id]/read
 * Mark message as read
 */
async function putHandler(req, user, { params }) {
  await connectDB();

  const messageId = params.id;

  try {
    const message = await Message.findOneAndUpdate(
      withTenant(user.tenantId, {
        _id: messageId,
        to: user.userId,
        deletedAt: null,
      }),
      {
        $set: {
          status: MessageStatus.READ,
          readAt: new Date(),
        },
      },
      { new: true }
    )
      .populate('from', 'firstName lastName email profilePhoto')
      .populate('to', 'firstName lastName email profilePhoto')
      .lean();

    if (!message) {
      return NextResponse.json(errorResponse('Message not found', 'NOT_FOUND'), { status: 404 });
    }

    return NextResponse.json(successResponse(message));
  } catch (err) {
    logger.error('Failed to mark message as read:', err);
    return NextResponse.json(errorResponse('Failed to mark as read', 'UPDATE_ERROR'), {
      status: 500,
    });
  }
}

export const PUT = withErrorHandler(apiRateLimit(withAuth(putHandler)));
