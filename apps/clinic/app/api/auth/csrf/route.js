/**
 * GET /api/auth/csrf
 * Issue a fresh CSRF token as a non-httpOnly cookie.
 * The client JS reads this cookie and attaches it as X-CSRF-Token on every
 * state-mutating request (POST / PUT / PATCH / DELETE).
 */

import { NextResponse } from 'next/server';
import { generateCsrfToken, CSRF_COOKIE_NAME, CSRF_COOKIE_OPTIONS } from '@/lib/utils/csrf';
import { withErrorHandler } from '@/middleware/error-handler';

async function getCsrfToken() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token }, { status: 200 });
  response.cookies.set(CSRF_COOKIE_NAME, token, CSRF_COOKIE_OPTIONS);
  return response;
}

export const GET = withErrorHandler(getCsrfToken);
