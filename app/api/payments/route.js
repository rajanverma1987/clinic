import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { createPaymentSchema, paymentQuerySchema } from '@/lib/validations/billing';
import {
  createPayment,
  listPayments,
} from '@/services/billing.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/payments
 * List payments with pagination and filters
 */
async function getHandler(req, user) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      invoiceId: searchParams.get('invoiceId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const validationResult = paymentQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        errorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          validationResult.error.errors
        ),
        { status: 400 }
      );
    }

    const result = await listPayments(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(result));
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch payments', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments
 * Create a new payment
 */
async function postHandler(req, user) {
  try {
    const body = await req.json();

    const validationResult = createPaymentSchema.safeParse(body);
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

    const payment = await createPayment(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        id: payment._id.toString(),
        paymentNumber: payment.paymentNumber,
        invoiceId: payment.invoiceId.toString(),
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to create payment',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

