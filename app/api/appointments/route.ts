import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { createAppointmentSchema, appointmentQuerySchema } from '@/lib/validations/appointment';
import {
  createAppointment,
  listAppointments,
} from '@/services/appointment.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/appointments
 * List appointments with pagination and filters
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  // Check if Appointment Scheduling feature is available (skip for super_admin)
  if (user.role !== 'super_admin') {
    const { requireFeature } = await import('@/middleware/feature-check');
    const featureCheck = await requireFeature(req, user, 'Appointment Scheduling');
    if (!featureCheck.allowed) {
      return featureCheck.error!;
    }
  }

  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      doctorId: searchParams.get('doctorId') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      date: searchParams.get('date') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    };

    const validationResult = appointmentQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const result = await listAppointments(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(result));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch appointments', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
 */
async function postHandler(req: AuthenticatedRequest, user: any) {
  // Check if Appointment Scheduling feature is available (skip for super_admin)
  if (user.role !== 'super_admin') {
    const { requireFeature } = await import('@/middleware/feature-check');
    const featureCheck = await requireFeature(req, user, 'Appointment Scheduling');
    if (!featureCheck.allowed) {
      return featureCheck.error!;
    }
  }

  try {
    const body = await req.json();

    const validationResult = createAppointmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const appointment = await createAppointment(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        id: appointment._id.toString(),
        patientId: appointment.patientId.toString(),
        doctorId: appointment.doctorId.toString(),
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        duration: appointment.duration,
        type: appointment.type,
        status: appointment.status,
        createdAt: appointment.createdAt,
      }),
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to create appointment',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

