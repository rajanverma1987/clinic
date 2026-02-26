/**
 * Task service – CRUD, assign, tenant-scoped. Per FIX_PLAN: Task system.
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import Task, { TaskStatus } from '@/models/Task.js';

export async function createTask(input, tenantId, userId) {
  await connectDB();

  const task = await Task.create({
    tenantId,
    assigneeId: input.assigneeId,
    createdById: userId,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    priority: input.priority || 'medium',
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
  });

  await AuditLogger.auditWrite('task', task._id.toString(), userId, tenantId, AuditAction.CREATE);
  return task;
}

export async function getTaskById(taskId, tenantId, userId) {
  await connectDB();

  const task = await Task.findOne(withTenant(tenantId, { _id: taskId, deletedAt: null }))
    .populate('assigneeId', 'firstName lastName')
    .populate('createdById', 'firstName lastName')
    .lean();

  if (task) await AuditLogger.auditRead('task', taskId, userId, tenantId);
  return task;
}

export async function listTasks(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
    maxLimit: 100,
  });
  const filter = { ...withTenant(tenantId, {}), deletedAt: null };
  if (query.assigneeId) filter.assigneeId = query.assigneeId;
  if (query.createdById) filter.createdById = query.createdById;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.dueFrom || query.dueTo) {
    filter.dueDate = {};
    if (query.dueFrom) filter.dueDate.$gte = new Date(query.dueFrom);
    if (query.dueTo) filter.dueDate.$lte = new Date(query.dueTo);
  }

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate('assigneeId', 'firstName lastName')
      .populate('createdById', 'firstName lastName')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  return createPaginationResult(items, total, page, limit);
}

export async function updateTask(taskId, input, tenantId, userId) {
  await connectDB();

  const task = await Task.findOne(withTenant(tenantId, { _id: taskId, deletedAt: null }));
  if (!task) return null;

  if (input.status === TaskStatus.COMPLETED && !task.completedAt) {
    task.completedAt = new Date();
    task.completedById = userId;
  }
  Object.assign(task, input);
  await task.save();

  await AuditLogger.auditWrite('task', taskId, userId, tenantId, AuditAction.UPDATE);
  return task;
}

export async function deleteTask(taskId, tenantId, userId) {
  await connectDB();

  const task = await Task.findOne(withTenant(tenantId, { _id: taskId, deletedAt: null }));
  if (!task) return null;

  task.deletedAt = new Date();
  await task.save();

  await AuditLogger.auditWrite('task', taskId, userId, tenantId, AuditAction.DELETE);
  return task;
}
