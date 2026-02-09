/**
 * Lab Order API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createLabOrderSchema, labOrderQuerySchema } from '@/lib/validations/lab';
import { createLabOrder, listLabOrders } from '@/services/lab-order.service';

/**
 * GET /api/lab-orders
 * List lab orders with pagination and filters
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
  };

  const validationResult = labOrderQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listLabOrders(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/lab-orders
 * Create a new lab order
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createLabOrderSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const labOrder = await createLabOrder(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: labOrder._id.toString(),
      orderNumber: labOrder.orderNumber,
      patientId: labOrder.patientId.toString(),
      status: labOrder.status,
      createdAt: labOrder.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_ORDER, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_ORDER, ACTIONS.CREATE)(postHandler)
    )
  )
);
