/**
 * Stock Batch API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createStockBatchSchema, stockBatchQuerySchema } from '@/lib/validations/stock-batch';
import {
  createStockBatch,
  listStockBatches,
  getExpiringBatches,
  getExpiredBatches,
} from '@/services/stock-batch.service';

/**
 * GET /api/inventory/batches
 * List stock batches with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  // Check for special endpoints
  const expiringSoon = searchParams.get('expiringSoon');
  const expired = searchParams.get('expired') === 'true';

  if (expired) {
    const batches = await getExpiredBatches(user.tenantId, user.userId);
    return NextResponse.json(successResponse(batches));
  }

  if (expiringSoon) {
    const days = parseInt(expiringSoon, 10) || 30;
    const batches = await getExpiringBatches(days, user.tenantId, user.userId);
    return NextResponse.json(successResponse(batches));
  }

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    medicineId: searchParams.get('medicineId') || undefined,
    status: searchParams.get('status') || undefined,
    expiringSoon: searchParams.get('expiringSoon') || undefined,
    expired: searchParams.get('expired') || undefined,
    batchNumber: searchParams.get('batchNumber') || undefined,
  };

  const validationResult = stockBatchQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listStockBatches(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/inventory/batches
 * Create a new stock batch
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createStockBatchSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const batch = await createStockBatch(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: batch._id.toString(),
      batchNumber: batch.batchNumber,
      medicineId: batch.medicineId.toString(),
      quantity: batch.quantity.current,
      status: batch.status,
      createdAt: batch.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.CREATE)(postHandler)
    )
  )
);
