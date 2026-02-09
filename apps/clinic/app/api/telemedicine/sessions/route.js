import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import { SessionType } from '@/models/TelemedicineSession';
import { createTelemedicineSession, listSessions } from '@/services/telemedicine.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/telemedicine/sessions
 * List telemedicine sessions
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const filters = {};
  if (searchParams.get('patientId')) filters.patientId = searchParams.get('patientId');
  if (searchParams.get('doctorId')) filters.doctorId = searchParams.get('doctorId');
  if (searchParams.get('status')) filters.status = searchParams.get('status');

  const sessions = await listSessions(user.tenantId, filters);
  return NextResponse.json(successResponse(sessions));
}

/**
 * POST /api/telemedicine/sessions
 * Create new telemedicine session
 */
async function postHandler(req, user) {
  const body = await req.json();

  const session = await createTelemedicineSession(user.tenantId, user.userId, {
    patientId: body.patientId,
    doctorId: body.doctorId || user.userId,
    sessionType: body.sessionType || SessionType.VIDEO,
    scheduledStartTime: new Date(body.scheduledStartTime),
    scheduledEndTime: new Date(body.scheduledEndTime),
    appointmentId: body.appointmentId,
    chatEnabled: body.chatEnabled ?? true,
    recordingConsent: body.recordingConsent ?? false,
  });

  return NextResponse.json(successResponse(session), { status: 201 });
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates TELEMEDICINE:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.TELEMEDICINE, ACTIONS.READ)(getHandler))),
  ),
);

/**
 * Apply enterprise middleware stack to POST endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates TELEMEDICINE:CREATE permission
 * 6. Handler - Executes business logic
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.TELEMEDICINE, ACTIONS.CREATE)(postHandler))),
  ),
);
