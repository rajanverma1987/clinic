/**
 * Appointment Report API Route
 * Based on NEW-PLANS.md requirements
 */

import { getCache, setCache } from '@/lib/cache/redis-client';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { reportToCSV } from '@/lib/utils/csv-export';
import { appointmentReportSchema } from '@/lib/validations/report';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { getAppointmentReport } from '@/services/report.service';
import { NextResponse } from 'next/server';

const REPORT_CACHE_TTL_SECONDS = 300; // 5 minutes

/**
 * GET /api/reports/appointments
 * Get appointment analytics report
 */
async function getHandler(req, user) {
  if (!user.tenantId) {
    return NextResponse.json(
      errorResponse('Tenant context required for reports', 'MISSING_TENANT'),
      { status: 400 }
    );
  }

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
    branchId: searchParams.get('branchId') || undefined,
  };

  const validationResult = appointmentReportSchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const { format, ...paramsForCache } = validationResult.data;
  const cacheKey =
    format !== 'csv'
      ? `reports:appointments:${user.tenantId}:${JSON.stringify(paramsForCache)}`
      : null;

  if (cacheKey) {
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(successResponse(cached));
    }
  }

  const reportData = await getAppointmentReport(validationResult.data, user.tenantId, user.userId);

  if (cacheKey) {
    await setCache(cacheKey, reportData, REPORT_CACHE_TTL_SECONDS);
  }

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
  apiRateLimit(withAuth(requirePermission(RESOURCES.REPORT, ACTIONS.READ)(getHandler)))
);
