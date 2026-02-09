import { z } from 'zod';

/**
 * Validation schemas for Lab module
 */

// Lab Test Schemas
const parameterSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  unit: z.string().optional(),
  referenceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    text: z.string().optional(),
  }).optional(),
  criticalValues: z.object({
    low: z.number().optional(),
    high: z.number().optional(),
  }).optional(),
});

const pricingSchema = z.object({
  price: z.number().min(0),
  insurancePrice: z.number().min(0).optional(),
});

export const createLabTestSchema = z.object({
  testCode: z.string().min(1, 'Test code is required').max(20).regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'),
  name: z.string().min(1, 'Test name is required').max(200),
  category: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  sampleType: z.enum(['blood', 'urine', 'stool', 'tissue', 'other']),
  parameters: z.array(parameterSchema).optional(),
  pricing: pricingSchema.optional(),
  tatHours: z.number().int().min(1).max(168).optional(), // 1 hour to 1 week
  preparationRequired: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const updateLabTestSchema = createLabTestSchema.partial().extend({
  testCode: z.string().min(1).max(20).regex(/^[A-Z0-9]+$/).optional(),
});

export const labTestQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  category: z.string().optional(),
  department: z.string().optional(),
  sampleType: z.enum(['blood', 'urine', 'stool', 'tissue', 'other']).optional(),
  search: z.string().optional(),
});

// Lab Order Schemas
const testOrderSchema = z.object({
  testId: z.string().min(1, 'Test ID is required'),
  priority: z.enum(['routine', 'urgent', 'stat']).optional(),
});

const sampleSchema = z.object({
  type: z.enum(['blood', 'urine', 'stool', 'tissue', 'other']).optional(),
  collectedAt: z.string().datetime().or(z.date()).optional(),
  collectedBy: z.string().optional(),
  barcode: z.string().optional(),
});

export const createLabOrderSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  consultationId: z.string().optional(),
  tests: z.array(testOrderSchema).min(1, 'At least one test is required'),
  sample: sampleSchema.optional(),
});

export const updateLabOrderSchema = createLabOrderSchema.partial().extend({
  patientId: z.string().optional(), // Patient shouldn't be changed
  status: z.enum(['ordered', 'collected', 'processing', 'completed', 'cancelled']).optional(),
});

export const labOrderQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  status: z.enum(['ordered', 'collected', 'processing', 'completed', 'cancelled']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Lab Result Schemas
const resultParameterSchema = z.object({
  parameter: z.string().min(1, 'Parameter name is required'),
  value: z.string().min(1, 'Value is required'),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  notes: z.string().optional(),
});

export const createLabResultSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  testId: z.string().min(1, 'Test ID is required'),
  results: z.array(resultParameterSchema).min(1, 'At least one result is required'),
  interpretation: z.string().optional(),
  remarks: z.string().optional(),
});

export const updateLabResultSchema = createLabResultSchema.partial().extend({
  orderId: z.string().optional(), // Order ID shouldn't be changed
  patientId: z.string().optional(), // Patient ID shouldn't be changed
  testId: z.string().optional(), // Test ID shouldn't be changed
  status: z.enum(['draft', 'verified', 'delivered']).optional(),
});

export const labResultQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  orderId: z.string().optional(),
  testId: z.string().optional(),
  status: z.enum(['draft', 'verified', 'delivered']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
