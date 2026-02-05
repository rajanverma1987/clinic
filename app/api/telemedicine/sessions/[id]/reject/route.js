/**
 * Reject Participant API
 * Doctor rejects patient from waiting room
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import TelemedicineSession from '@/models/TelemedicineSession.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { logger } from '@/lib/utils/logger.js';

/**
 * POST /api/telemedicine/sessions/[id]/reject
 * Reject participant from waiting room
 */
async function postHandler(req, user, context) {
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

    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json(
        errorResponse('participantId is required', 'VALIDATION_ERROR'),
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

    await TelemedicineSession.updateOne(
      {
        sessionId,
        'participants.userId': participantId
      },
      {
        $set: { 'participants.$.status': 'rejected' }
      }
    );

    await AuditLogger.auditWrite(
      'telemedicine_session',
      sessionId,
      user.userId,
      user.tenantId || 'system',
      AuditAction.UPDATE,
      undefined,
      { action: 'reject', participantId }
    );

    return NextResponse.json(successResponse({
      message: 'Participant rejected',
      participantId
    }));
  } catch (error) {
    logger.error('Error in POST /api/telemedicine/sessions/[id]/reject:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to reject participant',
        'REJECT_ERROR'
      ),
      { status: 500 }
    );
  }
}

export const POST = withErrorHandler(withAuth(postHandler));
