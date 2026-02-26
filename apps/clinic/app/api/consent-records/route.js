/**
 * Consent records API – list and create (record consent)
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { consentRecordQuerySchema, createConsentRecordSchema } from '@/lib/validations/consent';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { createConsentRecord, listConsentRecords } from '@/services/consent-record.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);
  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    patientId: searchParams.get('patientId') || undefined,
    formId: searchParams.get('formId') || undefined,
    fromDate: searchParams.get('fromDate') || undefined,
    toDate: searchParams.get('toDate') || undefined,
  };
  const validationResult = consentRecordQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const result = await listConsentRecords(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(successResponse(result));
}

async function postHandler(req, user) {
  const body = await req.json();
  const validationResult = createConsentRecordSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const record = await createConsentRecord(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(
    successResponse({
      id: record._id.toString(),
      patientId: record.patientId,
      formId: record.formId,
      consentedAt: record.consentedAt,
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
