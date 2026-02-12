/**
 * Banner Model - Platform-wide banners/sliders (Super Admin content).
 * No tenantId; for homepage sliders, promotional banners, schedule.
 */
import mongoose, { Schema } from 'mongoose';

const BannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    imageUrl: { type: String, required: true, trim: true },
    linkUrl: { type: String, trim: true },
    order: { type: Number, default: 0, index: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
