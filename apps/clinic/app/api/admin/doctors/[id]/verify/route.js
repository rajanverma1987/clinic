/**
 * Admin Doctor Verify API (dp-6)
 * POST /api/admin/doctors/:id/verify
 * Body: { action: 'approve' | 'reject', comment?: string }
 * On approve: set verificationStatus=verified, status=active, send verification-approved email.
 * On reject: set verificationStatus=rejected, verificationComment=comment, send verification-rejected email with comment.
 */

import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { sendDoctorVerificationResultEmail } from '@/lib/email/email-service.js';
import { logger } from '@/lib/utils/logger.js';

async function postHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }
    if (!id) {
      return NextResponse.json(
        errorResponse('Doctor ID required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = (body.action || '').toLowerCase();
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        errorResponse('action must be "approve" or "reject"', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }
    if (action === 'reject' && !comment) {
      return NextResponse.json(
        errorResponse('Comment is required when rejecting', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();
    const doctor = await Doctor.findById(id).populate('userId', 'firstName lastName email').lean();
    if (!doctor) {
      return NextResponse.json(
        errorResponse('Doctor not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const tenantId = doctor.tenantId?.toString() || null;
    const doctorUser = doctor.userId;
    const doctorEmail = doctorUser?.email;
    const doctorName = doctorUser
      ? [doctorUser.firstName, doctorUser.lastName].filter(Boolean).join(' ') || 'Doctor'
      : 'Doctor';

    if (action === 'approve') {
      await Doctor.findByIdAndUpdate(id, {
        $set: {
          verificationStatus: 'verified',
          status: 'active',
          verificationComment: '',
          verificationReviewedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      if (doctor.userId) {
        await User.findByIdAndUpdate(doctor.userId._id || doctor.userId, {
          $set: { isActive: true, status: 'active', updatedAt: new Date() },
        });
      }
      if (doctorEmail) {
        await sendDoctorVerificationResultEmail(
          doctorEmail,
          doctorName,
          'approve',
          comment,
          tenantId
        );
      }
      return NextResponse.json(
        successResponse({ verified: true, message: 'Doctor approved. Email sent.' })
      );
    }

    if (action === 'reject') {
      await Doctor.findByIdAndUpdate(id, {
        $set: {
          verificationStatus: 'rejected',
          status: 'inactive',
          verificationComment: comment,
          verificationReviewedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      if (doctor.userId) {
        await User.findByIdAndUpdate(doctor.userId._id || doctor.userId, {
          $set: { isActive: false, status: 'inactive', updatedAt: new Date() },
        });
      }
      if (doctorEmail) {
        await sendDoctorVerificationResultEmail(
          doctorEmail,
          doctorName,
          'reject',
          comment,
          tenantId
        );
      }
      return NextResponse.json(
        successResponse({ rejected: true, message: 'Doctor rejected. Email notification sent.' })
      );
    }

    return NextResponse.json(
      errorResponse('Invalid action', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  } catch (err) {
    logger.error('Admin doctor verify error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Verification failed', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function POST(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return postHandler(authenticatedReq, authResult.user, params.id);
}
