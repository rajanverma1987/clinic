/**
 * Chat API for Telemedicine Sessions
 * Stores encrypted chat messages (E2EE)
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import TelemedicineSession from '@/models/TelemedicineSession.js';
import { AuditLogger } from '@/lib/audit/audit-logger.js';

/**
 * POST /api/telemedicine/sessions/[id]/chat
 * Send encrypted chat message
 */
export async function POST(
  req,
  context
) {
  try {
    const params = await context.params;
    const sessionId = params.id;
    const body = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        errorResponse('Session ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const { encryptedMessage, senderId, senderName, timestamp, encrypted } = body;

    if (!encryptedMessage || !senderId) {
      return NextResponse.json(
        errorResponse('encryptedMessage and senderId are required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();
    const session = await TelemedicineSession.findOne({ sessionId }).lean();

    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Add encrypted message to session
    // IMPORTANT: Store encrypted message as-is, never decrypt on server
    const message = {
      senderId,
      senderName: senderName || 'Unknown',
      message: encryptedMessage, // This is the encrypted message
      encrypted: encrypted || false,
      timestamp: timestamp || new Date()
    };

    await TelemedicineSession.updateOne(
      { sessionId },
      { $push: { chatMessages: message } }
    );

    // Audit log (without message content for privacy)
    await AuditLogger.auditWrite(
      'telemedicine_session',
      sessionId,
      senderId,
      session.tenantId,
      'CREATE',
      { messageSent: true, encrypted: encrypted || false },
      { action: 'send_chat_message' }
    ).catch(console.error);

    return NextResponse.json(successResponse({
      message: 'Message sent successfully',
      messageId: Date.now().toString()
    }));
  } catch (error) {
    console.error('Error in POST /api/telemedicine/sessions/[id]/chat:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to send message',
        'CHAT_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * GET /api/telemedicine/sessions/[id]/chat
 * Get encrypted chat messages
 */
export async function GET(
  req,
  context
) {
  try {
    const params = await context.params;
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(
        errorResponse('Session ID is required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();
    const session = await TelemedicineSession.findOne({ sessionId }).lean();

    if (!session) {
      return NextResponse.json(
        errorResponse('Session not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Return encrypted messages (client will decrypt)
    return NextResponse.json(successResponse({
      messages: session.chatMessages || []
    }));
  } catch (error) {
    console.error('Error in GET /api/telemedicine/sessions/[id]/chat:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch messages',
        'CHAT_ERROR'
      ),
      { status: 500 }
    );
  }
}
