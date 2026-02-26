/**
 * Task Model
 * Staff task assignment: assignee, due date, status, optional link to entity.
 * Per FIX_PLAN: Operations layer – staff task management. All queries filter by tenantId.
 */

import mongoose, { Schema } from 'mongoose';

export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

const TaskSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String, trim: true },
    dueDate: { type: Date, index: true },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      index: true,
    },
    /** Optional link to appointment, patient, etc. */
    relatedEntityType: { type: String, trim: true, index: true },
    relatedEntityId: { type: Schema.Types.ObjectId, index: true },
    completedAt: { type: Date },
    completedById: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'tasks',
  },
);

TaskSchema.index({ tenantId: 1, assigneeId: 1, status: 1 });
TaskSchema.index({ tenantId: 1, dueDate: 1 });

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
