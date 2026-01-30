/**
 * 2FA Verification API Route
 * Completes login after 2FA verification
 * Based on Registeration-Login.md requirements
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { authRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { verify2FASchema } from '@/lib/validations/auth';
import { verify2FA } from '@/services/auth.service';

/**
 * POST /api/auth/verify-2fa
 * Verify 2FA OTP and complete login
 */
async function postHandler(req) {
  const body = await req.json();

  // Validate input
  const validationResult = verify2FASchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  // Verify 2FA and complete login
  const result = await verify2FA(validationResult.data);

  // Set refresh token as HTTP-only cookie
  const response = NextResponse.json(successResponse(result), { status: 200 });
  
  response.cookies.set('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}

export const POST = withErrorHandler(authRateLimit(postHandler));
