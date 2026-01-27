/**
 * Appointment Report API Route
 * Based on NEW-PLANS.md requirements
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { appointmentReportSchema } from '@/lib/validations/report';
import { getAppointmentReport } from '@/services/report.service';
import { reportToCSV } from '@/lib/utils/csv-export';

/**
 * GET /api/reports/appointments
 * Get appointment analytics report
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    groupBy: searchParams.get('groupBy') || undefined,
    format: searchParams.get('format') || 'json',
    doctorId: searchParams.get('doctorId') || undefined,
    patientId: searchParams.get('patientId') || undefined,
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
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler)
    )
  )
);
