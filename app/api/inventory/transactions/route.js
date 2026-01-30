/**
 * Stock Transaction API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createStockTransactionSchema } from '@/lib/validations/inventory';
import { createStockTransaction } from '@/services/inventory.service';

/**
 * POST /api/inventory/transactions
 * Create a new stock transaction
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createStockTransactionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const transaction = await createStockTransaction(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: transaction._id.toString(),
      transactionNumber: transaction.transactionNumber,
      type: transaction.type,
      quantity: transaction.quantity,
      status: transaction.status,
      createdAt: transaction.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.CREATE)(postHandler)
    )
  )
);
