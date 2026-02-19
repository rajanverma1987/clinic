import { z } from 'zod';

/**
 * Validation schemas for Insurance module
 */

export const ClaimStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  PARTIALLY_APPROVED: 'partially_approved',
  DENIED: 'denied',
  PAID: 'paid',
  REJECTED: 'rejected',
};

export const createInsuranceClaimSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  patientId: z.string().optional(),
  insuranceProvider: z.string().min(1, 'Insurance provider is required').max(200),
  policyNumber: z.string().min(1, 'Policy number is required').max(100),
  groupNumber: z.string().max(100).optional(),
  claimAmount: z.number().min(0).optional(),
  submittedAmount: z.number().min(0).optional(),
  approvedAmount: z.number().min(0).optional(),
  priorAuthorization: z
    .object({
      required: z.boolean().optional(),
      authorizationNumber: z.string().optional(),
      authorizedAmount: z.number().min(0).optional(),
      authorizedUntil: z.string().datetime().or(z.date()).optional(),
    })
    .optional(),
  notes: z.string().max(1000).optional(),
});

export const updateInsuranceClaimSchema = createInsuranceClaimSchema.partial().extend({
  invoiceId: z.string().optional(), // Invoice shouldn't be changed
  status: z
    .enum([
      ClaimStatus.DRAFT,
      ClaimStatus.SUBMITTED,
      ClaimStatus.UNDER_REVIEW,
      ClaimStatus.APPROVED,
      ClaimStatus.PARTIALLY_APPROVED,
      ClaimStatus.DENIED,
      ClaimStatus.PAID,
      ClaimStatus.REJECTED,
    ])
    .optional(),
  approvedAmount: z.number().min(0).optional(),
  deniedAmount: z.number().min(0).optional(),
  denialReason: z.string().optional(),
  eob: z
    .object({
      receivedAt: z.string().datetime().or(z.date()).optional(),
      eobNumber: z.string().optional(),
      eobUrl: z.string().url().optional(),
    })
    .optional(),
});

export const insuranceClaimQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  invoiceId: z.string().optional(),
  status: z
    .enum([
      ClaimStatus.DRAFT,
      ClaimStatus.SUBMITTED,
      ClaimStatus.UNDER_REVIEW,
      ClaimStatus.APPROVED,
      ClaimStatus.PARTIALLY_APPROVED,
      ClaimStatus.DENIED,
      ClaimStatus.PAID,
      ClaimStatus.REJECTED,
    ])
    .optional(),
  insuranceProvider: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const verifyInsuranceSchema = z.object({
  policyNumber: z.string().min(1, 'Policy number is required'),
  groupNumber: z.string().optional(),
});

export const updateClaimStatusSchema = z.object({
  status: z.enum([
    ClaimStatus.SUBMITTED,
    ClaimStatus.UNDER_REVIEW,
    ClaimStatus.APPROVED,
    ClaimStatus.PARTIALLY_APPROVED,
    ClaimStatus.DENIED,
    ClaimStatus.PAID,
    ClaimStatus.REJECTED,
  ]),
  approvedAmount: z.number().min(0).optional(),
  deniedAmount: z.number().min(0).optional(),
  denialReason: z.string().optional(),
  eob: z
    .object({
      receivedAt: z.string().datetime().or(z.date()).optional(),
      eobNumber: z.string().optional(),
      eobUrl: z.string().url().optional(),
    })
    .optional(),
});
