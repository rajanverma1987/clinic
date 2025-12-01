import { NextRequest, NextResponse } from 'next/server';
import { refreshTokenSchema } from '@/lib/validations/auth';
import { refreshAccessToken } from '@/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(req: NextRequest) {
  try {
    // Get refresh token from body or cookie
    const body = await req.json().catch(() => ({}));
    const refreshToken = body.refreshToken || req.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        errorResponse('Refresh token is required', 'MISSING_TOKEN'),
        { status: 400 }
      );
    }

    // Validate input
    const validationResult = refreshTokenSchema.safeParse({ refreshToken });
    if (!validationResult.success) {
      return NextResponse.json(
        errorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          validationResult.error.errors
        ),
        { status: 400 }
      );
    }

    // Refresh access token
    const result = await refreshAccessToken(refreshToken);

    return NextResponse.json(successResponse(result), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(
        error.message || 'Token refresh failed',
        'REFRESH_ERROR'
      ),
      { status: 401 }
    );
  }
}

