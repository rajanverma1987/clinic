/**
 * Update Stock Batch Quantity API Route
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateBatchQuantitySchema } from '@/lib/validations/stock-batch';
import { updateBatchQuantity } from '@/services/stock-batch.service';

/**
 * PUT /api/inventory/batches/[id]/quantity
 * Update batch quantity
 */
async function putHandler(req, user, { params }) {
  const batchId = params.id;
  const body = await req.json();

  const validationResult = updateBatchQuantitySchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const batch = await updateBatchQuantity(
    batchId,
    validationResult.data.quantityChange,
    validationResult.data.transactionType,
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

// Apply middleware stack
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
