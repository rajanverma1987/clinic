import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getDashboardStats } from '@/services/report.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/reports/dashboard
 * Get dashboard statistics
 */
async function getHandler(req, user) {
  try {
    const stats = await getDashboardStats(user.tenantId, user.userId);
    return NextResponse.json(successResponse(stats));
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch dashboard stats', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const authResult = await authenticate(req);
  if ('error' in authResult) return authResult.error;

  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user);
}

