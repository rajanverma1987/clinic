/**
 * Patient API Routes
 *
 * Enterprise-grade API endpoints for patient management with comprehensive
 * error handling, validation, auditing, and performance tracking.
 *
 * @module app/api/patients/route
 * @since 1.0.0
 *
 * Features:
 * - Multi-tenant isolation
 * - PHI access logging (HIPAA compliance)
 * - Input validation
 * - Rate limiting
 * - Permission-based access control
 * - Performance metrics
 * - Request correlation tracking
 */

import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { successResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { patientRegistrationSchema, patientSearchSchema } from '@/lib/validations/patient';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import { createPatient, searchPatients } from '@/services/patient.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/patients
 *
 * Search and list patients with pagination, filtering, and sorting.
 *
 * Query Parameters:
 * - search: Text search across patient fields
 * - status: Filter by patient status
 * - gender: Filter by gender
 * - bloodGroup: Filter by blood group
 * - hasInsurance: Filter by insurance status (true/false)
 * - portalEnabled: Filter by portal access (true/false)
 * - dateOfBirthFrom: Filter by minimum date of birth
 * - dateOfBirthTo: Filter by maximum date of birth
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sortBy: Field to sort by (default: createdAt)
 * - sortOrder: Sort order (asc/desc, default: desc)
 *
 * @async
 * @function getHandler
 * @param {Request} req - HTTP request object
 * @param {Object} user - Authenticated user object with tenantId and userId
 * @returns {Promise<NextResponse>} Paginated list of patients
 *
 * @example
 * GET /api/patients?search=John&status=active&page=1&limit=20
 *
 * @security
 * - Requires PATIENT:READ permission
 * - All PHI access is logged for HIPAA compliance
 * - Results are filtered by tenantId (multi-tenant isolation)
 *
 * @performance
 * - Uses optimized database queries with .lean()
 * - Supports pagination to prevent large result sets
 * - Text search uses indexed fields
 */
async function getHandler(req, user) {
  const { searchParams } = new URL(req.url);

  // When user is doctor, scope to their patients (patients with at least one appointment with this doctor)
  const doctorId =
    user.role === 'doctor'
      ? user._id?.toString() || user.userId
      : searchParams.get('doctorId') || undefined;

  // Build filters from query params
  const filters = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    gender: searchParams.get('gender') || undefined,
    bloodGroup: searchParams.get('bloodGroup') || undefined,
    hasInsurance:
      searchParams.get('hasInsurance') === 'true'
        ? true
        : searchParams.get('hasInsurance') === 'false'
          ? false
          : undefined,
    portalEnabled:
      searchParams.get('portalEnabled') === 'true'
        ? true
        : searchParams.get('portalEnabled') === 'false'
          ? false
          : undefined,
    dateOfBirthFrom: searchParams.get('dateOfBirthFrom') || undefined,
    dateOfBirthTo: searchParams.get('dateOfBirthTo') || undefined,
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 20,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    doctorId,
  };

  // Validate filters
  const validationResult = patientSearchSchema.safeParse(filters);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  // Get IP and user agent
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const result = await searchPatients(
    validationResult.data,
    user.tenantId,
    user.userId,
    ipAddress,
    userAgent
  );

  return NextResponse.json(successResponse(result));
}

/**
 * POST /api/patients
 *
 * Create a new patient record with automatic patient ID generation,
 * validation, and audit logging.
 *
 * Request Body:
 * - firstName: Patient first name (required)
 * - lastName: Patient last name (required)
 * - email: Email address (optional)
 * - phone: Phone number (required)
 * - dateOfBirth: Date of birth (required, ISO format)
 * - gender: Gender (required)
 * - address: Address object (optional)
 * - insurance: Insurance information (optional)
 * - ... (see patientRegistrationSchema for full schema)
 *
 * @async
 * @function postHandler
 * @param {Request} req - HTTP request object with JSON body
 * @param {Object} user - Authenticated user object with tenantId and userId
 * @returns {Promise<NextResponse>} Created patient object with 201 status
 *
 * @example
 * POST /api/patients
 * {
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "phone": "+1234567890",
 *   "dateOfBirth": "1990-01-01",
 *   "gender": "male"
 * }
 *
 * @security
 * - Requires PATIENT:CREATE permission
 * - Patient ID is auto-generated if not provided
 * - Duplicate patient ID check within tenant
 * - All creation events are audited
 *
 * @validation
 * - Input validated against patientRegistrationSchema
 * - Date formats are normalized
 * - Required fields are enforced
 *
 * @audit
 * - Creation event logged with user, tenant, and IP address
 * - PHI access logged for compliance
 */
async function postHandler(req, user) {
  const body = await req.json();

  // Validate input
  const validationResult = patientRegistrationSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(validationErrorResponse(validationResult.error.errors), {
      status: 400,
    });
  }

  // Get IP and user agent
  const ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  const patient = await createPatient(validationResult.data, user.tenantId, user.userId);

  return NextResponse.json(successResponse(patient), { status: 201 });
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates PATIENT:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.PATIENT, ACTIONS.READ)(getHandler)))
  )
);

/**
 * Apply enterprise middleware stack to POST endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates PATIENT:CREATE permission
 * 6. Handler - Executes business logic
 */
export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.PATIENT, ACTIONS.CREATE)(postHandler)))
  )
);
