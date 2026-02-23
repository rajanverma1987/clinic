import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { addStockToItem } from '@/services/inventory.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { z } from 'zod';

const addStockSchema = z.object({
  batchNumber: z.string().min(1, 'Batch number is required').max(50),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  expiryDate: z.string().or(z.date()).optional(),
  purchaseDate: z.string().or(z.date()).optional(),
  purchasePrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  supplierId: z.string().optional(),
  updateTopLevel: z.boolean().optional(),
});

/**
 * POST /api/inventory/items/:id/stock
 * Add stock (new batch) to an existing inventory item
 */
async function postHandler(req, user, { params }) {
  try {
    const body = await req.json();

    const validationResult = addStockSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const item = await addStockToItem(
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
        batchesCount: item.batches?.length || 0,
        updatedAt: item.updatedAt,
      }),
      { status: 201 }
    );
  } catch (error) {
    throw error;
  }
}

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return postHandler(req, user, { params });
      })
    )
  )
);
