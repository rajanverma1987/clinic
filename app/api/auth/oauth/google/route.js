/**
 * Google OAuth Authorization Endpoint
 */

import { NextResponse } from 'next/server';
import { getOAuthUrl } from '@/lib/auth/oauth.js';
import { successResponse, errorResponse } from '@/lib/utils/api-response.js';

/**
 * GET /api/auth/oauth/google
 * Redirect to Google OAuth
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state') || 'default';

    const authUrl = getOAuthUrl('google', state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.json(
      errorResponse(error.message, 'OAUTH_ERROR'),
      { status: 500 }
    );
  }
}
