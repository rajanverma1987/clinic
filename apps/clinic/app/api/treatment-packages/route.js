/**
 * Treatment packages API – list and create
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import {
  createTreatmentPackageSchema,
  treatmentPackageQuerySchema,
} from '@/lib/validations/procedure';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import {
  createTreatmentPackage,
  listTreatmentPackages,
} from '@/services/treatment-package.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);
  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    isActive: searchParams.get('isActive') || undefined,
    search: searchParams.get('search') || undefined,
  };

  const validationResult = treatmentPackageQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const result = await listTreatmentPackages(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(successResponse(result));
}

async function postHandler(req, user) {
  const body = await req.json();

  const validationResult = createTreatmentPackageSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const pkg = await createTreatmentPackage(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: pkg._id.toString(),
      name: pkg.name,
      isActive: pkg.isActive,
      createdAt: pkg.createdAt,
    }),
    { status: 201 },
  );
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.READ)(getHandler))),
);

export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.CREATE)(postHandler))),
);
