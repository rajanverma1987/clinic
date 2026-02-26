/**
 * OAuth Callback Handler
 * Exchanges code for tokens, sets cookies, redirects to app so social login completes.
 */

import { NextResponse } from 'next/server';
import { handleOAuthCallback } from '@/lib/auth/oauth.js';

const OAUTH_ACCESS_COOKIE = 'oauth_at';
const OAUTH_ACCESS_MAX_AGE = 60; // 1 min for client to read and clear

/**
 * GET /api/auth/oauth/callback
 * Handle OAuth callback from Google (or provider). Redirect to login with token in cookie.
 */
export async function GET(req) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (req.headers.get('x-forwarded-proto') && req.headers.get('host')
      ? `${req.headers.get('x-forwarded-proto')}://${req.headers.get('host')}`
      : 'http://localhost:3000');
  const loginUrl = `${baseUrl.replace(/\/$/, '')}/login`;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const provider = searchParams.get('provider') || 'google';
    const error = searchParams.get('error');

    if (error) {
      const errMsg = searchParams.get('error_description') || error;
      return NextResponse.redirect(`${loginUrl}?oauth_error=${encodeURIComponent(errMsg)}`);
    }

    if (!code) {
      return NextResponse.redirect(`${loginUrl}?oauth_error=${encodeURIComponent('Missing authorization code')}`);
    }

    const result = await handleOAuthCallback(provider, code, searchParams.get('state') || '');

    const redirect = NextResponse.redirect(`${loginUrl}?oauth=success`, 302);

    redirect.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    redirect.cookies.set(OAUTH_ACCESS_COOKIE, result.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: OAUTH_ACCESS_MAX_AGE,
    });

    return redirect;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OAuth failed';
    return NextResponse.redirect(`${loginUrl}?oauth_error=${encodeURIComponent(message)}`);
  }
}
