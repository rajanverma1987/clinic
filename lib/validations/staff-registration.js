import { z } from 'zod';
import { UserRole } from '@/models/User.js';

/**
 * Validation schema for staff registration
 * Based on Registeration-Login.md requirements
 */
export const registerStaffSchema = z.object({
  role: z.enum([
    UserRole.CLINIC_ADMIN,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.RECEPTIONIST,
    UserRole.PHARMACIST,
    UserRole.LAB_TECH,
  ]),
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number').optional(),

  // Doctor-specific fields (optional, but required if role is doctor)
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  qualification: z.string().optional(),
  consultationFee: z.number().min(0).optional(),

  // Department assignment
  departmentIds: z.array(z.string()).optional(),

  // Account settings
  sendWelcomeEmail: z.boolean().default(true),
  requirePasswordChange: z.boolean().default(true),
}).refine((data) => {
  // If role is doctor, require doctor-specific fields
  if (data.role === UserRole.DOCTOR) {
    return data.specialization && data.licenseNumber && data.qualification && data.consultationFee !== undefined;
  }
  return true;
}, {
  message: 'Doctor role requires specialization, license number, qualification, and consultation fee',
  path: ['role'],
});
