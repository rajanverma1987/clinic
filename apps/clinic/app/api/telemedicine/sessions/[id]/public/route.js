import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { getSessionById } from '@/services/telemedicine.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/telemedicine/sessions/:id/public
 * Get a single telemedicine session by ID (public, no auth required)
 */
export async function GET(req, context) {
  try {
    const params = await context.params;
    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json(errorResponse('Session ID is required', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }

    // Fetch session without tenantId requirement (public access)
    const session = await getSessionById(sessionId);

    if (!session) {
      return NextResponse.json(errorResponse('Session not found', 'NOT_FOUND'), { status: 404 });
    }

    // Return session data needed for joining (public link and pre-connect UI)
    const publicSession = {
      _id: session._id,
      sessionId: session.sessionId,
      doctorId: session.doctorId,
      patientId: session.patientId,
      status: session.status,
      sessionType: session.sessionType,
      scheduledStartTime: session.scheduledStartTime,
      scheduledEndTime: session.scheduledEndTime,
      expiresAt: session.expiresAt,
      oneTimeToken: session.oneTimeToken,
      linkUsed: session.linkUsed,
      waitingRoomEnabled: session.waitingRoomEnabled,
      participants: session.participants,
      sharedFiles: session.sharedFiles,
      chatMessages: session.chatMessages,
      recordingConsent: session.recordingConsent,
      appointmentId: session.appointmentId,
    };

    return NextResponse.json(successResponse(publicSession));
  } catch (error) {
    logger.error('Error in GET /api/telemedicine/sessions/[id]/public:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to fetch session',
        'FETCH_ERROR',
      ),
      { status: 500 },
    );
  }
}
