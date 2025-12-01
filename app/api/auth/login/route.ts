import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { loginUser } from '@/services/auth.service';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * POST /api/auth/login
 * Login user and return JWT tokens
 */
export async function POST(req: NextRequest) {
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
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(
        error.message || 'Login failed',
        'LOGIN_ERROR'
      ),
      { status: 401 }
    );
  }
}

