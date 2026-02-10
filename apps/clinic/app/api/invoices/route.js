import { ACTIONS, RESOURCES, hasPermission } from '@/lib/permissions/constants';
import {
  errorResponse,
  handleMongoError,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { createInvoiceSchema, invoiceQuerySchema } from '@/lib/validations/billing';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { withRequestLogger } from '@/middleware/request-logger';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { createInvoice, listInvoices } from '@/services/billing.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/invoices
 * List invoices with pagination and filters
 */
async function getHandler(req, user) {
  // Check if Invoice & Billing feature is available (skip for super_admin and roles with invoice permissions)
  // Managers and other roles with INVOICE:READ permission should be able to read invoices even if feature isn't in plan
  if (user.role !== 'super_admin') {
    const hasInvoiceReadPermission = hasPermission(user.role, RESOURCES.INVOICE, ACTIONS.READ);
    
    // Only check feature if user doesn't have explicit permission
    // This allows managers and other roles to access invoices even if feature isn't in subscription
    if (!hasInvoiceReadPermission) {
      const { requireFeature } = await import('@/middleware/feature-check');
      const featureCheck = await requireFeature(req, user, 'Invoice & Billing');
      if (!featureCheck.allowed) {
        return featureCheck.error;
      }
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
    // Error handling is done by withErrorHandler middleware
    throw error;
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
      return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
        status: 400,
      });
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
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates INVOICE:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.INVOICE, ACTIONS.READ)(getHandler)))
  )
);

/**
 * Apply enterprise middleware stack to POST endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates INVOICE:CREATE permission
 * 6. Handler - Executes business logic
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.INVOICE, ACTIONS.CREATE)(postHandler)))
  )
);
