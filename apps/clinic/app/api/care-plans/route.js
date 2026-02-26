/**
 * Care plans API – list and create
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { carePlanQuerySchema, createCarePlanSchema } from '@/lib/validations/care-plan';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { createCarePlan, listCarePlans } from '@/services/care-plan.service';
import { NextResponse } from 'next/server';

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
  };
  const validationResult = carePlanQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const result = await listCarePlans(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(successResponse(result));
}

async function postHandler(req, user) {
  const body = await req.json();
  const validationResult = createCarePlanSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const plan = await createCarePlan(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(
    successResponse({
      id: plan._id.toString(),
      name: plan.name,
      status: plan.status,
      createdAt: plan.createdAt,
    }),
    { status: 201 },
  );
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CARE_PLAN, ACTIONS.READ)(getHandler))),
);
export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CARE_PLAN, ACTIONS.CREATE)(postHandler))),
);
