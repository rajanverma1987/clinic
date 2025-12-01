import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { reorderQueueSchema } from '@/lib/validations/queue';
import { reorderQueue } from '@/services/queue.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * POST /api/queue/doctor/:doctorId/reorder
 * Reorder queue entries for a doctor
 */
async function postHandler(
  req: AuthenticatedRequest,
  user: any,
  params: { doctorId: string }
) {
  try {
    const { doctorId } = params;
    const body = await req.json();

    const validationResult = reorderQueueSchema.safeParse(body);
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

    const queue = await reorderQueue(doctorId, validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(queue));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to reorder queue',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const authResult = await authenticate(req);
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return postHandler(authenticatedReq, authResult.user, params);
}

