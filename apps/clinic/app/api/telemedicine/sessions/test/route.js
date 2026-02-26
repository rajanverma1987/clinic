/**
 * TEMP: Test-only endpoint to create a video consultation session for testing.
 * REMOVE BEFORE PRODUCTION: Delete this file and the "Test video" link on the telemedicine page.
 *
 * POST /api/telemedicine/sessions/test
 * Creates a session with current user as doctor and first available patient. Returns session _id.
 * Disabled in production (404).
 */

import connectDB from '@/lib/db/connection';
import { withTenant } from '@/lib/db/tenant-helper';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Patient from '@/models/Patient';
import { SessionType } from '@/models/TelemedicineSession';
import { createTelemedicineSession } from '@/services/telemedicine.service';
import { NextResponse } from 'next/server';

const isTestAllowed = process.env.NODE_ENV !== 'production' || process.env.ENABLE_VIDEO_TEST_LINK === 'true';

async function postHandler(req, user) {
  if (!isTestAllowed) {
    return NextResponse.json(errorResponse('Not available'), { status: 404 });
  }

  await connectDB();

  const tenantId = user.tenantId;
  const doctorId = user.userId;

  const patient = await Patient.findOne(withTenant(tenantId, {}))
    .select('_id')
    .limit(1)
    .lean();

  if (!patient) {
    return NextResponse.json(
      errorResponse('Create at least one patient in the clinic to test video consultation.'),
      { status: 400 }
    );
  }

  const start = new Date();
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const session = await createTelemedicineSession(tenantId, doctorId, {
    patientId: patient._id,
    doctorId,
    sessionType: SessionType.VIDEO,
    scheduledStartTime: start,
    scheduledEndTime: end,
    chatEnabled: true,
    recordingConsent: false,
  });

  return NextResponse.json(
    successResponse({ id: session._id.toString(), sessionId: session.sessionId }),
    { status: 201 }
  );
}

export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(postHandler))
  ),
);
