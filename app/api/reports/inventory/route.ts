import { NextRequest, NextResponse } from 'next/server';
import { authenticate, AuthenticatedRequest } from '@/middleware/auth';
import { inventoryReportSchema } from '@/lib/validations/report';
import { getInventoryReport } from '@/services/report.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';
import { reportToCSV } from '@/lib/utils/csv-export';

/**
 * GET /api/reports/inventory
 * Get inventory analytics report
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      groupBy: searchParams.get('groupBy') || undefined,
      format: searchParams.get('format') || 'json',
      itemType: searchParams.get('itemType') || undefined,
      includeLowStock: searchParams.get('includeLowStock') === 'true',
      includeExpired: searchParams.get('includeExpired') === 'true',
      includePredictions: searchParams.get('includePredictions') === 'true',
    };

    const validationResult = inventoryReportSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const reportData = await getInventoryReport(validationResult.data, user.tenantId, user.userId);

    // Handle CSV export
    if (validationResult.data.format === 'csv') {
      const csv = reportToCSV(reportData, 'Inventory Report');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="inventory-report-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(successResponse(reportData));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to generate inventory report', 'INTERNAL_ERROR'),
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

