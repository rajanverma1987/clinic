/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt.js';

/**
 * Middleware to authenticate requests
 */
export async function authenticate(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json(
        { success: false, error: { message: 'Missing or invalid authorization header' } },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);

  try {
    const user = verifyAccessToken(token);
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
        { status: 401 }
      ),
    };
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withAuth(handler) {
  return async (req) => {
    const authResult = await authenticate(req);

    if ('error' in authResult) {
      return authResult.error;
    }

    const authenticatedReq = req;
    authenticatedReq.user = authResult.user;

    return handler(authenticatedReq, authResult.user);
  };
}

