/**
 * Patient Email Verification API Route
 * Verifies patient email address using verification token
 * Based on Registeration-Login.md requirements
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import Patient from '@/models/Patient.js';
import { withTenant } from '@/lib/db/tenant-helper.js';

/**
 * GET /api/patient-portal/auth/verify-email/:token
 * Verify patient email address
 */
async function getHandler(req, { params }) {
  await connectDB();

  const { token } = await params;

  if (!token) {
    return NextResponse.json(
      errorResponse('Verification token is required', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  // Find patient with matching verification token
  const patient = await Patient.findOne({
    'portalAccess.verificationToken': token,
    'portalAccess.verificationExpires': { $gt: new Date() },
    'portalAccess.enabled': true,
  });

  if (!patient) {
    return NextResponse.json(
      errorResponse('Invalid or expired verification token', 'INVALID_TOKEN'),
      { status: 400 }
    );
  }

  // Update patient - mark email as verified
  patient.portalAccess.emailVerified = true;
  patient.portalAccess.verificationToken = undefined;
  patient.portalAccess.verificationExpires = undefined;
  await patient.save();

  return NextResponse.json(
    successResponse({
      message: 'Email verified successfully! You can now login.',
      email: patient.portalAccess.email,
    }),
    { status: 200 }
  );
}

// Apply middleware stack (no auth required for verification)
export const GET = withErrorHandler(
  apiRateLimit(getHandler)
);
