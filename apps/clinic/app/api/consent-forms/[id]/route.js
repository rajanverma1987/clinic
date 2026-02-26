/**
 * Consent form detail API – get, update, delete
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateConsentFormSchema } from '@/lib/validations/consent';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import {
  deleteConsentForm,
  getConsentFormById,
  updateConsentForm,
} from '@/services/consent-form.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user, { params }) {
  const form = await getConsentFormById(params.id, user.tenantId, user.userId);
  if (!form) {
    return NextResponse.json(errorResponse('Consent form not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse(form));
}

async function putHandler(req, user, { params }) {
  const body = await req.json();
  const validationResult = updateConsentFormSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const form = await updateConsentForm(
    params.id,
    validationResult.data,
    user.tenantId,
    user.userId,
  );
  if (!form) {
    return NextResponse.json(errorResponse('Consent form not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse(form));
}

async function deleteHandler(req, user, { params }) {
  const form = await deleteConsentForm(params.id, user.tenantId, user.userId);
  if (!form) {
    return NextResponse.json(errorResponse('Consent form not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse({ id: params.id, deleted: true }));
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CONSENT, ACTIONS.READ)(getHandler))),
);
export const PUT = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CONSENT, ACTIONS.UPDATE)(putHandler))),
);
export const DELETE = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CONSENT, ACTIONS.DELETE)(deleteHandler))),
);
