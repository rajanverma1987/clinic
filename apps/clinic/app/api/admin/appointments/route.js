/**
 * Admin Appointments API - All appointments across platform (Super Admin only)
 * @module app/api/admin/appointments/route
 * GET /api/admin/appointments?status=&type=&doctorId=&patientId=&tenantId=&startDate=&endDate=&search=&page=&limit=
 * Returns data, pagination, and stats (total, completed, cancelled, no_show) for current filter.
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Appointment from '@/models/Appointment';
import { logger } from '@/lib/utils/logger.js';

async function getHandler(req, user) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const tenantId = searchParams.get('tenantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const query = { deletedAt: null };
    if (status) query.status = status;
    if (type && type.trim()) query.type = type.trim();
    if (doctorId) query.doctorId = doctorId;
    if (patientId) query.patientId = patientId;
    if (tenantId) query.tenantId = tenantId;
    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }
    if (search && search.trim()) query.appointmentNumber = { $regex: search.trim(), $options: 'i' };

    const [total, statsResult, appointments] = await Promise.all([
      Appointment.countDocuments(query),
      Appointment.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Appointment.find(query)
        .populate('patientId', 'firstName lastName phone email patientId')
        .populate('doctorId', 'firstName lastName email')
        .populate('tenantId', 'name slug')
        .sort({ appointmentDate: -1, startTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const stats = { total, completed: 0, cancelled: 0, no_show: 0 };
    (statsResult || []).forEach((s) => {
      if (s._id === 'completed') stats.completed = s.count;
      else if (s._id === 'cancelled') stats.cancelled = s.count;
      else if (s._id === 'no_show') stats.no_show = s.count;
    });

    const data = appointments.map((a) => ({
      _id: a._id.toString(),
      appointmentNumber: a.appointmentNumber,
      appointmentDate: a.appointmentDate,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      type: a.type,
      patientId: a.patientId?._id?.toString(),
      patientName: a.patientId ? `${a.patientId.firstName || ''} ${a.patientId.lastName || ''}`.trim() : null,
      doctorId: a.doctorId?._id?.toString(),
      doctorName: a.doctorId ? `${a.doctorId.firstName || ''} ${a.doctorId.lastName || ''}`.trim() : null,
      tenantId: a.tenantId?._id?.toString(),
      tenantName: a.tenantId?.name,
      isTelemedicine: a.isTelemedicine,
      createdAt: a.createdAt,
    }));

    return NextResponse.json(
      successResponse({
        data,
        stats,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1, totalPages: Math.ceil(total / limit) || 1 },
      })
    );
  } catch (err) {
    logger.error('Admin appointments error:', err);
    return NextResponse.json(
      errorResponse(err instanceof Error ? err.message : 'Failed to fetch appointments', 'FETCH_ERROR'),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
