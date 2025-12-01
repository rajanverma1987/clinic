import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import PasswordReset from '@/models/PasswordReset';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  secretCode: z.string().length(6, 'Secret code must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST /api/auth/reset-password
 * Reset password using secret code
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
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

    const { email, secretCode, newPassword } = validationResult.data;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        errorResponse('Invalid email or secret code', 'INVALID_CODE'),
        { status: 400 }
      );
    }

    // Find valid reset code
    const resetRecord = await PasswordReset.findOne({
      email: email.toLowerCase(),
      tenantId: user.tenantId,
      secretCode,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json(
        errorResponse('Invalid or expired secret code', 'INVALID_CODE'),
        { status: 400 }
      );
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark reset code as used
    resetRecord.used = true;
    await resetRecord.save();

    // Invalidate all other reset codes for this user
    await PasswordReset.updateMany(
      {
        email: email.toLowerCase(),
        tenantId: user.tenantId,
        used: false,
      },
      { used: true }
    );

    return NextResponse.json(
      successResponse({
        message: 'Password reset successfully. You can now login with your new password.',
      })
    );
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      errorResponse('Failed to reset password', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

