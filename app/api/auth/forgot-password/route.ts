import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import PasswordReset from '@/models/PasswordReset';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/auth/forgot-password
 * Request password reset - sends secret code to email
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
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

    const { email } = validationResult.data;

    // Find user by email (check across all tenants for security)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json(
        successResponse({
          message: 'If an account exists with this email, a password reset code has been sent.',
        })
      );
    }

    // Generate 6-digit secret code
    const secretCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate any existing reset codes for this user
    await PasswordReset.updateMany(
      {
        email: email.toLowerCase(),
        tenantId: user.tenantId,
        used: false,
      },
      { used: true }
    );

    // Create new password reset record
    await PasswordReset.create({
      email: email.toLowerCase(),
      secretCode,
      tenantId: user.tenantId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      used: false,
    });

    // TODO: Send email with secret code
    // In production, use an email service like SendGrid, AWS SES, etc.
    // For now, we'll log it (remove in production!)
    console.log(`Password reset code for ${email}: ${secretCode}`);
    
    // In development, you might want to return the code for testing
    // Remove this in production!
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        successResponse({
          message: 'Password reset code sent to your email.',
          // Only include in development
          secretCode: process.env.NODE_ENV === 'development' ? secretCode : undefined,
        })
      );
    }

    return NextResponse.json(
      successResponse({
        message: 'If an account exists with this email, a password reset code has been sent.',
      })
    );
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      errorResponse('Failed to process password reset request', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

