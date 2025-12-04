import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { createInvoiceSchema, invoiceQuerySchema } from '@/lib/validations/billing';
import {
  createInvoice,
  listInvoices,
} from '@/services/billing.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/invoices
 * List invoices with pagination and filters
 */
async function getHandler(req, user) {
  // Check if Invoice & Billing feature is available (skip for super_admin)
  if (user.role !== 'super_admin') {
    const { requireFeature } = await import('@/middleware/feature-check');
    const featureCheck = await requireFeature(req, user, 'Invoice & Billing');
    if (!featureCheck.allowed) {
      return featureCheck.error;
    }
  }

  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    };

    const validationResult = invoiceQuerySchema.safeParse(queryParams);
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

    const result = await listInvoices(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(result));
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch invoices', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Create a new invoice
 */
async function postHandler(req, user) {
  try {
    const body = await req.json();

    const validationResult = createInvoiceSchema.safeParse(body);
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

    const invoice = await createInvoice(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        patientId: invoice.patientId.toString(),
        status: invoice.status,
        totalAmount: invoice.totalAmount,
        balanceAmount: invoice.balanceAmount,
        currency: invoice.currency,
        createdAt: invoice.createdAt,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to create invoice',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

