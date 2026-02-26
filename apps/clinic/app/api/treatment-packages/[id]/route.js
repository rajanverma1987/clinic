/**
 * Treatment package detail API – get, update, delete
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateTreatmentPackageSchema } from '@/lib/validations/procedure';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import {
  deleteTreatmentPackage,
  getTreatmentPackageById,
  updateTreatmentPackage,
} from '@/services/treatment-package.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user, { params }) {
  const packageId = params.id;
  const pkg = await getTreatmentPackageById(packageId, user.tenantId, user.userId);

  if (!pkg) {
    return NextResponse.json(errorResponse('Treatment package not found', 'NOT_FOUND'), {
      status: 404,
    });
  }

  return NextResponse.json(successResponse(pkg));
}

async function putHandler(req, user, { params }) {
  const packageId = params.id;
  const body = await req.json();

  const validationResult = updateTreatmentPackageSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  const pkg = await updateTreatmentPackage(
    packageId,
    validationResult.data,
    user.tenantId,
    user.userId,
  );

  if (!pkg) {
    return NextResponse.json(errorResponse('Treatment package not found', 'NOT_FOUND'), {
      status: 404,
    });
  }

  return NextResponse.json(successResponse(pkg));
}

async function deleteHandler(req, user, { params }) {
  const packageId = params.id;
  const pkg = await deleteTreatmentPackage(packageId, user.tenantId, user.userId);

  if (!pkg) {
    return NextResponse.json(errorResponse('Treatment package not found', 'NOT_FOUND'), {
      status: 404,
    });
  }

  return NextResponse.json(successResponse({ id: packageId, deleted: true }));
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.READ)(getHandler))),
);

export const PUT = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.UPDATE)(putHandler))),
);

export const DELETE = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.PROCEDURE, ACTIONS.DELETE)(deleteHandler))),
);
