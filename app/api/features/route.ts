import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { getTenantFeatures, getTenantLimits } from '@/services/feature-access.service';

/**
 * GET /api/features
 * Get current tenant's available features and limits
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  try {
    // Super admin has access to all features
    if (user.role === 'super_admin') {
      return NextResponse.json(
        successResponse({
          features: ['*'], // All features
          limits: {},
        })
      );
    }

    const features = await getTenantFeatures(user.tenantId);
    const limits = await getTenantLimits(user.tenantId);

    return NextResponse.json(
      successResponse({
        features,
        limits,
      })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to fetch features', 'FETCH_ERROR'),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);

