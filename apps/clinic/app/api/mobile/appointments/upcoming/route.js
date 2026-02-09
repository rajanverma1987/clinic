/**
 * Mobile API - Upcoming Appointments
 * Optimized for mobile devices
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { successResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection.js';
import Appointment from '@/models/Appointment.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AppointmentStatus } from '@/models/Appointment.js';

/**
 * GET /api/mobile/appointments/upcoming
 * Get upcoming appointments (mobile-optimized)
 */
async function getHandler(req, user) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const doctorId = searchParams.get('doctorId');

  const query = withTenant(user.tenantId, {
    status: {
      $in: [
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.IN_QUEUE,
      ],
    },
    appointmentDate: { $gte: new Date() },
    deletedAt: null,
  });

  if (doctorId) {
    query.doctorId = doctorId;
  }

  const appointments = await Appointment.find(query)
    .populate('patientId', 'firstName lastName patientId phone')
    .populate('doctorId', 'firstName lastName')
    .sort({ appointmentDate: 1, startTime: 1 })
    .limit(limit)
    .lean();

  // Mobile-optimized response (minimal data)
  const mobileAppointments = appointments.map((apt) => ({
    _id: apt._id,
    appointmentNumber: apt.appointmentNumber,
    appointmentDate: apt.appointmentDate,
    startTime: apt.startTime,
    endTime: apt.endTime,
    status: apt.status,
    type: apt.type,
    patient: {
      _id: apt.patientId?._id,
      name: `${apt.patientId?.firstName || ''} ${apt.patientId?.lastName || ''}`.trim(),
      patientId: apt.patientId?.patientId,
      phone: apt.patientId?.phone,
    },
    doctor: {
      _id: apt.doctorId?._id,
      name: `${apt.doctorId?.firstName || ''} ${apt.doctorId?.lastName || ''}`.trim(),
    },
  }));

  return NextResponse.json(successResponse(mobileAppointments));
}

export const GET = withErrorHandler(withAuth(getHandler));
