import mongoose, { Schema, Document } from 'mongoose';

export interface ITemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date';
  required: boolean;
  options?: string[]; // For select type
  placeholder?: string;
  defaultValue?: string;
}

export interface INoteTemplate extends Document {
  tenantId: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId; // null = shared template
  specialty?: string; // e.g., "cardiology", "pediatrics"
  
  // Template Details
  name: string;
  description?: string;
  type: string; // 'soap', 'consultation', etc.
  
  // Template Structure
  fields: ITemplateField[];
  
  // SOAP Template Structure (if type is SOAP)
  soapTemplate?: {
    subjective?: {
      fields: ITemplateField[];
      defaultText?: string;
    };
    objective?: {
      fields: ITemplateField[];
      defaultText?: string;
    };
    assessment?: {
      fields: ITemplateField[];
      defaultText?: string;
    };
    plan?: {
      fields: ITemplateField[];
      defaultText?: string;
    };
  };
  
  // Metadata
  isActive: boolean;
  isDefault: boolean; // Default template for specialty
  usageCount: number; // Track how often it's used
  
  createdAt: Date;
  updatedAt: Date;
}

const NoteTemplateSchema = new Schema<INoteTemplate>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
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

export default mongoose.models.NoteTemplate || mongoose.model<INoteTemplate>('NoteTemplate', NoteTemplateSchema);

