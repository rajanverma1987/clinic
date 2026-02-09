/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */

import { verifyAccessToken } from '@/lib/auth/jwt.js';
import { TEST_ACCOUNT_ALLOWED_ROLES, TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_ENABLED } from '@/lib/constants/test-account.js';
import { NextResponse } from 'next/server';

/**
 * Middleware to authenticate requests
 */
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export async function authenticate(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { success: false, error: { message: 'Missing or invalid authorization header' } },
        { status: 401, headers: NO_CACHE_HEADERS }
      ),
    };
  }

  const token = authHeader.substring(7);

  try {
    const user = verifyAccessToken(token);
    if (TEST_ACCOUNT_ENABLED && user?.email && user.email.toLowerCase() === TEST_ACCOUNT_EMAIL) {
      const testRoleHeader = request.headers.get('x-test-account-role');
      if (testRoleHeader) {
        const allowed = TEST_ACCOUNT_ALLOWED_ROLES.map((r) => r.value);
        if (allowed.includes(testRoleHeader)) {
          user.role = testRoleHeader;
        }
      }
    }
    return { user };
  } catch (error) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Invalid token',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401, headers: NO_CACHE_HEADERS }
      ),
    };
  }
}

/**
 * Middleware wrapper for API routes.
 * Forwards (req, ...args) so dynamic route context (e.g. params) reaches the handler.
 */
export function withAuth(handler) {
  return async (req, ...args) => {
    const authResult = await authenticate(req);

    if ('error' in authResult) {
      return authResult.error;
    }

    const authenticatedReq = req;
    authenticatedReq.user = authResult.user;

    return handler(authenticatedReq, authResult.user, ...args);
  };
}
