/**
 * Lab Order Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateLabOrderSchema } from '@/lib/validations/lab';
import {
  getLabOrderById,
  updateLabOrder,
  updateLabOrderStatus,
  cancelLabOrder,
} from '@/services/lab-order.service';

/**
 * GET /api/lab-orders/[id]
 * Get lab order by ID
 */
async function getHandler(req, user, { params }) {
  const orderId = params.id;

  const labOrder = await getLabOrderById(orderId, user.tenantId, user.userId);

  if (!labOrder) {
    return NextResponse.json(
      errorResponse('Lab order not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(labOrder));
}

/**
 * PUT /api/lab-orders/[id]
 * Update lab order
 */
async function putHandler(req, user, { params }) {
  const orderId = params.id;
  const body = await req.json();

  const validationResult = updateLabOrderSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const labOrder = await updateLabOrder(
    orderId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!labOrder) {
    return NextResponse.json(
      errorResponse('Lab order not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(labOrder));
}

/**
 * PATCH /api/lab-orders/[id]/status
 * Update lab order status
 */
async function patchStatusHandler(req, user, { params }) {
  const orderId = params.id;
  const body = await req.json();

  if (!body.status) {
    return NextResponse.json(
      errorResponse('Status is required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const labOrder = await updateLabOrderStatus(
    orderId,
    body.status,
    user.tenantId,
    user.userId
  );

  if (!labOrder) {
    return NextResponse.json(
      errorResponse('Lab order not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(labOrder));
}

/**
 * DELETE /api/lab-orders/[id]
 * Cancel lab order
 */
async function deleteHandler(req, user, { params }) {
  const orderId = params.id;

  const labOrder = await cancelLabOrder(orderId, user.tenantId, user.userId);

  if (!labOrder) {
    return NextResponse.json(
      errorResponse('Lab order not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Lab order cancelled successfully' }));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_ORDER, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_ORDER, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const PATCH = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_ORDER, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return patchStatusHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.LAB_ORDER, ACTIONS.CANCEL)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
