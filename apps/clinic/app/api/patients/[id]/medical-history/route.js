/**
 * Patient Medical History API Routes
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import {
  addMedicalHistoryConditionSchema,
  updateMedicalHistoryConditionSchema,
} from '@/lib/validations/medical-history';
import {
  getMedicalHistory,
  getMedicalHistoryTimeline,
  addMedicalHistoryCondition,
  updateMedicalHistoryCondition,
  removeMedicalHistoryCondition,
} from '@/services/medical-history.service';

/**
 * GET /api/patients/[id]/medical-history
 * Get medical history for a patient
 */
async function getHandler(req, user, { params }) {
  const patientId = params.id;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'list'; // 'list' or 'timeline'

  if (type === 'timeline') {
    const timeline = await getMedicalHistoryTimeline(patientId, user.tenantId, user.userId);
    return NextResponse.json(successResponse(timeline));
  } else {
    const history = await getMedicalHistory(patientId, user.tenantId, user.userId);
    return NextResponse.json(successResponse(history));
  }
}

/**
 * POST /api/patients/[id]/medical-history
 * Add a medical history condition
 */
async function postHandler(req, user, { params }) {
  const patientId = params.id;
  const body = await req.json();

  const validationResult = addMedicalHistoryConditionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const condition = await addMedicalHistoryCondition(
    patientId,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  return NextResponse.json(successResponse(condition), { status: 201 });
}

/**
 * PUT /api/patients/[id]/medical-history?index=0
 * Update a medical history condition
 */
async function putHandler(req, user, { params }) {
  const patientId = params.id;
  const { searchParams } = new URL(req.url);
  const conditionIndex = parseInt(searchParams.get('index') || '0', 10);
  const body = await req.json();

  if (isNaN(conditionIndex) || conditionIndex < 0) {
    return NextResponse.json(
      errorResponse('Invalid condition index', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const validationResult = updateMedicalHistoryConditionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      validationErrorResponse(validationResult.error.errors),
      { status: 400 }
    );
  }

  const condition = await updateMedicalHistoryCondition(
    patientId,
    conditionIndex,
    validationResult.data,
    user.tenantId,
    user.userId
  );

  return NextResponse.json(successResponse(condition));
}

/**
 * DELETE /api/patients/[id]/medical-history?index=0
 * Remove a medical history condition
 */
async function deleteHandler(req, user, { params }) {
  const patientId = params.id;
  const { searchParams } = new URL(req.url);
  const conditionIndex = parseInt(searchParams.get('index') || '0', 10);

  if (isNaN(conditionIndex) || conditionIndex < 0) {
    return NextResponse.json(
      errorResponse('Invalid condition index', 'VALIDATION_ERROR'),
      { status: 400 }
    );
  }

  const condition = await removeMedicalHistoryCondition(
    patientId,
    conditionIndex,
    user.tenantId,
    user.userId
  );

  return NextResponse.json(successResponse({ message: 'Condition removed successfully', condition }));
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

export const PUT = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return putHandler(req, user, { params });
      })
    )
  )
);

export const DELETE = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.UPDATE)(async (req, user, context) => {
        const params = await context.params;
        return deleteHandler(req, user, { params });
      })
    )
  )
);
