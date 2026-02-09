import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import { NextResponse } from 'next/server';

/**
 * GET /api/prescriptions/check-interactions
 * Stub for drug interaction and allergy conflict checking (Phase 3.4).
 * Query: drugIds=id1,id2&patientId=...
 * Returns { interactions: [], allergyWarnings: [] }.
 * Real implementation would call an external drug database or in-house rules.
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);
  const drugIds = searchParams.get('drugIds')?.split(',').filter(Boolean) || [];
  const patientId = searchParams.get('patientId') || '';

  // Stub: no external API yet. Return empty arrays.
  // Allergy checks can be done client-side using patient.allergies vs drug names.
  const result = {
    interactions: [],
    allergyWarnings: [],
  };

  return NextResponse.json(successResponse(result));
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates PRESCRIPTION:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.PRESCRIPTION, ACTIONS.READ)(getHandler))),
  ),
);
