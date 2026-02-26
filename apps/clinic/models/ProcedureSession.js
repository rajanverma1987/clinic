/**
 * ProcedureSession Model
 * Tracks procedure sessions (e.g. a procedure performed for a patient at a given time).
 * Per FIX_PLAN: Procedure layer – session tracking, procedure logs.
 * All queries must filter by tenantId.
 */

import mongoose, { Schema } from 'mongoose';

export const ProcedureSessionStatus = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const procedureLogSchema = new Schema(
  {
    at: { type: Date, default: Date.now },
    text: { type: String, required: true, trim: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { _id: true },
);

const ProcedureSessionSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    procedureNumber: {
      type: String,
      uppercase: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** Procedure type or code (e.g. name, CPT-style code) */
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    typeCode: {
      type: String,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ProcedureSessionStatus),
      default: ProcedureSessionStatus.SCHEDULED,
      index: true,
    },
    startedAt: { type: Date, index: true },
    endedAt: { type: Date, index: true },
    notes: { type: String, trim: true },
    /** Procedure logs (timeline entries) */
    logs: [procedureLogSchema],
    /** Optional link to treatment package if session is part of a package */
    treatmentPackageId: {
      type: Schema.Types.ObjectId,
      ref: 'TreatmentPackage',
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'procedure_sessions',
  },
);

ProcedureSessionSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
ProcedureSessionSchema.index({ tenantId: 1, status: 1, startedAt: -1 });

export default mongoose.models.ProcedureSession ||
  mongoose.model('ProcedureSession', ProcedureSessionSchema);
