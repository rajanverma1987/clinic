/**
 * Admin Doctors API
 * List doctors across tenants, bulk actions (Super Admin only).
 * Used by admin doctors list and verification flows (dp-6).
 *
 * GET /api/admin/doctors - List with verificationStatus, search, specialty, location, page, limit
 * POST /api/admin/doctors - Not used for create; use POST /api/admin/doctors/bulk-action via body
 *
 * Frontend calls GET /admin/doctors?page=&limit=&verificationStatus=&search=&specialty=&location=
 * and POST /admin/doctors with body { doctorIds, action } for bulk-action.
 * Next.js route for POST /api/admin/doctors receives POST to same path - so we use POST for bulk-action only.
 */

import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { withAuth } from '@/middleware/auth';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const verificationStatus = searchParams.get('verificationStatus') || '';
    const search = (searchParams.get('search') || '').trim();
    const specialty = searchParams.get('specialty') || '';
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const query = {};

    if (
      verificationStatus &&
      ['verified', 'pending', 'rejected', 'suspended'].includes(verificationStatus)
    ) {
      query.verificationStatus = verificationStatus;
    }

    if (specialty) {
      query['professional.specialization'] = new RegExp(specialty, 'i');
    }

    if (search) {
      const users = await User.find({
        role: 'doctor',
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean();
      const userIds = users.map((u) => u._id);
      if (userIds.length) {
        query.userId = { $in: userIds };
      } else {
        query['professional.licenseNumber'] = { $regex: search, $options: 'i' };
      }
    }

    const total = await Doctor.countDocuments(query);
    const skip = (page - 1) * limit;
    const sortField = [
      'createdAt',
      'updatedAt',
      'verificationStatus',
      'professional.licenseNumber',
    ].includes(sortBy)
      ? sortBy
      : 'updatedAt';
    const doctors = await Doctor.find(query)
      .populate('userId', 'firstName lastName email phone')
      .populate('tenantId', 'name slug region')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const data = doctors.map((d) => {
      const base = {
        _id: d._id.toString(),
        userId: d.userId
          ? {
              _id: d.userId._id.toString(),
              firstName: d.userId.firstName,
              lastName: d.userId.lastName,
              email: d.userId.email,
              phone: d.userId.phone,
            }
          : null,
        email: d.userId?.email,
        firstName: d.userId?.firstName,
        lastName: d.userId?.lastName,
        phone: d.userId?.phone,
        verificationStatus: d.verificationStatus || 'pending',
        status: d.status,
        professional: d.professional,
        consultationFee: d.consultationFee,
        videoConsultationFee: d.videoConsultationFee,
        followUpFee: d.followUpFee,
        procedureFees: d.procedureFees,
        insuranceAccepted: d.insuranceAccepted,
        clinics: d.clinics,
        departments: d.departments,
        bio: d.bio,
        schedule: d.schedule,
        tenantId: d.tenantId?._id?.toString() || d.tenantId?.toString(),
        tenantName: d.tenantId?.name,
        tenantRegion: d.tenantId?.region,
        verificationComment: d.verificationComment,
        verificationReviewedAt: d.verificationReviewedAt,
        uploadedDocuments: d.uploadedDocuments,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
      return base;
    });

    return NextResponse.json(
      successResponse({
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      }),
    );
  } catch (err) {
    logger.error('Admin doctors list error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to fetch doctors', 'FETCH_ERROR'),
      { status: 500 },
    );
  }
}

export const GET = withAuth(getHandler);
