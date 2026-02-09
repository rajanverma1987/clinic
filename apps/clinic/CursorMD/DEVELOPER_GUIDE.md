# Developer Guide

**Date:** January 2025  
**Status:** Development Reference

## Project Structure

```
clinic/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── patients/        # Patient endpoints
│   │   ├── appointments/    # Appointment endpoints
│   │   ├── prescriptions/   # Prescription endpoints
│   │   ├── invoices/        # Billing endpoints
│   │   ├── lab-tests/       # Lab test endpoints
│   │   ├── lab-orders/      # Lab order endpoints
│   │   ├── lab-results/     # Lab result endpoints
│   │   ├── clinical-notes/  # Clinical note endpoints
│   │   ├── inventory/       # Inventory endpoints
│   │   ├── reports/         # Report endpoints
│   │   ├── notifications/   # Notification endpoints
│   │   ├── patient-portal/  # Patient portal endpoints
│   │   ├── gdpr/            # GDPR compliance endpoints
│   │   └── whatsapp/        # WhatsApp endpoints
│   └── [pages]/             # Next.js pages
├── lib/                      # Core utilities
│   ├── auth/               # JWT authentication
│   ├── audit/              # Audit logging
│   ├── db/                 # Database connection & helpers
│   ├── encryption/         # PHI encryption utilities
│   ├── errors/             # Custom error classes
│   ├── permissions/        # RBAC permissions
│   ├── utils/              # Utilities (pagination, API responses, sanitize)
│   └── validations/        # Zod validation schemas
├── middleware/             # Express/Next.js middleware
│   ├── auth.js            # Authentication middleware
│   ├── error-handler.js   # Error handling middleware
│   ├── permission-check.js # Permission checking
│   ├── rate-limit.js      # Rate limiting
│   ├── security-headers.js # Security headers
│   └── csrf.js            # CSRF protection
├── models/                  # Mongoose models
│   ├── User.js
│   ├── Patient.js
│   ├── Appointment.js
│   ├── Prescription.js
│   ├── Invoice.js
│   ├── ClinicalNote.js
│   └── [other models]
├── services/               # Business logic layer
│   ├── patient.service.js
│   ├── appointment.service.js
│   ├── prescription.service.js
│   ├── billing.service.js
│   └── [other services]
└── CursorMD/               # Documentation
    ├── NEW-PLANS.md
    ├── API_DOCUMENTATION.md
    ├── DEPLOYMENT_GUIDE.md
    └── [other docs]
```

## Architecture Patterns

### 1. Service Layer Pattern
All business logic goes in services, not API routes:

```javascript
// ✅ Good - Service handles logic
// services/patient.service.js
export async function createPatient(input, tenantId, userId) {
  // Business logic here
  return patient;
}

// app/api/patients/route.js
const patient = await createPatient(body, user.tenantId, user.userId);
return NextResponse.json(successResponse(patient));
```

### 2. Middleware Stack
All API routes use consistent middleware:

```javascript
export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.PATIENT, ACTIONS.READ)(handler)
    )
  )
);
```

### 3. Validation Pattern
Always validate input with Zod:

```javascript
const validationResult = schema.safeParse(body);
if (!validationResult.success) {
  return NextResponse.json(
    validationErrorResponse(validationResult.error.errors),
    { status: 400 }
  );
}
```

### 4. Error Handling
Use custom error classes:

```javascript
throw new NotFoundError('Patient not found');
throw new ValidationError('Invalid input');
```

### 5. Audit Logging
Log all sensitive operations:

```javascript
await AuditLogger.auditWrite(
  'patient',
  patientId,
  userId,
  tenantId,
  AuditAction.CREATE
);
```

## Coding Standards

### Naming Conventions
- **Files:** `kebab-case.js` (e.g., `patient.service.js`)
- **Functions:** `camelCase` (e.g., `createPatient`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `RESOURCES.PATIENT`)
- **Models:** `PascalCase` (e.g., `Patient`)

### Code Style
- Use 2-space indentation
- Max line length: 100 characters
- Use async/await (no callbacks)
- Always use `const` or `let` (never `var`)
- Use template literals for strings

### Error Handling
```javascript
// ✅ Good - Let middleware handle errors
export async function handler(req, user) {
  const result = await serviceFunction(input);
  return NextResponse.json(successResponse(result));
}

// ❌ Avoid - Don't catch and rethrow unnecessarily
export async function handler(req, user) {
  try {
    const result = await serviceFunction(input);
    return NextResponse.json(successResponse(result));
  } catch (error) {
    throw error; // Redundant
  }
}
```

