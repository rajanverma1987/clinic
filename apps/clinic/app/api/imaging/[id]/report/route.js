/**
 * Imaging Study Report API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { addImagingReportSchema } from '@/lib/validations/imaging';
import { addImagingReport } from '@/services/imaging.service';

/**
 * POST /api/imaging/[id]/report
 * Add report to imaging study
 */
async function postHandler(req, user, { params }) {
  const studyId = params.id;
  const body = await req.json();

  const validationResult = addImagingReportSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const imagingStudy = await addImagingReport(studyId, validationResult.data, user.tenantId, user.userId);

  if (!imagingStudy) {
    return NextResponse.json(
      errorResponse('Imaging study not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(imagingStudy));
}

// Apply middleware stack
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.IMAGING_STUDY, ACTIONS.UPDATE)(postHandler)
    )
  )
);
