import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getAppointmentReport } from '@/services/report.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';
import { reportToCSV } from '@/lib/utils/csv-export';

/**
 * GET /api/reports/appointments
 * Get appointment analytics report
 */
async function getHandler(req, user) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      groupBy: searchParams.get('groupBy') || 'day',
      format: searchParams.get('format') || 'json',
      doctorId: searchParams.get('doctorId') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
    };

    const reportData = await getAppointmentReport(queryParams, user.tenantId, user.userId);

    // Handle CSV export
    if (queryParams.format === 'csv') {
      const csv = reportToCSV(reportData, 'Appointment Report');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="appointment-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(successResponse(reportData));
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to generate appointment report', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const authResult = await authenticate(req);
  if ('error' in authResult) return authResult.error;

  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user);
}
