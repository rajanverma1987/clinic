/**
 * Role-based access control (RBAC) middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { JWTPayload } from '@/lib/auth/jwt';
import { UserRole } from '@/models/User';

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole as UserRole);
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(userRole: string, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole as UserRole);
}

/**
 * Middleware wrapper for role-based access
 */
export function requireRole(
  requiredRoles: UserRole[]
): (
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) => (req: NextRequest, user: JWTPayload) => Promise<NextResponse> {
  return (handler) => {
    return async (req: NextRequest, user: JWTPayload) => {
      if (!hasRole(user.role, requiredRoles)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Insufficient permissions',
              code: 'FORBIDDEN',
            },
          },
          { status: 403 }
        );
      }

      return handler(req, user);
    };
  };
}

