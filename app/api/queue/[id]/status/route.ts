import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { changeQueueStatusSchema } from '@/lib/validations/queue';
import { changeQueueStatus } from '@/services/queue.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * PUT /api/queue/:id/status
 * Change queue entry status (waiting, called, in_progress, completed, etc.)
 */
async function putHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const validationResult = changeQueueStatusSchema.safeParse(body);
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

    const queueEntry = await changeQueueStatus(id, validationResult.data, user.tenantId, user.userId);

    if (!queueEntry) {
      return NextResponse.json(
        errorResponse('Queue entry not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(queueEntry));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to change queue status',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticate(req);
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return putHandler(authenticatedReq, authResult.user, { params });
}

