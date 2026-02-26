/**
 * Tasks API – list and create
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { createTaskSchema, taskQuerySchema } from '@/lib/validations/task';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { createTask, listTasks } from '@/services/task.service';
import { NextResponse } from 'next/server';

async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);
  const queryParams = {
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    assigneeId: searchParams.get('assigneeId') || undefined,
    createdById: searchParams.get('createdById') || undefined,
    status: searchParams.get('status') || undefined,
    priority: searchParams.get('priority') || undefined,
    dueFrom: searchParams.get('dueFrom') || undefined,
    dueTo: searchParams.get('dueTo') || undefined,
  };
  const validationResult = taskQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const result = await listTasks(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(successResponse(result));
}

async function postHandler(req, user) {
  const body = await req.json();
  const validationResult = createTaskSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }
  const task = await createTask(validationResult.data, user.tenantId, user.userId);
  return NextResponse.json(
    successResponse({
      id: task._id.toString(),
      title: task.title,
      status: task.status,
      createdAt: task.createdAt,
    }),
    { status: 201 },
  );
}

export const GET = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.TASK, ACTIONS.READ)(getHandler))),
);
export const POST = withErrorHandler(
  apiRateLimit(withAuth(requirePermission(RESOURCES.TASK, ACTIONS.CREATE)(postHandler))),
);
