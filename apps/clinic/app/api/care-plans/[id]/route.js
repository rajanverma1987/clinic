/**
 * Care plan detail API – get, update, delete
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateCarePlanSchema } from '@/lib/validations/care-plan';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { deleteCarePlan, getCarePlanById, updateCarePlan } from '@/services/care-plan.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user, { params }) {
  const plan = await getCarePlanById(params.id, user.tenantId, user.userId);
  if (!plan) {
    return NextResponse.json(errorResponse('Care plan not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse(plan));
}

async function putHandler(req, user, { params }) {
  const body = await req.json();
  const validationResult = updateCarePlanSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const plan = await updateCarePlan(params.id, validationResult.data, user.tenantId, user.userId);
  if (!plan) {
    return NextResponse.json(errorResponse('Care plan not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse(plan));
}

async function deleteHandler(req, user, { params }) {
  const plan = await deleteCarePlan(params.id, user.tenantId, user.userId);
  if (!plan) {
    return NextResponse.json(errorResponse('Care plan not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse({ id: params.id, deleted: true }));
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CARE_PLAN, ACTIONS.READ)(getHandler))),
);
export const PUT = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CARE_PLAN, ACTIONS.UPDATE)(putHandler))),
);
export const DELETE = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.CARE_PLAN, ACTIONS.DELETE)(deleteHandler))),
);
