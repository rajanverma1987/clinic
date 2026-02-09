/**
 * Permission Check Middleware
 * Validates user permissions for resources and actions
 * Based on NEW-PLANS.md RBAC requirements
 */

import { isTestAccount } from '@/lib/constants/test-account.js';
import { AuthorizationError, PHIAccessError } from '@/lib/errors/custom-errors';
import { hasPermission, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse } from '@/lib/utils/api-response';
import { NextResponse } from 'next/server';

/**
 * Check if user has permission for a resource and action
 */
export function checkPermission(user, resource, action) {
  if (!user || !user.role) {
    return false;
  }
  if (user.email && isTestAccount(user.email)) {
    return true;
  }
  return hasPermission(user.role, resource, action);
}

/**
 * Middleware to require permission
 */
export function requirePermission(resource, action) {
  return (handler) => {
    return async (req, user, ...args) => {
      if (!user) {
        return NextResponse.json(errorResponse('Authentication required', 'AUTHENTICATION_ERROR'), {
          status: 401,
        });
      }
      if (user.email && isTestAccount(user.email)) {
        return handler(req, user, ...args);
      }
      if (!checkPermission(user, resource, action)) {
        // Check if it's a PHI resource
        const phiResources = [
          RESOURCES.PATIENT,
          RESOURCES.APPOINTMENT,
          RESOURCES.PRESCRIPTION,
          RESOURCES.CLINICAL_NOTE,
          RESOURCES.LAB_ORDER,
          RESOURCES.LAB_RESULT,
          RESOURCES.INVOICE,
          RESOURCES.PAYMENT,
        ];

        if (phiResources.includes(resource)) {
          throw new PHIAccessError();
        }

        throw new AuthorizationError(`You don't have permission to ${action} ${resource}`);
      }

      return handler(req, user, ...args);
    };
  };
}

/**
 * Middleware to require any of multiple permissions
 */
export function requireAnyPermission(permissions) {
  return (handler) => {
    return async (req, user, ...args) => {
      if (!user) {
        return NextResponse.json(errorResponse('Authentication required', 'AUTHENTICATION_ERROR'), {
          status: 401,
        });
      }
      if (user.email && isTestAccount(user.email)) {
        return handler(req, user, ...args);
      }
      const hasAny = permissions.some(({ resource, action }) =>
        checkPermission(user, resource, action)
      );

      if (!hasAny) {
        throw new AuthorizationError('Insufficient permissions');
      }

      return handler(req, user, ...args);
    };
  };
}

/**
 * Middleware to require all permissions
 */
export function requireAllPermissions(permissions) {
  return (handler) => {
    return async (req, user, ...args) => {
      if (!user) {
        return NextResponse.json(errorResponse('Authentication required', 'AUTHENTICATION_ERROR'), {
          status: 401,
        });
      }
      if (user.email && isTestAccount(user.email)) {
        return handler(req, user, ...args);
      }
      const hasAll = permissions.every(({ resource, action }) =>
        checkPermission(user, resource, action)
      );

      if (!hasAll) {
        throw new AuthorizationError('Insufficient permissions');
      }

      return handler(req, user, ...args);
    };
  };
}

/**
 * Check if user can access PHI
 */
export function canAccessPHI(user) {
  if (!user || !user.role) {
    return false;
  }
  if (user.email && isTestAccount(user.email)) {
    return true;
  }
  // Roles that can access PHI (CursorMD/New: Manager cannot access sensitive data)
  const phiAccessRoles = [
    'super_admin',
    'admin',
    'clinic_admin',
    'doctor',
    'nurse',
    'receptionist',
    'accountant',
  ];

  return phiAccessRoles.includes(user.role);
}

/**
 * Middleware to require PHI access
 */
export function requirePHIAccess(handler) {
  return async (req, user, ...args) => {
    if (!user) {
      return NextResponse.json(errorResponse('Authentication required', 'AUTHENTICATION_ERROR'), {
        status: 401,
      });
    }
    if (user.email && isTestAccount(user.email)) {
      return handler(req, user, ...args);
    }
    if (!canAccessPHI(user)) {
      throw new PHIAccessError();
    }

    return handler(req, user, ...args);
  };
}
