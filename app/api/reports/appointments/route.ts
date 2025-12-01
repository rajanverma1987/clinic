import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { appointmentReportSchema } from '@/lib/validations/report';
import { getAppointmentReport } from '@/services/report.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';
import { reportToCSV } from '@/lib/utils/csv-export';

/**
 * GET /api/reports/appointments
 * Get appointment analytics report
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      doctorId: searchParams.get('doctorId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      groupBy: searchParams.get('groupBy') || undefined,
      format: searchParams.get('format') || 'json',
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      includeNoShows: searchParams.get('includeNoShows') === 'true',
    };

    const validationResult = appointmentReportSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const reportData = await getAppointmentReport(validationResult.data, user.tenantId, user.userId);

    // Handle CSV export
    if (validationResult.data.format === 'csv') {
      const csv = reportToCSV(reportData, 'Appointment Report');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="appointment-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(successResponse(reportData));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to generate appointment report', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authResult = await authenticate(req);
  if ('error' in authResult) return authResult.error;

  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user);
}

