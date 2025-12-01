/**
 * Feature Check Middleware
 * Ensures user has access to specific features based on their subscription
 */

import { NextResponse } from 'next/server';
import { AuthenticatedRequest } from '@/middleware/auth';
import { hasFeatureAccess } from '@/services/feature-access.service';
import { errorResponse } from '@/lib/utils/api-response';

/**
 * Check if user has access to a specific feature
 */
export async function requireFeature(
  req: AuthenticatedRequest,
  user: any,
  featureName: string
): Promise<{ allowed: boolean; error?: NextResponse }> {
  // Super admin has access to all features
  if (user.role === 'super_admin') {
    return { allowed: true };
  }

  // Check if tenant has this feature
  const hasAccess = await hasFeatureAccess(user.tenantId, featureName);

  if (!hasAccess) {
    return {
      allowed: false,
      error: NextResponse.json(
        errorResponse(
          `This feature (${featureName}) is not included in your subscription plan. Please upgrade to access this feature.`,
          'FEATURE_NOT_AVAILABLE'
        ),
        { status: 403 }
      ),
    };
  }

  return { allowed: true };
}

/**
 * Check if user has access to any of the provided features
 */
export async function requireAnyFeature(
  req: AuthenticatedRequest,
  user: any,
  featureNames: string[]
): Promise<{ allowed: boolean; error?: NextResponse }> {
  // Super admin has access to all features
  if (user.role === 'super_admin') {
    return { allowed: true };
  }

  const { hasAnyFeatureAccess } = await import('@/services/feature-access.service');
  const hasAccess = await hasAnyFeatureAccess(user.tenantId, featureNames);

  if (!hasAccess) {
    return {
      allowed: false,
      error: NextResponse.json(
        errorResponse(
          'This feature is not included in your subscription plan. Please upgrade to access this feature.',
          'FEATURE_NOT_AVAILABLE'
        ),
        { status: 403 }
      ),
    };
  }

  return { allowed: true };
}
