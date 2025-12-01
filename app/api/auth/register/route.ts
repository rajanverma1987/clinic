import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { registerUser } from '@/services/auth.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(req: NextRequest) {
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
  } catch (error: any) {
    // Handle MongoDB errors
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    // Handle business logic errors
    return NextResponse.json(
      errorResponse(
        error.message || 'Registration failed',
        'REGISTRATION_ERROR'
      ),
      { status: 400 }
    );
  }
}

