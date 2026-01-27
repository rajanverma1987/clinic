import mongoose, { Schema } from 'mongoose';

const ReviewSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    reviewText: {
      type: String,
      maxlength: 2000,
    },
    doctorResponse: {
      text: {
        type: String,
        maxlength: 1000,
      },
      respondedAt: {
        type: Date,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flaggedReason: {
      type: String,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReviewSchema.index({ doctorId: 1, createdAt: -1 });
ReviewSchema.index({ patientId: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ isVerified: 1 });
ReviewSchema.index({ deletedAt: 1 });

// Virtual for average rating calculation
ReviewSchema.statics.getAverageRating = async function (doctorId, tenantId) {
  const result = await this.aggregate([
    {
      $match: {
        doctorId: mongoose.Types.ObjectId(doctorId),
        tenantId: mongoose.Types.ObjectId(tenantId),
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (result.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10,
    totalReviews: result[0].totalReviews,
  };
};

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default Review;
