import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import {
  createTelemedicineSession,
  listSessions,
} from '@/services/telemedicine.service';
import { SessionType } from '@/models/TelemedicineSession';

/**
 * GET /api/telemedicine/sessions
 * List telemedicine sessions
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  try {
    const { searchParams } = new URL(req.url);
    
    const filters: any = {};
    if (searchParams.get('patientId')) filters.patientId = searchParams.get('patientId');
    if (searchParams.get('doctorId')) filters.doctorId = searchParams.get('doctorId');
    if (searchParams.get('status')) filters.status = searchParams.get('status');

    const sessions = await listSessions(user.tenantId, filters);
    return NextResponse.json(successResponse(sessions));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch sessions', 'FETCH_ERROR'),
      { status: 400 }
    );
  }
}

/**
 * POST /api/telemedicine/sessions
 * Create new telemedicine session
 */
async function postHandler(req: AuthenticatedRequest, user: any) {
  try {
    const body = await req.json();

    const session = await createTelemedicineSession(
      user.tenantId,
      user.userId,
      {
        patientId: body.patientId,
        doctorId: body.doctorId || user.userId,
        sessionType: body.sessionType || SessionType.VIDEO,
        scheduledStartTime: new Date(body.scheduledStartTime),
        scheduledEndTime: new Date(body.scheduledEndTime),
        appointmentId: body.appointmentId,
        chatEnabled: body.chatEnabled ?? true,
        recordingConsent: body.recordingConsent ?? false,
      }
    );

    return NextResponse.json(successResponse(session), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to create session', 'CREATE_ERROR'),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

