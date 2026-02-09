import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { changeQueueStatusSchema } from '@/lib/validations/queue';
import { changeQueueStatus } from '@/services/queue.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * PUT /api/queue/:id/status
 * Change queue entry status (waiting, called, in_progress, completed, etc.)
 */
async function putHandler(req, user, { params }) {
    const queueEntryId = params.id;
    const body = await req.json();

    const validationResult = changeQueueStatusSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json(
            validationErrorResponse(validationResult.error.errors),
            { status: 400 }
        );
    }

    const queueEntry = await changeQueueStatus(queueEntryId, validationResult.data, user.tenantId, user.userId);

    if (!queueEntry) {
        return NextResponse.json(
            errorResponse('Queue entry not found', 'NOT_FOUND'),
            { status: 404 }
        );
    }

    return NextResponse.json(successResponse(queueEntry));
}

// Apply middleware stack
export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.QUEUE, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

