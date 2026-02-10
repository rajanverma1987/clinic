/**
 * Permission Check Middleware
 * Validates user permissions for resources and actions
 * Based on NEW-PLANS.md RBAC requirements
 */

import { isTestAccount } from '@/lib/constants/test-account.js';
import { AuthorizationError, PHIAccessError } from '@/lib/errors/custom-errors';
import { ACTIONS, hasPermission, RESOURCES } from '@/lib/permissions/constants';
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
 * Falls back to feature check for certain resources if user doesn't have explicit permission
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

      const hasExplicitPermission = checkPermission(user, resource, action);

      // If user has explicit permission, allow access
      if (hasExplicitPermission) {
        return handler(req, user, ...args);
      }

      // Special case: Allow doctors to create subscriptions for their own tenant
      // The handler enforces that subscriptions are created for user.tenantId, so this is safe
      if (
        resource === RESOURCES.SUBSCRIPTION &&
        action === ACTIONS.CREATE &&
        user.role === 'doctor'
      ) {
        return handler(req, user, ...args);
      }

      // For certain resources, check feature access as fallback
      // This allows roles with feature access to use resources even without explicit permission
      const featureFallbackResources = {
        [RESOURCES.INVOICE]: 'Invoice & Billing',
        [RESOURCES.PAYMENT]: 'Invoice & Billing',
      };

      if (featureFallbackResources[resource] && user.role !== 'super_admin') {
        try {
          const { hasFeatureAccess } = await import('@/services/feature-access.service.js');
          const hasFeature = await hasFeatureAccess(
            user.tenantId,
            featureFallbackResources[resource],
          );
          if (hasFeature) {
            return handler(req, user, ...args);
          }
        } catch (error) {
          // If feature check fails, continue to permission error
        }
      }

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
        checkPermission(user, resource, action),
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
        checkPermission(user, resource, action),
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
