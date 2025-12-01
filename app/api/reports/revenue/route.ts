import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { revenueReportSchema } from '@/lib/validations/report';
import { getRevenueReport } from '@/services/report.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';
import { reportToCSV } from '@/lib/utils/csv-export';

/**
 * GET /api/reports/revenue
 * Get revenue analytics report
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      doctorId: searchParams.get('doctorId') || undefined,
      groupBy: searchParams.get('groupBy') || undefined,
      format: searchParams.get('format') || 'json',
      includeBreakdown: searchParams.get('includeBreakdown') === 'true',
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const validationResult = revenueReportSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        errorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          validationResult.error.errors
        ),
        { status: 400 }
      );
    }

    const reportData = await getRevenueReport(validationResult.data, user.tenantId, user.userId);

    // Handle CSV export
    if (validationResult.data.format === 'csv') {
      const csv = reportToCSV(reportData, 'Revenue Report');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="revenue-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(successResponse(reportData));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to generate revenue report', 'INTERNAL_ERROR'),
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

