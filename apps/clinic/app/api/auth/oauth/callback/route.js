/**
 * OAuth Callback Handler
 * Handles OAuth callbacks from Google, Apple, etc.
 */

import { NextResponse } from 'next/server';
import { handleOAuthCallback } from '@/lib/auth/oauth.js';
import { successResponse, errorResponse } from '@/lib/utils/api-response.js';

/**
 * GET /api/auth/oauth/callback
 * Handle OAuth callback
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const provider = searchParams.get('provider') || 'google';
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        errorResponse(`OAuth error: ${error}`, 'OAUTH_ERROR'),
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        errorResponse('Authorization code is required', 'OAUTH_ERROR'),
        { status: 400 }
      );
    }

    const result = await handleOAuthCallback(provider, code, state);

    // Set refresh token in httpOnly cookie
    const response = NextResponse.json(successResponse({
      user: result.user,
      accessToken: result.accessToken,
    }));

    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      errorResponse(error.message, 'OAUTH_ERROR'),
      { status: 500 }
    );
  }
}
