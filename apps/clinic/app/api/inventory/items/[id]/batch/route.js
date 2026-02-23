import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { removeBatchFromItem } from '@/services/inventory.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { z } from 'zod';

const deleteBatchSchema = z.object({
  batchNumber: z.string().min(1, 'Batch number is required'),
});

/**
 * DELETE /api/inventory/items/:id/batch
 * Remove a specific batch from an inventory item
 */
async function deleteHandler(req, user, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const batchNumber = searchParams.get('batchNumber');

    const validationResult = deleteBatchSchema.safeParse({ batchNumber });
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const item = await removeBatchFromItem(
      params.id,
      validationResult.data.batchNumber,
      user.tenantId,
      user.userId
    );

    if (!item) {
      return NextResponse.json(
        errorResponse('Batch not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        message: 'Batch removed successfully',
        id: item._id.toString(),
        name: item.name,
        totalQuantity: item.totalQuantity,
        availableQuantity: item.availableQuantity,
        batchesCount: item.batches?.length || 0,
      })
    );
  } catch (error) {
    throw error;
  }
}

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
