/**
 * Consent form templates API – list and create
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { consentFormQuerySchema, createConsentFormSchema } from '@/lib/validations/consent';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { createConsentForm, listConsentForms } from '@/services/consent-form.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);
  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    isActive: searchParams.get('isActive') || undefined,
    search: searchParams.get('search') || undefined,
  };
  const validationResult = consentFormQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const result = await listConsentForms(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(successResponse(result));
}

async function postHandler(req, user) {
  const body = await req.json();
  const validationResult = createConsentFormSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const form = await createConsentForm(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(
    successResponse({
      id: form._id.toString(),
      name: form.name,
      isActive: form.isActive,
      createdAt: form.createdAt,
    }),
    { status: 201 },
  );
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CONSENT, ACTIONS.READ)(getHandler))),
);
export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CONSENT, ACTIONS.CREATE)(postHandler))),
);
