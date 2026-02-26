/**
 * Procedure sessions API – list and create
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createProcedureSessionSchema, procedureQuerySchema } from '@/lib/validations/procedure';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { createProcedureSession, listProcedureSessions } from '@/services/procedure.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);
  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    patientId: searchParams.get('patientId') || undefined,
    doctorId: searchParams.get('doctorId') || undefined,
    appointmentId: searchParams.get('appointmentId') || undefined,
    status: searchParams.get('status') || undefined,
    type: searchParams.get('type') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  };

  const validationResult = procedureQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const result = await listProcedureSessions(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(successResponse(result));
}

async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createProcedureSessionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const session = await createProcedureSession(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: session._id.toString(),
      procedureNumber: session.procedureNumber,
      status: session.status,
      createdAt: session.createdAt,
    }),
    { status: 201 },
  );
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.READ)(getHandler))),
);

export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.CREATE)(postHandler))),
);
