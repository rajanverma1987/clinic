/**
 * Task detail API – get, update, delete
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { updateTaskSchema } from '@/lib/validations/task';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { deleteTask, getTaskById, updateTask } from '@/services/task.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user, { params }) {
  const task = await getTaskById(params.id, user.tenantId, user.userId);
  if (!task) {
    return NextResponse.json(errorResponse('Task not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse(task));
}

async function putHandler(req, user, { params }) {
  const body = await req.json();
  const validationResult = updateTaskSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const task = await updateTask(params.id, validationResult.data, user.tenantId, user.userId);
  if (!task) {
    return NextResponse.json(errorResponse('Task not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse(task));
}

async function deleteHandler(req, user, { params }) {
  const task = await deleteTask(params.id, user.tenantId, user.userId);
  if (!task) {
    return NextResponse.json(errorResponse('Task not found', 'NOT_FOUND'), { status: 404 });
  }
  return NextResponse.json(successResponse({ id: params.id, deleted: true }));
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.TASK, ACTIONS.READ)(getHandler))),
);
export const PUT = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.TASK, ACTIONS.UPDATE)(putHandler))),
);
export const DELETE = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.TASK, ACTIONS.DELETE)(deleteHandler))),
);
