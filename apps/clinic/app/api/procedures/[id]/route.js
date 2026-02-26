/**
 * Procedure session detail API – get, update, delete
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateProcedureSessionSchema } from '@/lib/validations/procedure';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import {
  deleteProcedureSession,
  getProcedureSessionById,
  updateProcedureSession,
} from '@/services/procedure.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user, { params }) {
  const sessionId = params.id;
  const session = await getProcedureSessionById(sessionId, user.tenantId, user.userId);

  if (!session) {
    return NextResponse.json(errorResponse('Procedure session not found', 'NOT_FOUND'), {
      status: 404,
    });
  }

  return NextResponse.json(successResponse(session));
}

async function putHandler(req, user, { params }) {
  const sessionId = params.id;
  const body = await req.json();

  const validationResult = updateProcedureSessionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const session = await updateProcedureSession(
    sessionId,
    validationResult.data,
    user.tenantId,
    user.userId,
  );

  if (!session) {
    return NextResponse.json(errorResponse('Procedure session not found', 'NOT_FOUND'), {
      status: 404,
    });
  }

  return NextResponse.json(successResponse(session));
}

async function deleteHandler(req, user, { params }) {
  const sessionId = params.id;
  const session = await deleteProcedureSession(sessionId, user.tenantId, user.userId);

  if (!session) {
    return NextResponse.json(errorResponse('Procedure session not found', 'NOT_FOUND'), {
      status: 404,
    });
  }

  return NextResponse.json(successResponse({ id: sessionId, deleted: true }));
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.READ)(getHandler))),
);

export const PUT = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.UPDATE)(putHandler))),
);

export const DELETE = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.DELETE)(deleteHandler))),
);
