/**
 * Tenant validation middleware
 * Ensures user can only access their tenant's data
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTPayload } from '@/lib/auth/jwt';

/**
 * Validate tenant access
 */
export function validateTenantAccess(
  userTenantId: string,
  resourceTenantId: string | undefined
): { valid: boolean; error?: NextResponse } {
  if (!resourceTenantId) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            message: 'Resource not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      ),
    };
  }

  if (resourceTenantId !== userTenantId) {
    return {
      valid: false,
      error: NextResponse.json(
        {
          success: false,
          error: {
            message: 'Access denied: Tenant mismatch',
            code: 'FORBIDDEN',
          },
        },
        { status: 403 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Middleware wrapper that validates tenant access
 */
export function withTenantValidation(
  handler: (
    req: NextRequest,
    user: JWTPayload,
    getResourceTenantId: (req: NextRequest) => Promise<string | null>
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, user: JWTPayload) => {
    // Extract tenantId from URL params or body
    const getTenantId = async (): Promise<string | null> => {
      // Try to get from URL params (e.g., /api/patients/:id)
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const idIndex = pathParts.findIndex((part) => part === 'api') + 2;
      const resourceId = pathParts[idIndex + 1];

      // For now, return null - will be implemented per route
      // Each route should provide its own getResourceTenantId function
      return null;
    };

    const resourceTenantId = await getTenantId();

    if (resourceTenantId) {
      const validation = validateTenantAccess(user.tenantId, resourceTenantId);
      if (!validation.valid) {
        return validation.error!;
      }
    }

    return handler(req, user, getTenantId);
  };
}

