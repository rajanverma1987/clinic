import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { createInventoryItemSchema, inventoryItemQuerySchema } from '@/lib/validations/inventory';
import {
  createInventoryItem,
  listInventoryItems,
  getLowStockItems,
  getExpiredItems,
} from '@/services/inventory.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/inventory/items
 * List inventory items with pagination and filters
 */
async function getHandler(req, user) {
  try {
    const { searchParams } = new URL(req.url);

    // Check for special endpoints
    const lowStock = searchParams.get('lowStock') === 'true';
    const expired = searchParams.get('expired') === 'true';

    if (lowStock) {
      const items = await getLowStockItems(user.tenantId, user.userId);
      return NextResponse.json(successResponse(items));
    }

    if (expired) {
      const items = await getExpiredItems(user.tenantId, user.userId);
      return NextResponse.json(successResponse(items));
    }

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || undefined,
      lowStock: searchParams.get('lowStock') || undefined,
      expired: searchParams.get('expired') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    };

    const validationResult = inventoryItemQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const result = await listInventoryItems(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(result));
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch inventory items', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory/items
 * Create a new inventory item
 */
async function postHandler(req, user) {
  try {
    const body = await req.json();

    const validationResult = createInventoryItemSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const item = await createInventoryItem(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        id: item._id.toString(),
        name: item.name,
        code: item.code,
        type: item.type,
        totalQuantity: item.totalQuantity,
        availableQuantity: item.availableQuantity,
        unit: item.unit,
        createdAt: item.createdAt,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to create inventory item',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

