/**
 * Admin Patients API
 * List patients across tenants (Super Admin only).
 *
 * @module app/api/admin/patients/route
 * GET /api/admin/patients - List all patients with search, filters, pagination
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Patient from '@/models/Patient';
import { logger } from '@/lib/utils/logger.js';

/**
 * GET /api/admin/patients
 * Query: search, tenantId, status, page, limit
 */
async function getHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const tenantId = searchParams.get('tenantId') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const query = { deletedAt: null };

    if (tenantId) {
      query.tenantId = tenantId;
    }

    if (status) {
      query.status = status;
    }

    if (search && search.trim()) {
      const trim = search.trim();
      query.$or = [
        { firstName: { $regex: trim, $options: 'i' } },
        { lastName: { $regex: trim, $options: 'i' } },
        { email: { $regex: trim, $options: 'i' } },
        { phone: { $regex: trim, $options: 'i' } },
        { patientId: { $regex: trim, $options: 'i' } },
      ];
    }

    const total = await Patient.countDocuments(query);
    const skip = (page - 1) * limit;
    const patients = await Patient.find(query)
      .select('firstName lastName email phone dateOfBirth gender status patientId tenantId createdAt')
      .populate('tenantId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const data = patients.map((p) => ({
      _id: p._id.toString(),
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      status: p.status || 'active',
      patientId: p.patientId,
      tenantId: p.tenantId?._id?.toString() || p.tenantId?.toString(),
      tenantName: p.tenantId?.name,
      createdAt: p.createdAt,
    }));

    return NextResponse.json(
      successResponse({
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
          totalPages: Math.ceil(total / limit) || 1,
        },
      })
    );
  } catch (err) {
    logger.error('Admin patients list error:', err);
    return NextResponse.json(
      errorResponse(
        err instanceof Error ? err.message : 'Failed to fetch patients',
        'FETCH_ERROR'
      ),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
