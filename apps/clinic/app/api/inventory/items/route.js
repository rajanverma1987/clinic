import { optimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createInventoryItemSchema, inventoryItemQuerySchema } from '@/lib/validations/inventory';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import {
  createInventoryItem,
  getExpiredItems,
  getLowStockItems,
  listInventoryItems,
} from '@/services/inventory.service';
import { NextResponse } from 'next/server';

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
      const items = await optimizedCacheManager.getOrFetch(
        `inventory:lowStock:${user.tenantId}`,
        () => getLowStockItems(user.tenantId, user.userId),
        60000,
      );
      return NextResponse.json(successResponse(items));
    }

    if (expired) {
      const items = await getExpiredItems(user.tenantId, user.userId);
      return NextResponse.json(successResponse(items));
    }

    const lightweight = searchParams.get('lightweight') === 'true';
    const type = searchParams.get('type');
    if (lightweight && type) {
      const cacheKey = `inventory:lightweight:${type}:${user.tenantId}`;
      const result = await optimizedCacheManager.getOrFetch(
        cacheKey,
        () =>
          listInventoryItems(
            { type, limit: searchParams.get('limit') || '500', lightweight: true },
            user.tenantId,
            user.userId,
          ),
        60000,
      );
      return NextResponse.json(successResponse(result));
    }
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || undefined,
      lowStock: searchParams.get('lowStock') || undefined,
      expired: searchParams.get('expired') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      lightweight: lightweight ? true : undefined,
    };

    const validationResult = inventoryItemQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
        status: 400,
      });
    }

    const result = await listInventoryItems(
      { ...validationResult.data, lightweight: queryParams.lightweight },
      user.tenantId,
      user.userId,
    );

    return NextResponse.json(successResponse(result));
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(errorResponse('Failed to fetch inventory items', 'INTERNAL_ERROR'), {
      status: 500,
    });
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
      return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
        status: 400,
      });
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
      { status: 201 },
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
 * 5. Permission check - Validates INVENTORY:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.INVENTORY, ACTIONS.READ)(getHandler))),
  ),
);

/**
 * Apply enterprise middleware stack to POST endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates INVENTORY:CREATE permission
 * 6. Handler - Executes business logic
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.INVENTORY, ACTIONS.CREATE)(postHandler))),
  ),
);
