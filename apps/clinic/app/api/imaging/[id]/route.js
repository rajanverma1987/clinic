/**
 * Imaging Study Detail API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateImagingStudySchema, addImagingReportSchema } from '@/lib/validations/imaging';
import { getImagingStudyById, updateImagingStudy, addImagingReport } from '@/services/imaging.service';

/**
 * GET /api/imaging/[id]
 * Get imaging study by ID
 */
async function getHandler(req, user, { params }) {
  const studyId = params.id;

  const imagingStudy = await getImagingStudyById(studyId, user.tenantId, user.userId);

  if (!imagingStudy) {
    return NextResponse.json(
      errorResponse('Imaging study not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(imagingStudy));
}

/**
 * PUT /api/imaging/[id]
 * Update imaging study
 */
async function putHandler(req, user, { params }) {
  const studyId = params.id;
  const body = await req.json();

  const validationResult = updateImagingStudySchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const imagingStudy = await updateImagingStudy(studyId, validationResult.data, user.tenantId, user.userId);

  if (!imagingStudy) {
    return NextResponse.json(
      errorResponse('Imaging study not found', 'NOT_FOUND'),
      { status: 404 }
    );
  }

  return NextResponse.json(successResponse(imagingStudy));
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.IMAGING_STUDY, ACTIONS.READ)(getHandler)
    )
  )
);

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.IMAGING_STUDY, ACTIONS.UPDATE)(putHandler)
    )
  )
);
