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
 * Query: search, tenantId, status, dateFrom, dateTo, doctorId, hasAppointments, sortBy, sortOrder, page, limit
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
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const doctorId = searchParams.get('doctorId') || '';
    const hasAppointments = searchParams.get('hasAppointments');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const query = { deletedAt: null };

    if (tenantId) {
      query.tenantId = tenantId;
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    if (doctorId || hasAppointments === 'true' || hasAppointments === true) {
      const Appointment = (await import('@/models/Appointment')).default;
      const apptQuery = { deletedAt: null };
      if (doctorId) apptQuery.doctorId = doctorId;
      const patientIds = await Appointment.distinct('patientId', apptQuery);
      if (patientIds && patientIds.length) {
        query._id = { $in: patientIds };
      } else {
        query._id = { $in: [] };
      }
    } else if (hasAppointments === 'false' || hasAppointments === false) {
      const Appointment = (await import('@/models/Appointment')).default;
      const withAppts = await Appointment.distinct('patientId', { deletedAt: null });
      query._id = withAppts.length ? { $nin: withAppts } : {};
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

    const order = sortOrder === 'asc' ? 1 : -1;
    const sortField = sortBy === 'name' ? { lastName: order, firstName: order } : { [sortBy]: order };

    const total = await Patient.countDocuments(query);
    const skip = (page - 1) * limit;
    const patients = await Patient.find(query)
      .select('firstName lastName email phone dateOfBirth gender status patientId tenantId createdAt flagged flaggedAt flagReason')
      .populate('tenantId', 'name slug')
      .sort(sortField)
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
      flagged: !!p.flagged,
      flaggedAt: p.flaggedAt,
      flagReason: p.flagReason,
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
