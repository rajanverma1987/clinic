import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { updateInventoryItemSchema } from '@/lib/validations/inventory';
import {
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/services/inventory.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/inventory/items/:id
 * Get a single inventory item by ID
 */
async function getHandler(
  req,
  user,
  { params }
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
  } catch (error) {
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
  req,
  user,
  { params }
) {
  try {
    const body = await req.json();

    const validationResult = updateInventoryItemSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
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
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
}

/**
 * DELETE /api/inventory/items/:id
 * Soft delete an inventory item
 */
async function deleteHandler(
  req,
  user,
  { params }
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
  } catch (error) {
    // Error handling is done by withErrorHandler middleware
    throw error;
  }
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.DELETE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);

