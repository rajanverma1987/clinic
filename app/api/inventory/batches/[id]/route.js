/**
 * Stock Batch Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateStockBatchSchema } from '@/lib/validations/stock-batch';
import {
  getStockBatchById,
  updateStockBatch,
  deleteStockBatch,
} from '@/services/stock-batch.service';

/**
 * GET /api/inventory/batches/[id]
 * Get stock batch by ID
 */
async function getHandler(req, user, { params }) {
  const batchId = params.id;

  const batch = await getStockBatchById(batchId, user.tenantId, user.userId);

  if (!batch) {
    return NextResponse.json(
      errorResponse('Stock batch not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(batch));
}

/**
 * PUT /api/inventory/batches/[id]
 * Update stock batch
 */
async function putHandler(req, user, { params }) {
  const batchId = params.id;
  const body = await req.json();

  const validationResult = updateStockBatchSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const batch = await updateStockBatch(
    batchId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  if (!batch) {
    return NextResponse.json(
      errorResponse('Stock batch not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(batch));
}

/**
 * DELETE /api/inventory/batches/[id]
 * Delete stock batch (soft delete)
 */
async function deleteHandler(req, user, { params }) {
  const batchId = params.id;

  const deleted = await deleteStockBatch(batchId, user.tenantId, user.userId);

  if (!deleted) {
    return NextResponse.json(
      errorResponse('Stock batch not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse({ message: 'Stock batch deleted successfully' }));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
