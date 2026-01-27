/**
 * Patient Portal OTP Verify API Route
 * 
 * Verifies OTP sent to patient's phone/email
 * 
 * @module app/api/patient-portal/auth/verify-otp/route
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger.js';
import { otpStore } from '../send-otp/route.js';

/**
 * OTP verification schema
 */
const verifyOTPSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

/**
 * POST /api/patient-portal/auth/verify-otp
 * Verify OTP
 */
async function postHandler(req) {
  try {
    const body = await req.json();
    
    const validationResult = verifyOTPSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const { phone, email, otp } = validationResult.data;
    const otpKey = `${phone}:${email}`;
    
    // Get stored OTP
    const stored = otpStore.get(otpKey);
    
    if (!stored) {
      return NextResponse.json(
        errorResponse('OTP not found or expired. Please request a new OTP.', 'OTP_NOT_FOUND'),
        { status: 400 }
      );
    }
    
    // Check expiry
    if (stored.expiresAt < Date.now()) {
      otpStore.delete(otpKey);
      return NextResponse.json(
        errorResponse('OTP has expired. Please request a new OTP.', 'OTP_EXPIRED'),
        { status: 400 }
      );
    }
    
    // Check attempts (max 3 attempts)
    if (stored.attempts >= 3) {
      otpStore.delete(otpKey);
      return NextResponse.json(
        errorResponse('Too many failed attempts. Please request a new OTP.', 'OTP_MAX_ATTEMPTS'),
        { status: 400 }
      );
    }
    
    // Verify OTP
    if (stored.otp !== otp) {
      stored.attempts++;
      otpStore.set(otpKey, stored);
      
      logger.warn('Invalid OTP attempt', {
        phone,
        email,
        attempts: stored.attempts,
      });
      
      return NextResponse.json(
        errorResponse(`Invalid OTP. ${3 - stored.attempts} attempts remaining.`, 'OTP_INVALID'),
        { status: 400 }
      );
    }
    
    // OTP verified - delete from store
    otpStore.delete(otpKey);
    
    logger.info('OTP verified successfully', { phone, email });
    
    return NextResponse.json(
      successResponse({
        message: 'OTP verified successfully',
        verified: true,
      })
    );
  } catch (error) {
    logger.error('Failed to verify OTP', error);
    return NextResponse.json(
      errorResponse('Failed to verify OTP. Please try again.', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export const POST = withErrorHandler(
  apiRateLimit(
    postHandler
  )
);
