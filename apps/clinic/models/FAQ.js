/**
 * FAQ Model - Platform-wide FAQs (Super Admin content).
 * No tenantId; categories: patients, doctors, general.
 */
import mongoose, { Schema } from 'mongoose';

const FAQSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, index: true },
    answer: { type: String, required: true, trim: true },
    category: { type: String, enum: ['patients', 'doctors', 'general'], default: 'general', index: true },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.FAQ || mongoose.model('FAQ', FAQSchema);
