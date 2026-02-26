/**
 * Consent record detail API – get single record
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { getConsentRecordById } from '@/services/consent-record.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user, { params }) {
  const record = await getConsentRecordById(params.id, user.tenantId, user.userId);
  if (!record) {
    return NextResponse.json(errorResponse('Consent record not found', 'NOT_FOUND'), {
      status: 404,
    });
  }
  return NextResponse.json(successResponse(record));
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CONSENT, ACTIONS.READ)(getHandler))),
);
