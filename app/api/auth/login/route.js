import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { loginUser } from '@/services/auth.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { authRateLimit } from '@/middleware/rate-limit';
import { withErrorHandler } from '@/middleware/error-handler';

/**
 * POST /api/auth/login
 * Login user and return JWT tokens
 */
async function loginHandler(req) {
  try {
    const body = await req.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    // Login user
    const result = await loginUser(validationResult.data);

    // If 2FA is required, return early without setting cookies
    if (result.require2FA) {
      return NextResponse.json(successResponse(result), { status: 200 });
    }

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
  } catch (error) {
    throw error;
  }
}

export const POST = withErrorHandler(authRateLimit(loginHandler));

