import { NextResponse } from 'next/server';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createPrescriptionSchema, prescriptionQuerySchema } from '@/lib/validations/prescription';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { withRequestLogger } from '@/middleware/request-logger';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { createPrescription, listPrescriptions } from '@/services/prescription.service';

/**
 * GET /api/prescriptions
 * List prescriptions with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    patientId: searchParams.get('patientId') || undefined,
    doctorId: searchParams.get('doctorId') || undefined,
    status: searchParams.get('status') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    isActive: searchParams.get('isActive') || undefined,
  };

  const validationResult = prescriptionQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const result = await listPrescriptions(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/prescriptions
 * Create a new prescription
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createPrescriptionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const prescription = await createPrescription(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: prescription._id.toString(),
      prescriptionNumber: prescription.prescriptionNumber,
      patientId: prescription.patientId.toString(),
      doctorId: prescription.doctorId.toString(),
      status: prescription.status,
      region: prescription.region,
      itemsCount: prescription.items.length,
      validUntil: prescription.validUntil,
      createdAt: prescription.createdAt,
    }),
    { status: 201 },
  );
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

/**
 * Apply enterprise middleware stack to POST endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates PRESCRIPTION:CREATE permission
 * 6. Handler - Executes business logic
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.PRESCRIPTION, ACTIONS.CREATE)(postHandler))),
  ),
);
