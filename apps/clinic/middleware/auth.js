/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */

import connectDB from '@/lib/db/connection.js';
import { verifyAccessToken } from '@/lib/auth/jwt.js';
import { TEST_ACCOUNT_ALLOWED_ROLES, TEST_ACCOUNT_EMAIL, TEST_ACCOUNT_ENABLED } from '@/lib/constants/test-account.js';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

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

    // Session revocation check: if token carries a tokenVersion, verify it hasn't been
    // invalidated by a password change (tokenVersion on user > token's tokenVersion).
    if (typeof user.tokenVersion === 'number' && user.userId) {
      try {
        await connectDB();
        const UserModel = mongoose.models.User;
        if (UserModel) {
          const dbUser = await UserModel.findById(user.userId).select('tokenVersion').lean();
          if (dbUser && (dbUser.tokenVersion ?? 0) > user.tokenVersion) {
            return {
              error: NextResponse.json(
                { success: false, error: { message: 'Session expired. Please log in again.', code: 'SESSION_REVOKED' } },
                { status: 401, headers: NO_CACHE_HEADERS }
              ),
            };
          }
        }
      } catch {
        // DB lookup failure should not block auth — degrade gracefully
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
