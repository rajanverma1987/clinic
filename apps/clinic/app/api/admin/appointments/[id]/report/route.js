/**
 * Admin single-appointment report download (Super Admin only)
 * GET /api/admin/appointments/:id/report - Returns CSV for that appointment
 */

import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import Appointment from '@/models/Appointment';
import { logger } from '@/lib/utils/logger.js';

function escapeCsv(val) {
  if (val == null) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function getHandler(req, user, id) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }
    if (!id) {
      return NextResponse.json({ success: false, error: 'Appointment ID required' }, { status: 400 });
    }
    await connectDB();
    const appointment = await Appointment.findOne({ _id: id, deletedAt: null })
      .populate('patientId', 'firstName lastName phone email patientId')
      .populate('doctorId', 'firstName lastName email')
      .populate('tenantId', 'name slug')
      .lean();
    if (!appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }
    const patientName = appointment.patientId
      ? `${appointment.patientId.firstName || ''} ${appointment.patientId.lastName || ''}`.trim()
      : '';
    const doctorName = appointment.doctorId
      ? `${appointment.doctorId.firstName || ''} ${appointment.doctorId.lastName || ''}`.trim()
      : '';
    const tenantName = appointment.tenantId?.name || '';
    const dateStr = appointment.appointmentDate ? new Date(appointment.appointmentDate).toISOString().slice(0, 10) : '';
    const startStr = appointment.startTime ? new Date(appointment.startTime).toISOString() : '';
    const endStr = appointment.endTime ? new Date(appointment.endTime).toISOString() : '';
    const headers = [
      'Appointment ID',
      'Booking Number',
      'Date',
      'Start',
      'End',
      'Status',
      'Type',
      'Patient',
      'Doctor',
      'Tenant',
      'Telemedicine',
    ];
    const row = [
      id,
      appointment.appointmentNumber || '',
      dateStr,
      startStr,
      endStr,
      appointment.status || '',
      appointment.type || '',
      patientName,
      doctorName,
      tenantName,
      appointment.isTelemedicine ? 'Yes' : 'No',
    ];
    const csv = [headers.map(escapeCsv).join(','), row.map(escapeCsv).join(',')].join('\r\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="appointment-${id}-report.csv"`,
      },
    });
  } catch (err) {
    logger.error('Admin appointment report error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function GET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return getHandler(req, authResult.user, params.id);
}
