/**
 * Admin Doctor by ID API
 * GET /api/admin/doctors/:id - Doctor details (cross-tenant, Super Admin only)
 * PUT /api/admin/doctors/:id - Update verificationStatus/status (e.g. suspend/activate)
 * DELETE /api/admin/doctors/:id - Remove doctor, deactivate user
 */

import { NextResponse } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { logger } from '@/lib/utils/logger.js';

async function getHandler(req, user, id) {
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

    await connectDB();
    const doctor = await Doctor.findById(id)
      .populate('userId', 'firstName lastName email phone avatar')
      .populate('tenantId', 'name slug region')
      .lean();

    if (!doctor) {
      return NextResponse.json(
        errorResponse('Doctor not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const data = {
      _id: doctor._id.toString(),
      userId: doctor.userId
        ? {
            _id: doctor.userId._id.toString(),
            firstName: doctor.userId.firstName,
            lastName: doctor.userId.lastName,
            email: doctor.userId.email,
            phone: doctor.userId.phone,
            avatar: doctor.userId.avatar,
          }
        : null,
      verificationStatus: doctor.verificationStatus || 'pending',
      status: doctor.status,
      professional: doctor.professional,
      schedule: doctor.schedule,
      consultationFee: doctor.consultationFee,
      departments: doctor.departments,
      bio: doctor.bio,
      tenantId: doctor.tenantId?._id?.toString(),
      tenantName: doctor.tenantId?.name,
      verificationComment: doctor.verificationComment,
      verificationReviewedAt: doctor.verificationReviewedAt,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    };

    return NextResponse.json(successResponse(data));
  } catch (err) {
    logger.error('Admin doctor get error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to fetch doctor', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}

async function putHandler(req, user, id) {
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
    const { status: bodyStatus } = body;

    await connectDB();
    const doctor = await Doctor.findById(id).lean();
    if (!doctor) {
      return NextResponse.json(
        errorResponse('Doctor not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const updates = { updatedAt: new Date() };
    if (bodyStatus === 'suspended') {
      updates.verificationStatus = 'suspended';
      updates.status = 'inactive';
    } else if (bodyStatus === 'active') {
      updates.verificationStatus = 'verified';
      updates.status = 'active';
    }

    const updated = await Doctor.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    return NextResponse.json(
      successResponse({
        _id: updated._id.toString(),
        verificationStatus: updated.verificationStatus,
        status: updated.status,
      })
    );
  } catch (err) {
    logger.error('Admin doctor update error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to update doctor', 'UPDATE_ERROR'),
      { status: 500 }
    );
  }
}

async function deleteHandler(req, user, id) {
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

    await connectDB();
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json(
        errorResponse('Doctor not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    const userId = doctor.userId && doctor.userId.toString ? doctor.userId.toString() : doctor.userId;
    await Doctor.findByIdAndDelete(id);
    if (userId) {
      await User.updateOne(
        { _id: userId },
        { $set: { isActive: false, status: 'inactive', updatedAt: new Date() } }
      );
    }

    return NextResponse.json(
      successResponse({ _id: id, deleted: true })
    );
  } catch (err) {
    logger.error('Admin doctor delete error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to delete doctor', 'DELETE_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return getHandler(authenticatedReq, authResult.user, params.id);
}

export async function PUT(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return putHandler(authenticatedReq, authResult.user, params.id);
}

export async function DELETE(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return deleteHandler(authenticatedReq, authResult.user, params.id);
}
