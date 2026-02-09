/**
 * Messages API Route
 * Handle doctor-patient messaging
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Message, { MessageFolder, MessageStatus } from '@/models/Message';
import { withTenant } from '@/lib/db/tenant-helper';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/messages
 * Get messages for current user
 */
async function getHandler(req, user) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder') || MessageFolder.INBOX;
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';

  try {
    // Build query based on folder
    let query = withTenant(user.tenantId, {
      deletedAt: null,
    });

    if (folder === MessageFolder.INBOX) {
      query.to = user.userId;
      query.folder = MessageFolder.INBOX;
    } else if (folder === MessageFolder.SENT) {
      query.from = user.userId;
      query.folder = MessageFolder.SENT;
    } else if (folder === MessageFolder.ARCHIVE) {
      query.$or = [
        { from: user.userId, folder: MessageFolder.ARCHIVE },
        { to: user.userId, folder: MessageFolder.ARCHIVE },
      ];
    }

    // Add search filter
    if (search) {
      query.$or = [
        ...(query.$or || []),
        { subject: new RegExp(search, 'i') },
        { message: new RegExp(search, 'i') },
      ];
    }

    // Early return optimization: Quick check if any messages exist
    const hasMessages = await Message.countDocuments(query);
    let messages = [];
    
    if (hasMessages > 0) {
      // Optimize: Use aggregation with $lookup instead of populate for better performance
      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'from',
            foreignField: '_id',
            as: 'fromUser',
            pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1, profilePhoto: 1 } }],
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'to',
            foreignField: '_id',
            as: 'toUser',
            pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1, profilePhoto: 1 } }],
          },
        },
        {
          $addFields: {
            from: { $arrayElemAt: ['$fromUser', 0] },
            to: { $arrayElemAt: ['$toUser', 0] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: limit },
      ];

      messages = await Message.aggregate(pipeline);
    }

    // Format messages
    const formattedMessages = messages.map((msg) => ({
      _id: msg._id,
      from: msg.from,
      to: msg.to,
      subject: msg.subject,
      message: msg.message,
      preview: msg.message.substring(0, 100) + (msg.message.length > 100 ? '...' : ''),
      folder: msg.folder,
      status: msg.status,
      read: msg.status === MessageStatus.READ,
      readAt: msg.readAt,
      createdAt: msg.createdAt,
      attachments: msg.attachments || [],
    }));

    // Get unread count
    const unreadCount = await Message.getUnreadCount(user.userId, user.tenantId, MessageFolder.INBOX);

    return NextResponse.json(
      successResponse({
        messages: formattedMessages,
        folder,
        total: formattedMessages.length,
        unreadCount,
      })
    );
  } catch (err) {
    logger.error('Failed to fetch messages:', err);
    return NextResponse.json(errorResponse('Failed to fetch messages', 'FETCH_ERROR'), {
      status: 500,
    });
  }
}

/**
 * POST /api/messages
 * Send a new message
 */
async function postHandler(req, user) {
  await connectDB();

  const body = await req.json();
  const { to, subject, message, relatedAppointmentId, relatedPatientId } = body;

  if (!to || !message) {
    return NextResponse.json(
      errorResponse('Recipient and message are required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  try {
    // Create message
    const newMessage = await Message.create({
      tenantId: user.tenantId,
      from: user.userId,
      to,
      subject: subject || '',
      message,
      folder: MessageFolder.SENT,
      status: MessageStatus.UNREAD,
      relatedAppointmentId,
      relatedPatientId,
    });

    // Also create inbox copy for recipient
    await Message.create({
      tenantId: user.tenantId,
      from: user.userId,
      to,
      subject: subject || '',
      message,
      folder: MessageFolder.INBOX,
      status: MessageStatus.UNREAD,
      relatedAppointmentId,
      relatedPatientId,
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('from', 'firstName lastName email profilePhoto')
      .populate('to', 'firstName lastName email profilePhoto')
      .lean();

    return NextResponse.json(successResponse(populatedMessage), { status: 201 });
  } catch (err) {
    logger.error('Failed to send message:', err);
    return NextResponse.json(errorResponse('Failed to send message', 'SEND_ERROR'), {
      status: 500,
    });
  }
}

// Apply middleware
export const GET = withErrorHandler(apiRateLimit(withAuth(getHandler)));
export const POST = withErrorHandler(apiRateLimit(withAuth(postHandler)));
