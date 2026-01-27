/**
 * Admin Doctors Bulk Action API
 * POST /api/admin/doctors/bulk-action
 * Body: { doctorIds: string[], action: 'suspend' | 'activate' | 'export' | 'notify' }
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Doctor from '@/models/Doctor';
import { logger } from '@/lib/utils/logger.js';

async function postHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { doctorIds, action } = body || {};
    if (!Array.isArray(doctorIds) || !doctorIds.length || !action) {
      return NextResponse.json(
        errorResponse('doctorIds (array) and action are required', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    await connectDB();

    if (action === 'suspend') {
      await Doctor.updateMany(
        { _id: { $in: doctorIds } },
        { $set: { verificationStatus: 'suspended', status: 'inactive', updatedAt: new Date() } }
      );
      return NextResponse.json(successResponse({ updated: doctorIds.length, action: 'suspend' }));
    }
    if (action === 'activate') {
      await Doctor.updateMany(
        { _id: { $in: doctorIds } },
        { $set: { verificationStatus: 'verified', status: 'active', updatedAt: new Date() } }
      );
      return NextResponse.json(successResponse({ updated: doctorIds.length, action: 'activate' }));
    }
    if (action === 'export' || action === 'notify') {
      return NextResponse.json(
        successResponse({ message: 'Action recorded', action, count: doctorIds.length })
      );
    }

    return NextResponse.json(
      errorResponse('Supported bulk actions: suspend, activate, export, notify', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  } catch (err) {
    logger.error('Admin doctors bulk-action error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Bulk action failed', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export const POST = withAuth(postHandler);
