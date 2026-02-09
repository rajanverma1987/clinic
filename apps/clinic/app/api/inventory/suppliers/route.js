/**
 * Supplier API Routes
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { supplierSchema } from '@/lib/validations/inventory';
import { createSupplier, listSuppliers } from '@/services/inventory.service';

/**
 * GET /api/inventory/suppliers
 * List suppliers
 */
async function getHandler(req, user) {
  const suppliers = await listSuppliers(user.tenantId, user.userId);

  return NextResponse.json(successResponse(suppliers));
}

/**
 * POST /api/inventory/suppliers
 * Create a new supplier
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = supplierSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const supplier = await createSupplier(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: supplier._id.toString(),
      name: supplier.name,
      code: supplier.code,
      createdAt: supplier.createdAt,
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
