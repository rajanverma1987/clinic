/**
 * ConsentRecord Model
 * Records patient consent for a form (captured at appointment or patient view).
 * Per FIX_PLAN: Consent tracking. All queries filter by tenantId.
 */

import mongoose, { Schema } from 'mongoose';

const ConsentRecordSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    formId: {
      type: Schema.Types.ObjectId,
      ref: 'ConsentForm',
      required: true,
      index: true,
    },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', index: true },
    consentedAt: { type: Date, required: true, default: Date.now, index: true },
    /** Form version at time of consent */
    formVersion: { type: Number, default: 1 },
    /** User who recorded consent (e.g. staff) */
    recordedById: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'consent_records',
  },
);

ConsentRecordSchema.index({ tenantId: 1, patientId: 1, formId: 1 });
ConsentRecordSchema.index({ tenantId: 1, patientId: 1, consentedAt: -1 });

export default mongoose.models.ConsentRecord ||
  mongoose.model('ConsentRecord', ConsentRecordSchema);
