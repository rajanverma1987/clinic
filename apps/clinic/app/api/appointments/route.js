/**
 * Appointment API Routes
 *
 * Enterprise-grade API endpoints for appointment management with comprehensive
 * validation, telemedicine integration, and notification handling.
 *
 * @module app/api/appointments/route
 * @since 1.0.0
 */

import { sendVideoConsultationEmail } from '@/lib/email/email-service';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import {
  errorResponse,
  handleMongoError,
  successResponse,
  validationErrorResponse,
} from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger.js';
import { appointmentQuerySchema, createAppointmentSchema } from '@/lib/validations/appointment';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Patient from '@/models/Patient';
import { SessionType } from '@/models/TelemedicineSession';
import User from '@/models/User';
import { createAppointment, listAppointments } from '@/services/appointment.service';
import { createTelemedicineSession } from '@/services/telemedicine.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/appointments
 *
 * List appointments with pagination, filtering, and sorting.
 * Supports incremental updates via 'since' parameter for efficient polling.
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - patientId: Filter by patient ID
 * - doctorId: Filter by doctor ID
 * - status: Filter by status (scheduled, confirmed, completed, cancelled, no_show)
 * - type: Filter by type (consultation, follow_up, emergency, etc.)
 * - startDate: Filter appointments from this date (ISO format)
 * - endDate: Filter appointments until this date (ISO format)
 * - date: Filter by specific date (ISO format)
 * - isActive: Filter by active status (true/false)
 * - since: ISO datetime string - only fetch appointments updated since this timestamp (incremental updates)
 *
 * @async
 * @function getHandler
 * @param {Request} req - HTTP request object
 * @param {Object} user - Authenticated user object with tenantId and userId
 * @returns {Promise<NextResponse>} Paginated list of appointments with incremental update metadata
 *
 * @example
 * GET /api/appointments?status=scheduled&doctorId=123&page=1&limit=20
 * GET /api/appointments?since=2026-02-10T10:00:00Z (incremental update)
 *
 * @security
 * - Requires APPOINTMENT:READ permission
 * - Results filtered by tenantId (multi-tenant isolation)
 * - Feature access check for Appointment Scheduling
 *
 * @performance
 * - Uses optimized queries with aggregation pipeline
 * - Supports incremental updates to reduce data transfer
 * - Supports pagination to prevent large result sets
 * - Indexed queries for date, status, and updatedAt filters
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

    const locale =
      searchParams.get('locale') ||
      req.headers.get('accept-language')?.split(',')[0]?.trim()?.slice(0, 2) ||
      undefined;
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50', // Default to 50 for appointments
      patientId: searchParams.get('patientId') || undefined,
      doctorId: searchParams.get('doctorId') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      date: searchParams.get('date') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      since: searchParams.get('since') || undefined, // For incremental updates
      locale: locale || undefined, // es/ar for localized patient names
    };

    const validationResult = appointmentQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
        status: 400,
      });
    }

    const queryData = { ...validationResult.data };
    if (queryData.status === 'pending') {
      queryData.status = 'scheduled';
    }

    // Add incremental update filter if 'since' parameter is provided
    const isIncremental = !!queryData.since;
    if (queryData.since) {
      // Add updatedAt filter to only get appointments updated since the given timestamp
      queryData.updatedAt = { $gt: new Date(queryData.since) };
    }

    const result = await listAppointments(queryData, user.tenantId, user.userId);

    // Enhance response with incremental update metadata and normalize pagination format
    const totalPagesVal = result.pagination
      ? result.pagination.totalPages ||
        result.pagination.pages ||
        Math.ceil((result.pagination.total || 0) / (result.pagination.limit || 50))
      : 0;
    const enhancedResult = {
      data: result.data || [],
      pagination: result.pagination
        ? {
            total: result.pagination.total,
            page: result.pagination.page,
            limit: result.pagination.limit,
            pages: totalPagesVal,
            totalPages: totalPagesVal,
          }
        : {
            total: 0,
            page: parseInt(queryData.page) || 1,
            limit: parseInt(queryData.limit) || 50,
            pages: 0,
            totalPages: 0,
          },
      isIncremental,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse(enhancedResult));
  } catch (error) {
    logger.error('Fetch appointments error:', error);
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
 *
 * Create a new appointment with comprehensive validation, conflict detection,
 * telemedicine session creation, and notification sending.
 *
 * Request Body:
 * - patientId: Patient ID (required)
 * - doctorId: Doctor ID (required)
 * - appointmentDate: Appointment date (required, ISO format)
 * - startTime: Start time (required, ISO format)
 * - endTime: End time (required, ISO format)
 * - duration: Duration in minutes (optional, calculated if not provided)
 * - type: Appointment type (required)
 * - reason: Appointment reason (optional)
 * - isTelemedicine: Whether it's a telemedicine appointment (default: false)
 * - isRecurring: Whether it's a recurring appointment (default: false)
 * - recurringOccurrences: Number of recurring occurrences (if recurring)
 * - telemedicineConsent: Patient consent for recording (if telemedicine)
 * - patientEmail: Patient email for notifications (optional)
 *
 * @async
 * @function postHandler
 * @param {Request} req - HTTP request object with JSON body
 * @param {Object} user - Authenticated user object with tenantId and userId
 * @returns {Promise<NextResponse>} Created appointment object with 201 status
 *
 * @example
 * POST /api/appointments
 * {
 *   "patientId": "507f1f77bcf86cd799439011",
 *   "doctorId": "507f1f77bcf86cd799439012",
 *   "appointmentDate": "2026-01-27",
 *   "startTime": "2026-01-27T10:00:00Z",
 *   "endTime": "2026-01-27T10:30:00Z",
 *   "type": "consultation",
 *   "isTelemedicine": true,
 *   "patientEmail": "patient@example.com"
 * }
 *
 * @security
 * - Requires APPOINTMENT:CREATE permission
 * - Feature access check for Appointment Scheduling
 * - Conflict detection prevents double-booking
 * - Holiday and schedule validation
 *
 * @validation
 * - Input validated against createAppointmentSchema
 * - Date/time validation
 * - Conflict detection with existing appointments
 * - Holiday checking
 * - Doctor schedule validation
 *
 * @features
 * - Automatic telemedicine session creation
 * - Email notifications for telemedicine appointments
 * - Recurring appointment support
 * - Queue integration
 * - Reminder scheduling
 *
 * @audit
 * - Appointment creation logged
 * - PHI access logged for compliance
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

    // For recurring appointments, the service already creates all occurrences
    // We can fetch them if needed, but for now we'll just return the first one
    // The frontend can query for all appointments if needed
    let recurringCount = 1;
    if (body.isRecurring) {
      // The service creates multiple appointments for recurring, but returns the first one
      // We can estimate the count based on occurrences
      recurringCount = body.recurringOccurrences || 4;
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
            'http://localhost:5053';
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
            user.tenantId,
          );

          logger.info('Video consultation email sent', {
            email: body.patientEmail,
            appointmentId: appointment._id.toString(),
            sessionId: telemedicineSession._id.toString(),
          });
        }
      } catch (emailError) {
        logger.error('Failed to create session or send email', emailError, {
          appointmentId: appointment._id.toString(),
        });
        // Don't fail appointment creation if email fails
      }
    } else {
      // Send appointment confirmation notifications (email, SMS, in-app)
      try {
        const { sendAppointmentConfirmation } =
          await import('@/services/appointment-notification.service.js');
        await sendAppointmentConfirmation(appointment._id.toString(), user.tenantId);
        logger.info('Appointment confirmation notifications sent', {
          appointmentId: appointment._id.toString(),
        });
      } catch (notificationError) {
        // Don't fail appointment creation if notifications fail
        logger.error('Failed to send appointment confirmation notifications', notificationError, {
          appointmentId: appointment._id.toString(),
        });
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
        recurringCount: recurringCount,
      }),
      { status: 201 },
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to create appointment',
        'CREATE_ERROR',
      ),
      { status: 400 },
    );
  }
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates APPOINTMENT:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.APPOINTMENT, ACTIONS.READ)(getHandler))),
  ),
);

/**
 * Apply enterprise middleware stack to POST endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates APPOINTMENT:CREATE permission
 * 6. Handler - Executes business logic
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.APPOINTMENT, ACTIONS.CREATE)(postHandler))),
  ),
);
