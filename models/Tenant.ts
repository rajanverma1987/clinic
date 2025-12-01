import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
  name: string;
  slug: string; // URL-friendly identifier
  region: string; // 'US', 'EU', 'APAC', 'IN', 'ME'
  settings: {
    currency: string; // ISO currency code (USD, EUR, INR, etc.)
    locale: string; // ISO locale (en-US, en-GB, etc.)
    timezone: string; // IANA timezone (America/New_York, etc.)
    taxRules?: {
      country: string;
      taxType: 'GST' | 'VAT' | 'SALES_TAX';
      rate?: number;
    };
    dataRetentionYears?: number; // Region-specific retention
    complianceSettings?: {
      hipaa?: boolean;
      gdpr?: boolean;
      pipeda?: boolean;
      privacyAct?: boolean;
    };
    queueSettings?: {
      displayOrder: 'priority' | 'fifo' | 'appointment_time'; // How to order queue display
      averageConsultationTime?: number; // Average consultation time in minutes (default: 30)
      enablePublicDisplay?: boolean; // Allow public queue display (no PHI)
      showEstimatedWaitTime?: boolean; // Show estimated wait time to patients
      autoCallNext?: boolean; // Automatically call next patient when current completes
      maxQueueLength?: number; // Maximum queue length per doctor
    };
    clinicHours?: Array<{
      day: string;
      isOpen: boolean;
      timeSlots: Array<{
        startTime: string;
        endTime: string;
      }>;
    }>;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      enum: ['US', 'EU', 'APAC', 'IN', 'ME', 'CA', 'AU'],
    },
    settings: {
      currency: {
        type: String,
        required: true,
        default: 'USD',
      },
      locale: {
        type: String,
        required: true,
        default: 'en-US',
      },
      timezone: {
        type: String,
        required: true,
        default: 'UTC',
      },
      taxRules: {
        country: String,
        taxType: {
          type: String,
          enum: ['GST', 'VAT', 'SALES_TAX'],
        },
        rate: Number,
      },
      dataRetentionYears: Number,
      complianceSettings: {
        hipaa: Boolean,
        gdpr: Boolean,
        pipeda: Boolean,
        privacyAct: Boolean,
      },
      queueSettings: {
        displayOrder: {
          type: String,
          enum: ['priority', 'fifo', 'appointment_time'],
          default: 'priority',
        },
        averageConsultationTime: {
          type: Number,
          default: 30, // minutes
        },
        enablePublicDisplay: {
          type: Boolean,
          default: false,
        },
        showEstimatedWaitTime: {
          type: Boolean,
          default: true,
        },
        autoCallNext: {
          type: Boolean,
          default: false,
        },
        maxQueueLength: Number,
      },
      clinicHours: [
        {
          day: String,
          isOpen: {
            type: Boolean,
            default: true,
          },
          timeSlots: [
            {
              startTime: String,
              endTime: String,
            },
          ],
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TenantSchema.index({ slug: 1 });
TenantSchema.index({ region: 1 });

export default mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);

