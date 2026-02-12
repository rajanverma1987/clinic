/**
 * ContentPage Model - Platform-wide static pages (Super Admin content).
 * No tenantId; key = about|contact|terms|privacy; one doc per key or multiple blocks per key.
 * We allow multiple pages with a key so admin can manage About, Contact, Terms, Privacy as list items.
 */
import mongoose, { Schema } from 'mongoose';

const ContentPageSchema = new Schema(
  {
    key: { type: String, required: true, trim: true, index: true }, // about, contact, terms, privacy
    title: { type: String, required: true, trim: true, index: true },
    body: { type: String, default: '' },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.ContentPage || mongoose.model('ContentPage', ContentPageSchema);
