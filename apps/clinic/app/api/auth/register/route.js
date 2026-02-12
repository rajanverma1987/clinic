import { errorResponse, successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { registerSchema } from '@/lib/validations/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { authRateLimit } from '@/middleware/rate-limit';
import { registerUser } from '@/services/auth.service';
import { NextResponse } from 'next/server';

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
      return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
        status: 400,
      });
    }

    // Register user (no duplicate accounts: service checks email globally for clinic_admin, per-tenant for others)
    const result = await registerUser(validationResult.data);

    return NextResponse.json(successResponse(result), { status: 201 });
  } catch (error) {
    const msg = error?.message || '';
    if (msg.includes('already exists') || msg.includes('already registered')) {
      return NextResponse.json(
        errorResponse(
          msg.includes('tenant')
            ? 'User with this email already exists in this clinic.'
            : 'An account with this email already exists. Sign in or use a different email.',
          'DUPLICATE_EMAIL',
        ),
        { status: 400 },
      );
    }
    throw error;
  }
}

export const POST = withErrorHandler(authRateLimit(registerHandler));
