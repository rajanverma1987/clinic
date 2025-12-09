/**
 * Admit Participant API
 * Doctor admits patient from waiting room
 */

import { NextRequest, NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import TelemedicineSession from '@/models/TelemedicineSession.js';
import { AuditLogger } from '@/lib/audit/audit-logger.js';

/**
 * POST /api/telemedicine/sessions/[id]/admit
 * Admit participant to call
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

    // Update participant status to admitted
    await TelemedicineSession.updateOne(
      {
        sessionId,
        'participants.userId': participantId
      },
      {
        $set: { 'participants.$.status': 'admitted' }
      }
    );

    // TODO: Extract user from auth token for audit log
    // await AuditLogger.auditWrite(...)

    return NextResponse.json(successResponse({
      message: 'Participant admitted',
      participantId
    }));
  } catch (error) {
    console.error('Error in POST /api/telemedicine/sessions/[id]/admit:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to admit participant',
        'ADMIT_ERROR'
      ),
      { status: 500 }
    );
  }
}
