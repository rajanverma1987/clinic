import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { supplierSchema } from '@/lib/validations/inventory';
import {
  createSupplier,
  listSuppliers,
} from '@/services/inventory.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/inventory/suppliers
 * List suppliers
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  try {
    const suppliers = await listSuppliers(user.tenantId, user.userId);
    return NextResponse.json(successResponse(suppliers));
  } catch (error: any) {
    return NextResponse.json(
      errorResponse('Failed to fetch suppliers', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/suppliers
 * Create a new supplier
 */
async function postHandler(req: AuthenticatedRequest, user: any) {
  try {
    const body = await req.json();

    const validationResult = supplierSchema.safeParse(body);
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

    const supplier = await createSupplier(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        id: supplier._id.toString(),
        name: supplier.name,
        code: supplier.code,
        email: supplier.email,
        phone: supplier.phone,
        createdAt: supplier.createdAt,
      }),
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to create supplier',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

