import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { getDoctorQueue, getQueueStatistics } from '@/services/queue.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/queue/doctor/:doctorId
 * Get current queue for a specific doctor (waiting entries only)
 */
async function getHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;
    const { searchParams } = new URL(req.url);
    const stats = searchParams.get('stats') === 'true';

    if (stats) {
      // Return statistics
      const statistics = await getQueueStatistics(doctorId, user.tenantId, user.userId);
      return NextResponse.json(successResponse(statistics));
    }

    // Return queue entries
    const queue = await getDoctorQueue(doctorId, user.tenantId, user.userId);
    return NextResponse.json(successResponse(queue));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch doctor queue', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ doctorId: string }> }
) {
  const authResult = await authenticate(req);
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user, { params });
}

