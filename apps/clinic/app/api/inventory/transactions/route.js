/**
 * Stock Transaction API Routes
 * Based on NEW-PLANS.md requirements
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createStockTransactionSchema } from '@/lib/validations/inventory';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { createStockTransaction, listStockTransactions } from '@/services/inventory.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/inventory/transactions
 * List stock transactions with optional type filter
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : 100;

  const transactions = await listStockTransactions(user.tenantId, user.userId, { type, limit });

  return NextResponse.json(successResponse(transactions));
}

/**
 * POST /api/inventory/transactions
 * Create a new stock transaction
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createStockTransactionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const transaction = await createStockTransaction(
    validationResult.data,
    user.tenantId,
    user.userId,
  );

  return NextResponse.json(
    successResponse({
      id: transaction._id.toString(),
      transactionNumber: transaction.transactionNumber,
      type: transaction.type,
      quantity: transaction.quantity,
      status: transaction.status,
      createdAt: transaction.createdAt,
    }),
    { status: 201 },
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.INVENTORY, ACTIONS.READ)(getHandler))),
);

export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.INVENTORY, ACTIONS.CREATE)(postHandler))),
);