### Database Queries
```javascript
// ✅ Good - Use lean() for read-only
const patients = await Patient.find(filter)
  .select('firstName lastName email')
  .lean();

// ✅ Good - Use projections
const patient = await Patient.findById(id)
  .select('-medicalHistory -allergies')
  .lean();

// ❌ Avoid - Fetching all fields
const patient = await Patient.findById(id).lean();
```

## Adding New Features

### Step 1: Create Model
```javascript
// models/NewFeature.js
const NewFeatureSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
  // ... fields
});

NewFeatureSchema.index({ tenantId: 1, field: 1 });
export default mongoose.model('NewFeature', NewFeatureSchema);
```

### Step 2: Create Validation Schema
```javascript
// lib/validations/new-feature.js
export const createNewFeatureSchema = z.object({
  field: z.string().min(1),
  // ... validation rules
});
```

### Step 3: Create Service
```javascript
// services/new-feature.service.js
export async function createNewFeature(input, tenantId, userId) {
  await connectDB();
  // Business logic
  await AuditLogger.auditWrite(...);
  return feature;
}
```

### Step 4: Create API Route
```javascript
// app/api/new-features/route.js
export const POST = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.NEW_FEATURE, ACTIONS.CREATE)(handler)
    )
  )
);
```

### Step 5: Update Permissions
```javascript
// lib/permissions/constants.js
export const RESOURCES = {
  // ...
  NEW_FEATURE: 'new_feature',
};

export const PERMISSIONS = {
  doctor: {
    // ...
    [RESOURCES.NEW_FEATURE]: [ACTIONS.READ, ACTIONS.CREATE],
  },
};
```

## Testing

### Unit Tests
```javascript
// __tests__/services/patient.service.test.js
describe('createPatient', () => {
  it('should create patient with valid input', async () => {
    const patient = await createPatient(validInput, tenantId, userId);
    expect(patient).toBeDefined();
  });
});
```

### Integration Tests
```javascript
// __tests__/api/patients.test.js
describe('POST /api/patients', () => {
  it('should create patient', async () => {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(validInput),
    });
    expect(response.status).toBe(201);
  });
});
```

## Debugging

### Enable Query Logging
```javascript
// In development only
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}
```

### Check Audit Logs
```javascript
// Query audit logs
const logs = await AuditLog.find({
  tenantId,
  resource: 'patient',
  action: 'CREATE',
}).sort({ createdAt: -1 });
```

## Performance Tips

1. **Use Indexes:** Always index frequently queried fields
2. **Use Lean:** Use `.lean()` for read-only queries
3. **Pagination:** Always paginate list endpoints (max 50 items)
4. **Projections:** Select only needed fields
5. **Connection Pooling:** Already configured (max 20 connections)

## Security Best Practices

1. **Sanitize Inputs:** Use `sanitizeString()` for user inputs
2. **Validate Everything:** Use Zod schemas
3. **Never Log PHI:** Don't log sensitive data
4. **Use HTTPS:** Always in production
5. **Rate Limit:** All endpoints are rate limited
6. **Audit Logs:** Log all sensitive operations

## Common Pitfalls

1. **Forgetting tenantId:** Always use `withTenant()` helper
2. **Not using lean():** Causes unnecessary overhead
3. **Logging PHI:** Never log sensitive data
4. **Missing validation:** Always validate input
5. **Not handling errors:** Let middleware handle errors

## CSS Loading & Client Navigation

**Why dashboard CSS sometimes doesn’t load 100% without a hard refresh**

- **Cause:** Route-specific CSS (e.g. `dashboard.css`) is loaded with the route’s JS chunk. On client-side navigation, that chunk can load after first paint or fail if the HMR runtime is in a bad state (e.g. after a `hot-update.js` 404 from a stale build).
- **Terminal 404:** `GET /_next/static/webpack/app/dashboard/page.*.hot-update.js 404` happens when the dev client asks for an HMR file that no longer exists (new compile = new hashes). That 404 can leave the runtime out of sync so later chunks/styles don’t apply correctly.
- **Fix in this project:** Dashboard styles are imported in **`app/dashboard/layout.jsx`**, not only in `app/dashboard/page.jsx`. The route layout is part of the segment dependency graph, so Next.js loads its CSS with the `/dashboard` segment on client nav, and styles apply reliably without a hard refresh.
- **If styles still look wrong:** Do a hard refresh (Cmd+Shift+R / Ctrl+Shift+R) to clear HMR state and load fresh chunks. Avoid long-lived dev tabs across many recompiles.

## Resources

- **Mongoose Docs:** https://mongoosejs.com/docs/
- **Next.js Docs:** https://nextjs.org/docs
- **Zod Docs:** https://zod.dev/
- **Project Plans:** `CursorMD/NEW-PLANS.md`
