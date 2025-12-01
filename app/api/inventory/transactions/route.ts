import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { createStockTransactionSchema } from '@/lib/validations/inventory';
import { createStockTransaction } from '@/services/inventory.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * POST /api/inventory/transactions
 * Create a new stock transaction
 */
async function postHandler(req: AuthenticatedRequest, user: any) {
  try {
    const body = await req.json();

    const validationResult = createStockTransactionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        errorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          validationResult.error.errors
        ),
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
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to create stock transaction',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const POST = withAuth(postHandler);

