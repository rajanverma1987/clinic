# Feature Access Control System

This document explains how subscription-based feature access control is implemented in the application.

## Overview

The system ensures that clients can only access features included in their subscription plan. Features are defined in subscription plans and checked at both the API and UI level.

## Architecture

### 1. Feature Definition

Features are defined as strings in subscription plans. Available features include:

- `Patient Management`
- `Appointment Scheduling`
- `Queue Management`
- `Prescriptions Management`
- `Invoice & Billing`
- `Inventory Management`
- `Reports & Analytics`
- `Advanced Reports & Analytics`
- `Multi-Location Support`
- `Telemedicine`
- `API Access`
- `Custom Branding`
- `Priority Support`
- `Data Export`
- `Audit Logs`
- `HIPAA/GDPR Compliance`
- `White Label Solution`
- `Dedicated Support`

### 2. Backend Services

#### Feature Access Service (`services/feature-access.service.ts`)

Provides functions to check feature access:

- `getTenantFeatures(tenantId)`: Get all features available to a tenant
- `hasFeatureAccess(tenantId, featureName)`: Check if tenant has a specific feature
- `hasAnyFeatureAccess(tenantId, featureNames)`: Check if tenant has any of the features
- `hasAllFeatureAccess(tenantId, featureNames)`: Check if tenant has all features
- `getTenantLimits(tenantId)`: Get subscription limits (maxUsers, maxPatients, maxStorageGB)
- `checkLimit(tenantId, limitType, currentCount)`: Check if tenant is within limits

#### Feature Check Middleware (`middleware/feature-check.ts`)

Provides middleware functions for API routes:

- `requireFeature(req, user, featureName)`: Ensure user has access to a feature
- `requireAnyFeature(req, user, featureNames)`: Ensure user has access to any feature

### 3. Frontend Context

#### Feature Context (`contexts/FeatureContext.tsx`)

React context that provides:

- `features`: Array of available feature names
- `limits`: Object with maxUsers, maxPatients, maxStorageGB
- `hasFeature(featureName)`: Check if feature is available
- `hasAnyFeature(featureNames)`: Check if any feature is available
- `hasAllFeatures(featureNames)`: Check if all features are available
- `checkLimit(limitType, currentCount)`: Check if within limits
- `refreshFeatures()`: Reload features from API

#### Feature Guard Component (`components/ui/FeatureGuard.tsx`)

Component that conditionally renders children based on feature access:

```tsx
<FeatureGuard feature="Patient Management" redirectTo="/dashboard">
  <PatientsPage />
</FeatureGuard>
```

### 4. Feature Mapping

Features are mapped to application routes/pages:

| Feature | Routes/Pages |
|---------|-------------|
| Patient Management | `/patients`, `/api/patients` |
| Appointment Scheduling | `/appointments`, `/api/appointments` |
| Queue Management | `/queue`, `/api/queue` |
| Prescriptions Management | `/prescriptions`, `/api/prescriptions` |
| Invoice & Billing | `/invoices`, `/api/invoices`, `/api/payments` |
| Inventory Management | `/inventory`, `/api/inventory` |
| Reports & Analytics | `/reports`, `/api/reports` |

## Implementation

### Adding Feature Check to API Route

```typescript
async function getHandler(req: AuthenticatedRequest, user: any) {
  // Check feature access (skip for super_admin)
  if (user.role !== 'super_admin') {
    const { requireFeature } = await import('@/middleware/feature-check');
    const featureCheck = await requireFeature(req, user, 'Patient Management');
    if (!featureCheck.allowed) {
      return featureCheck.error!;
    }
  }

  // ... rest of handler
}
```

### Using Feature Context in Components

```tsx
import { useFeatures } from '@/contexts/FeatureContext';

function MyComponent() {
  const { hasFeature } = useFeatures();

  if (!hasFeature('Patient Management')) {
    return <div>Feature not available</div>;
  }

  return <PatientsList />;
}
```

### Filtering Menu Items

The sidebar automatically filters menu items based on available features:

```typescript
const menuItemsWithFeatures = [
  { href: '/patients', labelKey: 'patients.title', requiredFeature: 'Patient Management' },
  { href: '/appointments', labelKey: 'appointments.title', requiredFeature: 'Appointment Scheduling' },
  // ...
];

const menuItems = menuItemsWithFeatures.filter(item => 
  item.requiredFeature === null || hasFeature(item.requiredFeature)
);
```

### Protecting Pages

```tsx
import { FeatureGuard } from '@/components/ui/FeatureGuard';

export default function PatientsPage() {
  return (
    <FeatureGuard feature="Patient Management" redirectTo="/dashboard">
      <Layout>
        {/* Page content */}
      </Layout>
    </FeatureGuard>
  );
}
```

## API Endpoints

### GET /api/features

Returns the current tenant's available features and limits:

```json
{
  "success": true,
  "data": {
    "features": ["Patient Management", "Appointment Scheduling", ...],
    "limits": {
      "maxUsers": 10,
      "maxPatients": 1000,
      "maxStorageGB": 50
    }
  }
}
```

## Feature Limits

The system supports limits on:

- **Max Users**: Maximum number of users in the tenant
- **Max Patients**: Maximum number of patients
- **Max Storage**: Maximum storage in GB

Limits are checked using the `checkLimit` function:

```typescript
const { checkLimit } = useFeatures();
const canAddUser = checkLimit('users', currentUserCount);
```

## Admin Override

Super admin users (`role === 'super_admin'`) have access to all features and bypass all feature checks.

## Extending the System

### Adding a New Feature

1. Add the feature name to `AVAILABLE_FEATURES` in `app/admin/subscriptions/page.tsx`
2. Map the feature to routes in `services/feature-access.service.ts` (FEATURE_MAPPING)
3. Add feature check to relevant API routes
4. Update sidebar menu items to include the required feature
5. Wrap pages/components with `FeatureGuard` if needed

### Adding Feature Checks to New Routes

1. Import the `requireFeature` function
2. Add the check at the beginning of the handler
3. Return error if feature not available

Example:
```typescript
if (user.role !== 'super_admin') {
  const { requireFeature } = await import('@/middleware/feature-check');
  const featureCheck = await requireFeature(req, user, 'Feature Name');
  if (!featureCheck.allowed) {
    return featureCheck.error!;
  }
}
```

## Testing

To test feature access:

1. Create a subscription plan with specific features
2. Assign the plan to a tenant
3. Login as a user from that tenant
4. Verify that:
   - Only available features appear in sidebar
   - API routes return 403 for unavailable features
   - Pages show upgrade message for unavailable features

## Notes

- Features are checked against the tenant's active subscription
- If no active subscription exists, no features are available (except for super admin)
- Feature access is cached in the FeatureContext and refreshed on login
- Call `refreshFeatures()` after subscription changes to update the UI

