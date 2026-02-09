/**
 * GDPR Data Export API Route
 * Right to Data Portability
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { exportPatientDataSchema } from '@/lib/validations/gdpr';
import { exportPatientData } from '@/services/gdpr.service';
import { exportToCSV, exportToPDFHTML } from '@/lib/gdpr/export-formats';

/**
 * POST /api/gdpr/export
 * Export patient data (GDPR Right to Data Portability)
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = exportPatientDataSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const exportData = await exportPatientData(
    validationResult.data.patientId,
    user.tenantId,
    user.userId
  );

  // Format response based on requested format
  const format = validationResult.data.format || 'json';

  if (format === 'json') {
    return NextResponse.json(successResponse(exportData));
  }

  if (format === 'csv') {
    const csv = exportToCSV(exportData);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="patient-data-${validationResult.data.patientId}-${Date.now()}.csv"`,
      },
    });
  }

  if (format === 'pdf') {
    const html = exportToPDFHTML(exportData);
    // Return HTML that can be converted to PDF client-side or server-side
    // For full PDF generation, use jspdf or puppeteer
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="patient-data-${validationResult.data.patientId}-${Date.now()}.html"`,
      },
    });
  }

  // Default to JSON
  return NextResponse.json(successResponse(exportData));
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.READ)(postHandler)
    )
  )
);
