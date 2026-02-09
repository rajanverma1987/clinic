import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { updateInvoiceSchema } from '@/lib/validations/billing';
import {
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from '@/services/billing.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/invoices/:id
 * Get a single invoice by ID
 */
async function getHandler(
  req,
  user,
  { params }
) {
  try {
    const invoice = await getInvoiceById(params.id, user.tenantId, user.userId);

    if (!invoice) {
      return NextResponse.json(
        errorResponse('Invoice not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(invoice));
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
}

/**
 * PUT /api/invoices/:id
 * Update an invoice
 */
async function putHandler(
  req,
  user,
  { params }
) {
  try {
    const body = await req.json();

    const validationResult = updateInvoiceSchema.safeParse(body);
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

    const invoice = await updateInvoice(
      params.id,
      validationResult.data,
      user.tenantId,
      user.userId
    );

    if (!invoice) {
      return NextResponse.json(
        errorResponse('Invoice not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        totalAmount: invoice.totalAmount,
        balanceAmount: invoice.balanceAmount,
        updatedAt: invoice.updatedAt,
      })
    );
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
}

/**
 * DELETE /api/invoices/:id
 * Soft delete an invoice
 */
async function deleteHandler(
  req,
  user,
  { params }
) {
  try {
    const deleted = await deleteInvoice(params.id, user.tenantId, user.userId);

    if (!deleted) {
      return NextResponse.json(
        errorResponse('Invoice not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({ message: 'Invoice deleted successfully' })
    );
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVOICE, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVOICE, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVOICE, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);

