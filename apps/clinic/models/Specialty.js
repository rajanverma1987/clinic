/**
 * Specialty Model - Platform-wide medical specialties (e.g. Cardiologist, Dentist)
 * Used by Doctor profiles and admin content management. No tenantId for platform-level list.
 */
import mongoose, { Schema } from 'mongoose';

const SpecialtySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Specialty || mongoose.model('Specialty', SpecialtySchema);
