import mongoose, { Schema } from 'mongoose';

const NoteTemplateSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    specialty: {
      type: String,
      trim: true,
      index: true,
    },
    
    // Template Details
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      default: 'soap',
    },
    
    // Template Structure
    fields: [
      {
        name: String,
        label: String,
        type: {
          type: String,
          enum: ['text', 'textarea', 'number', 'select', 'checkbox', 'date'],
        },
        required: Boolean,
        options: [String],
        placeholder: String,
        defaultValue: String,
      },
    ],
    
    // SOAP Template Structure
    soapTemplate: {
      subjective: {
        fields: [
          {
            name: String,
            label: String,
            type: String,
            required: Boolean,
            options: [String],
            placeholder: String,
            defaultValue: String,
          },
        ],
        defaultText: String,
      },
      objective: {
        fields: [
          {
            name: String,
            label: String,
            type: String,
            required: Boolean,
            options: [String],
            placeholder: String,
            defaultValue: String,
          },
        ],
        defaultText: String,
      },
      assessment: {
        fields: [
          {
            name: String,
            label: String,
            type: String,
            required: Boolean,
            options: [String],
            placeholder: String,
            defaultValue: String,
          },
        ],
        defaultText: String,
      },
      plan: {
        fields: [
          {
            name: String,
            label: String,
            type: String,
            required: Boolean,
            options: [String],
            placeholder: String,
            defaultValue: String,
          },
        ],
        defaultText: String,
      },
    },
    
    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NoteTemplateSchema.index({ tenantId: 1, doctorId: 1 });
NoteTemplateSchema.index({ tenantId: 1, specialty: 1, isDefault: 1 });
NoteTemplateSchema.index({ tenantId: 1, type: 1 });

export default mongoose.models.NoteTemplate || mongoose.model('NoteTemplate', NoteTemplateSchema);

