/**
 * Patient Vital Signs API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { recordVitalSignsSchema, vitalSignsHistoryQuerySchema } from '@/lib/validations/vital-signs';
import {
  recordVitalSigns,
  getVitalSignsHistory,
  getVitalSignsTrends,
  getLatestVitalSigns,
} from '@/services/vital-signs.service';

/**
 * GET /api/patients/[id]/vital-signs
 * Get vital signs history or trends
 */
async function getHandler(req, user, { params }) {
  const patientId = params.id;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'history'; // 'history' or 'trends'

  const queryParams = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : undefined,
  };

  if (type === 'trends') {
    const validationResult = vitalSignsHistoryQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const trends = await getVitalSignsTrends(
      patientId,
      validationResult.data,
      user.tenantId,
      user.userId
    );

    return NextResponse.json(successResponse(trends));
  } else if (type === 'latest') {
    const latest = await getLatestVitalSigns(patientId, user.tenantId, user.userId);
    return NextResponse.json(successResponse(latest));
  } else {
    const validationResult = vitalSignsHistoryQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const history = await getVitalSignsHistory(
      patientId,
      validationResult.data,
      user.tenantId,
      user.userId
    );

    return NextResponse.json(successResponse(history));
  }
}

/**
 * POST /api/patients/[id]/vital-signs
 * Record vital signs for a patient
 */
async function postHandler(req, user, { params }) {
  const patientId = params.id;
  const body = await req.json();

  const validationResult = recordVitalSignsSchema.safeParse({
    ...body,
    patientId,
  });

  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const result = await recordVitalSigns(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(
    successResponse({
      id: result.note._id.toString(),
      vitalSigns: result.vitalSigns,
      createdAt: result.note.createdAt,
    }),
    { status: 201 }
  );
}

// Apply middleware stack
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.READ)(async (req, user, context) => {
        const params = await context.params;
        return getHandler(req, user, { params });
      })
    )
  )
);

export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return postHandler(req, user, { params });
      })
    )
  )
);
