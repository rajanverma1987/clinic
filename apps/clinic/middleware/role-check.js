/**
 * Role-based access control (RBAC) middleware
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if user has required role
 */
export function hasRole(userRole, requiredRoles) {
  return requiredRoles.includes(userRole);
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(userRole, requiredRoles) {
  return requiredRoles.includes(userRole);
}

/**
 * Middleware wrapper for role-based access
 */
export function requireRole(requiredRoles) {
  return (handler) => {
    return async (req, user) => {
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

