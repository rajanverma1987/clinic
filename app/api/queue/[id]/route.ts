import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { updateQueueEntrySchema } from '@/lib/validations/queue';
import {
  getQueueEntryById,
  updateQueueEntry,
  removeQueueEntry,
} from '@/services/queue.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/queue/:id
 * Get queue entry by ID
 */
async function getHandler(
  req: AuthenticatedRequest,
  user: any,
  params: { id: string }
) {
  try {
    const { id } = params;
    const queueEntry = await getQueueEntryById(id, user.tenantId, user.userId);

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
      errorResponse('Failed to fetch queue entry', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/queue/:id
 * Update queue entry
 */
async function putHandler(
  req: AuthenticatedRequest,
  user: any,
  params: { id: string }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const validationResult = updateQueueEntrySchema.safeParse(body);
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

    const queueEntry = await updateQueueEntry(id, validationResult.data, user.tenantId, user.userId);

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
        error.message || 'Failed to update queue entry',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/queue/:id
 * Remove queue entry (soft delete)
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  user: any,
  params: { id: string }
) {
  try {
    const { id } = params;
    const deleted = await removeQueueEntry(id, user.tenantId, user.userId);

    if (!deleted) {
      return NextResponse.json(
        errorResponse('Queue entry not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({ message: 'Queue entry removed successfully' })
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to remove queue entry', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticate(req);
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user, params);
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

  return putHandler(authenticatedReq, authResult.user, params);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticate(req);
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return deleteHandler(authenticatedReq, authResult.user, params);
}

