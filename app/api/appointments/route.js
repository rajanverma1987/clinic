import { sendVideoConsultationEmail } from '@/lib/email/email-service';
import {
  errorResponse,
  handleMongoError,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { appointmentQuerySchema, createAppointmentSchema } from '@/lib/validations/appointment';
import { withAuth } from '@/middleware/auth';
import Patient from '@/models/Patient';
import { SessionType } from '@/models/TelemedicineSession';
import User from '@/models/User';
import { createAppointment, listAppointments } from '@/services/appointment.service';
import { createTelemedicineSession } from '@/services/telemedicine.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/appointments
 * List appointments with pagination and filters
 */
async function getHandler(req, user) {
  // Check if Appointment Scheduling feature is available (skip for super_admin)
  if (user.role !== 'super_admin') {
    const { requireFeature } = await import('@/middleware/feature-check');
    const featureCheck = await requireFeature(req, user, 'Appointment Scheduling');
    if (!featureCheck.allowed) {
      return featureCheck.error;
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
      return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
        status: 400,
      });
    }

    const result = await listAppointments(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(result));
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(errorResponse('Failed to fetch appointments', 'INTERNAL_ERROR'), {
      status: 500,
    });
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
 */
async function postHandler(req, user) {
  // Check if Appointment Scheduling feature is available (skip for super_admin)
  if (user.role !== 'super_admin') {
    const { requireFeature } = await import('@/middleware/feature-check');
    const featureCheck = await requireFeature(req, user, 'Appointment Scheduling');
    if (!featureCheck.allowed) {
      return featureCheck.error;
    }
  }

  try {
    const body = await req.json();

    const validationResult = createAppointmentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
        status: 400,
      });
    }

    const appointment = await createAppointment(validationResult.data, user.tenantId, user.userId);

    // For recurring appointments, fetch all created appointments
    let allAppointments = [appointment];
    if (body.isRecurring) {
      try {
        const appointmentsResponse = await apiClient.get(
          `/appointments?patientId=${body.patientId}&doctorId=${body.doctorId}&startDate=${body.appointmentDate}&limit=100`
        );
        if (appointmentsResponse.success && appointmentsResponse.data) {
          const appointmentsData =
            appointmentsResponse.data?.data || appointmentsResponse.data || [];
          // Get the most recent appointments (should include the recurring ones)
          allAppointments = appointmentsData
            .filter((apt) => {
              const aptDate = new Date(apt.appointmentDate || apt.startTime);
              const startDate = new Date(body.appointmentDate);
              return aptDate >= startDate;
            })
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .slice(0, body.recurringOccurrences || 4);
        }
      } catch (err) {
        console.error('Failed to fetch recurring appointments:', err);
      }
    }

    // If telemedicine appointment, create session and send email
    let telemedicineSession = null;
    if (body.isTelemedicine) {
      try {
        // Create telemedicine session
        telemedicineSession = await createTelemedicineSession(user.tenantId, user.userId, {
          patientId: appointment.patientId.toString(),
          doctorId: appointment.doctorId.toString(),
          sessionType: SessionType.VIDEO,
          scheduledStartTime: appointment.startTime,
          scheduledEndTime: appointment.endTime,
          appointmentId: appointment._id.toString(),
          chatEnabled: true,
          recordingConsent: body.telemedicineConsent || false,
        });

        // Update appointment with telemedicine session ID
        appointment.telemedicineSessionId = telemedicineSession._id;
        await appointment.save();

        // Get patient and doctor details for email
        const patient = await Patient.findById(appointment.patientId);
        const doctor = await User.findById(appointment.doctorId);

        if (patient && doctor && body.patientEmail) {
          const patientName = `${patient.firstName} ${patient.lastName}`;
          const doctorName = `${doctor.firstName} ${doctor.lastName}`;
          // Get base URL without any path (remove /dashboard or other paths)
          let baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXT_PUBLIC_BASE_URL ||
            'http://localhost:3000';
          // Remove any path after the domain (e.g., /dashboard)
          try {
            const url = new URL(baseUrl);
            baseUrl = `${url.protocol}//${url.host}`;
          } catch (e) {
            // If URL parsing fails, try to extract just the origin
            const match = baseUrl.match(/^(https?:\/\/[^\/]+)/);
            if (match) {
              baseUrl = match[1];
            }
          }
          const sessionLink = `${baseUrl}/telemedicine/${telemedicineSession._id}`;

          // Send email notification
          await sendVideoConsultationEmail(
            body.patientEmail,
            patientName,
            doctorName,
            sessionLink,
            appointment.startTime,
            telemedicineSession.sessionId,
            user.tenantId
          );

          console.log(`📧 Video consultation email sent to: ${body.patientEmail}`);
        }
      } catch (emailError) {
        console.error('Failed to create session or send email:', emailError);
        // Don't fail appointment creation if email fails
      }
    } else {
      // Send appointment confirmation email for regular appointments
      try {
        const { sendAppointmentConfirmationEmail } = await import('@/lib/email/email-service.js');
        const patient = await Patient.findById(appointment.patientId);

        if (patient?.email) {
          const doctor = await User.findById(appointment.doctorId);
          if (doctor) {
            const patientName = `${patient.firstName} ${patient.lastName}`;
            const doctorName = `${doctor.firstName} ${doctor.lastName}`;

            await sendAppointmentConfirmationEmail(
              patient.email,
              patientName,
              doctorName,
              appointment.appointmentDate,
              appointment.startTime,
              appointment.type || 'consultation',
              user.tenantId
            );

            console.log(`📧 Appointment confirmation email sent to: ${patient.email}`);
          }
        }
      } catch (emailError) {
        // Don't fail appointment creation if email fails
        console.error('Failed to send appointment confirmation email:', emailError);
      }
    }

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
        isTelemedicine: appointment.isTelemedicine,
        telemedicineSessionId: telemedicineSession?._id?.toString(),
        createdAt: appointment.createdAt,
        isRecurring: body.isRecurring || false,
        recurringCount: body.isRecurring ? allAppointments.length : 1,
      }),
      { status: 201 }
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to create appointment',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
