import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { updateInventoryItemSchema } from '@/lib/validations/inventory';
import {
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/services/inventory.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/inventory/items/:id
 * Get a single inventory item by ID
 */
async function getHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const item = await getInventoryItemById(params.id, user.tenantId, user.userId);

    if (!item) {
      return NextResponse.json(
        errorResponse('Inventory item not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(item));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch inventory item', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory/items/:id
 * Update an inventory item
 */
async function putHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const validationResult = updateInventoryItemSchema.safeParse(body);
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

    const item = await updateInventoryItem(
      params.id,
      validationResult.data,
      user.tenantId,
      user.userId
    );

    if (!item) {
      return NextResponse.json(
        errorResponse('Inventory item not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        id: item._id.toString(),
        name: item.name,
        totalQuantity: item.totalQuantity,
        availableQuantity: item.availableQuantity,
        updatedAt: item.updatedAt,
      })
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to update inventory item',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/inventory/items/:id
 * Soft delete an inventory item
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteInventoryItem(params.id, user.tenantId, user.userId);

    if (!deleted) {
      return NextResponse.json(
        errorResponse('Inventory item not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({ message: 'Inventory item deleted successfully' })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse('Failed to delete inventory item', 'DELETE_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user, { params });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return putHandler(authenticatedReq, authResult.user, { params });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return deleteHandler(authenticatedReq, authResult.user, { params });
}

