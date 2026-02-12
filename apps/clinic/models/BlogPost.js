/**
 * BlogPost Model - Platform-wide blog/articles (Super Admin content).
 * No tenantId; used for marketing/health articles. Aligned with admin content management.
 */
import mongoose, { Schema } from 'mongoose';

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, trim: true },
    body: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);
