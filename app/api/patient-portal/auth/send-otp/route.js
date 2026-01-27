/**
 * Patient Portal OTP Send API Route
 * 
 * Sends OTP to patient's phone and email for verification during registration/booking
 * 
 * @module app/api/patient-portal/auth/send-otp/route
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { z } from 'zod';
import { sendSMS } from '@/services/notification.service.js';
import { sendEmail } from '@/lib/email/email-service.js';
import { logger } from '@/lib/utils/logger.js';
import connectDB from '@/lib/db/connection.js';

// In-memory OTP store (in production, use Redis)
const otpStore = new Map();

/**
 * Generate 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * OTP validation schema
 */
const sendOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
});

/**
 * POST /api/patient-portal/auth/send-otp
 * Send OTP to patient's phone and email
 */
async function postHandler(req) {
  try {
    const body = await req.json();
    
    const validationResult = sendOTPSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const { phone, email } = validationResult.data;
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    // Store OTP
    const otpKey = `${phone}:${email}`;
    otpStore.set(otpKey, {
      otp,
      expiresAt,
      attempts: 0,
    });
    
    // Clean up expired OTPs
    for (const [key, value] of otpStore.entries()) {
      if (value.expiresAt < Date.now()) {
        otpStore.delete(key);
      }
    }
    
    // Send OTP via SMS
    try {
      await sendSMS(phone, `Your OTP for ClinicTool is ${otp}. Valid for 10 minutes.`, null);
      logger.info('OTP sent via SMS', { phone });
    } catch (smsError) {
      logger.warn('Failed to send OTP via SMS', { error: smsError.message, phone });
      // Continue with email even if SMS fails
    }
    
    // Send OTP via Email
    try {
      await sendEmail({
        to: email,
        subject: 'Your OTP for ClinicTool',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Verification Code</h2>
            <p>Your OTP for ClinicTool is:</p>
            <div style="font-size: 32px; font-weight: bold; color: #0f89c7; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code is valid for 10 minutes.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `,
      });
      logger.info('OTP sent via email', { email });
    } catch (emailError) {
      logger.error('Failed to send OTP via email', emailError, { email });
      // Don't fail if email fails, SMS might have worked
    }
    
    return NextResponse.json(
      successResponse({
        message: 'OTP sent successfully',
        expiresIn: 600, // seconds
      })
    );
  } catch (error) {
    logger.error('Failed to send OTP', error);
    return NextResponse.json(
      errorResponse('Failed to send OTP. Please try again.', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export const POST = withErrorHandler(
  apiRateLimit(
    postHandler
  )
);

// Export for use in verify endpoint
export { otpStore };
