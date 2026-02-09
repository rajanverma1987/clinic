/**
 * Magic Link API
 * Passwordless login via email
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { sendMagicLink, verifyMagicLink } from '@/lib/auth/magic-link.js';
import { z } from 'zod';

const sendMagicLinkSchema = z.object({
  email: z.string().email(),
});

const verifyMagicLinkSchema = z.object({
  token: z.string(),
  email: z.string().email(),
});

/**
 * POST /api/auth/magic-link
 * Send magic link email
 */
async function postHandler(req) {
  const body = await req.json();

  const validationResult = sendMagicLinkSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await sendMagicLink(validationResult.data.email);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/auth/magic-link/verify
 * Verify magic link and login
 */
async function verifyHandler(req) {
  const body = await req.json();

  const validationResult = verifyMagicLinkSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  try {
    const result = await verifyMagicLink(validationResult.data.token, validationResult.data.email);

    const response = NextResponse.json(successResponse({
      user: result.user,
      accessToken: result.accessToken,
    }));

    // Set refresh token in httpOnly cookie
    response.cookies.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      errorResponse(error.message, 'MAGIC_LINK_ERROR'),
      { status: 400 }
    );
  }
}

export const POST = withErrorHandler(
  apiRateLimit(postHandler)
);
