/**
 * Imaging Study API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createImagingStudySchema, imagingStudyQuerySchema } from '@/lib/validations/imaging';
import { createImagingStudy, listImagingStudies } from '@/services/imaging.service';

/**
 * GET /api/imaging
 * List imaging studies with pagination and filters
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    patientId: searchParams.get('patientId') || undefined,
    doctorId: searchParams.get('doctorId') || undefined,
    studyType: searchParams.get('studyType') || undefined,
    status: searchParams.get('status') || undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
  };

  const validationResult = imagingStudyQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await listImagingStudies(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/imaging
 * Create a new imaging study
 */
async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createImagingStudySchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const imagingStudy = await createImagingStudy(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: imagingStudy._id.toString(),
      studyNumber: imagingStudy.studyNumber,
      status: imagingStudy.status,
      createdAt: imagingStudy.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.IMAGING_STUDY, ACTIONS.READ)(getHandler)
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.IMAGING_STUDY, ACTIONS.CREATE)(postHandler)
    )
  )
);
