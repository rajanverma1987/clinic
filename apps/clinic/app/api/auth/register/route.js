import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { registerUser } from '@/services/auth.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';
import { authRateLimit } from '@/middleware/rate-limit';
import { withErrorHandler } from '@/middleware/error-handler';

/**
 * POST /api/auth/register
 * Register a new user
 */
async function registerHandler(req) {
  try {
    const body = await req.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    // Register user
    const result = await registerUser(validationResult.data);

    return NextResponse.json(successResponse(result), { status: 201 });
  } catch (error) {
    throw error;
  }
}

export const POST = withErrorHandler(authRateLimit(registerHandler));

