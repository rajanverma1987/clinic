# CLAUDE-AI: Route & Configuration Audit

**Purpose:** Checklist of security, compliance, and configuration gaps in route/navigation config and related constants. Implementation must stay within **CursorMD/New** (clinic-complete-specification, database-schema, realtime-caching-strategy). Items marked _Future / out of scope_ are not in current spec and must not be implemented unless first added to CursorMD/New.

---

## Critical Issues

### 1. Security & Access Control

**Problem:** Inconsistent permission checking; many routes lack explicit `requiredPermission` / `requiredFeature`.

**Fix:** Every protected route should have explicit permissions, e.g.:

```javascript
{
  path: '/invoices',
  labelKey: 'invoices.title',
  requiredFeature: FEATURES.INVOICE_BILLING,
  requiredPermission: { resource: RESOURCES.INVOICE, action: ACTIONS.READ },
  requiredRoles: ['doctor', 'clinic_admin', 'admin', 'accountant', 'receptionist']
}
```

### 2. Manager Role Confusion

**Problem:** Manager described as "limited" but route config may allow access to sensitive operations without explicit restrictions.

**Fix:** Align dashboard-structure and middleware with CursorMD/New permission matrix. Manager: no Settings, no revenue reports, limited invoice (no pricing), no staff management, etc. Add explicit Manager restrictions in code where routes are resolved.

```javascript
const MANAGER_RESTRICTIONS = {
  cannotAccess: ['/staff', '/settings', '/reports'],
  readOnly: ['/inventory'],
  limitedWrite: ['/invoices'], // e.g. no pricing fields
};
```

### 3. Missing Data Validation Patterns

**Problem:** No central input validation schemas, rate limiting, or audit requirements per route.

**Add:**

```javascript
export const ROUTE_VALIDATION = {
  '/invoices/new': {
    maxFileSize: '10MB',
    allowedFileTypes: ['pdf', 'jpg', 'png'],
    rateLimit: { requests: 100, window: '1h' },
    auditLevel: 'detailed',
  },
};
```

### 4. Multi-Tenancy Isolation

**Problem:** No explicit tenant-scoping rules documented for routes; enforcement must be consistent in APIs and UI.

**Add:**

```javascript
export const TENANT_ISOLATION = {
  enforceOnAllRoutes: true,
  exceptions: ['/login', '/register', '/pricing'],
  crossTenantAllowed: [], // Super admin only
  requireTenantContext: true,
};
```

### 5. Patient Data (PHI) Protection

**Problem:** Patient detail tabs expose PHI; granular control per tab (e.g. notes vs overview) should align with permission matrix.

**Fix:**

```javascript
'/patients/:id': {
  defaultTab: 'overview',
  tabs: [
    { id: 'overview', labelKey: 'patients.overview', requiredPermission: { resource: RESOURCES.PATIENT, action: ACTIONS.READ }, phiLevel: 'basic' },
    { id: 'notes', labelKey: 'doctors.notes', doctorOnly: true, requiredPermission: { resource: RESOURCES.CLINICAL_NOTE, action: ACTIONS.READ }, phiLevel: 'sensitive', auditAccess: true }
  ]
}
```

---

## Medium Priority

### 6. API Versioning

**Problem:** No version prefix on API routes.

**Fix:** Consider `/api/v1/...` for future stability; document in API docs.

### 7. Error Handling Strategy

**Problem:** No definition of error responses, fallback routes, or offline behavior.

**Add:**

```javascript
export const ERROR_HANDLING = {
  unauthorizedRedirect: '/login',
  forbiddenRedirect: '/dashboard',
  notFoundRedirect: '/dashboard',
  offlineMode: {
    allowedRoutes: ['/queue', '/appointments'],
    syncOnReconnect: true,
  },
};
```

### 8. GDPR/HIPAA Mappings

**Problem:** No route-level data classification for compliance.

**Add:**

```javascript
export const DATA_CLASSIFICATION = {
  '/patients/:id': {
    phiLevel: 'high',
    retentionYears: 7,
    encryptionRequired: true,
    consentRequired: ['read', 'export'],
  },
  '/invoices': {
    phiLevel: 'medium',
    pciCompliance: true,
  },
};
```

### 9. Session Management

**Problem:** Session timeout and concurrent-session rules not centralized.

**Add:**

```javascript
export const SESSION_CONFIG = {
  accessTokenTTL: 15 * 60, // 15 min
  refreshTokenTTL: 7 * 24 * 60 * 60, // 7 days
  maxConcurrentSessions: 3,
  inactivityTimeout: 30 * 60, // 30 min
  require2FA: ['super_admin', 'doctor'],
};
```

### 10. Route Pattern Clarity

**Problem:** `/patients/:id` vs `/admin/patients/:id` — no clear disambiguation strategy for dynamic segments. Ensure admin = super_admin context in middleware and sidebar.

---

## Lower Priority

- **i18n:** Route paths are not localized; only labels use i18n (acceptable for clinic-only).
- **Analytics:** No central pageview/event tracking config (add if product requires).
- **PWA:** No offline-first route config (add if PWA is in scope).
- **Bulk operations:** Define which entities support bulk and which operations (delete, export, etc.).
- **WebSocket:** realtime-caching-strategy.md defines events; ensure route-to-socket usage is documented where relevant.

---

## Recommended In-Scope Additions

### 1. Explicit permission matrix (route-level)

```javascript
export const PERMISSION_MATRIX = {
  manager: {
    '/patients': { read: true, write: true, delete: false },
    '/invoices': { read: true, write: 'limited', delete: false },
    '/settings': { read: false, write: false, delete: false },
  },
  // ... per role from clinic-complete-specification
};
```

### 2. Audit requirements

```javascript
export const AUDIT_CONFIG = {
  alwaysAudit: ['/patients/:id', '/prescriptions', '/invoices'],
  auditActions: ['create', 'update', 'delete', 'export', 'print'],
  retentionDays: 2555, // 7 years
};
```

### 3. Rate limiting

```javascript
export const RATE_LIMITS = {
  '/api/auth/login': { max: 5, window: '15m', blockDuration: '1h' },
  '/api/patients': { max: 1000, window: '1h' },
  '/api/prescriptions/new': { max: 100, window: '1h' },
};
```

### 4. Feature flags per environment

```javascript
export const FEATURE_FLAGS = {
  production: { TELEMEDICINE: true, BETA_FEATURES: false },
  staging: { TELEMEDICINE: true, BETA_FEATURES: true },
};
```

---

## Additional Missing Elements (11–35)

_Implement only if added to CursorMD/New. Otherwise treat as reference / future scope._

### 11. Content Security Policy (CSP) Rules

```javascript
export const CSP_POLICIES = {
  '/telemedicine/:id': {
    'connect-src': ['self', 'wss://*.webrtc-provider.com'],
    'media-src': ['self', 'blob:'],
    'frame-ancestors': ['none'],
  },
  '/prescriptions/:id/print': {
    'script-src': ['self'],
    'style-src': ['self', 'unsafe-inline'],
  },
};
```

### 12. IP Whitelisting / Geofencing

```javascript
export const GEO_RESTRICTIONS = {
  '/admin': {
    allowedCountries: ['US', 'CA', 'UK'],
    requireVPN: true,
    ipWhitelist: process.env.ADMIN_IP_WHITELIST,
  },
  '/telemedicine': {
    requireSameCountryAsClinic: true,
  },
};
```

### 13. Consent Management

```javascript
export const CONSENT_REQUIREMENTS = {
  '/patients/:id/export': {
    requiredConsents: ['data_export', 'third_party_sharing'],
    expiryCheck: true,
    documentConsent: true,
  },
  '/telemedicine/:id': {
    requiredConsents: ['video_recording', 'data_storage'],
    revalidateEvery: 365,
  },
};
```

### 14. Data Retention Policies

```javascript
export const DATA_RETENTION = {
  '/prescriptions': {
    retentionYears: 7,
    autoArchiveAfter: 3,
    destructionMethod: 'crypto-shred',
    legalHoldExempt: false,
  },
  '/appointments': {
    retentionYears: 7,
    piiRedactionAfter: 2,
    archiveStorage: 's3-glacier',
  },
};
```

### 15. Disaster Recovery / Degraded Mode

```javascript
export const DR_CONFIG = {
  degradedMode: {
    allowedRoutes: ['/dashboard', '/queue', '/appointments', '/patients/:id'],
    disabledFeatures: ['telemedicine', 'reports', 'billing'],
    readOnlyMode: true,
  },
  maintenanceMode: {
    allowedRoles: ['super_admin'],
    redirectPath: '/maintenance',
    estimatedDowntime: null,
  },
};
```

### 16. Cache Strategy Per Route

```javascript
export const CACHE_STRATEGY = {
  '/dashboard': {
    strategy: 'stale-while-revalidate',
    maxAge: 300,
    cacheKey: ['tenantId', 'userId', 'role'],
  },
  '/patients/:id': {
    strategy: 'no-cache',
    mustRevalidate: true,
  },
  '/inventory/items': {
    strategy: 'cache-first',
    maxAge: 3600,
    invalidateOn: ['inventory.updated', 'batch.created'],
  },
};
```

### 17. Webhook / Integration Routes

```javascript
export const INTEGRATION_ROUTES = {
  inbound: [
    { path: '/webhooks/stripe', provider: 'stripe', auth: 'signature' },
    { path: '/webhooks/twilio', provider: 'twilio', auth: 'basic' },
    { path: '/api/fhir/r4', standard: 'FHIR', auth: 'oauth2' },
  ],
  outbound: [
    { trigger: 'appointment.created', webhook: 'external-calendar-sync' },
    { trigger: 'prescription.signed', webhook: 'pharmacy-integration' },
  ],
};
```

### 18. Medical Device Integration (IoMT)

```javascript
export const DEVICE_ROUTES = {
  '/api/devices/vitals': {
    protocols: ['HL7', 'FHIR', 'MQTT'],
    deviceTypes: ['blood-pressure', 'glucose-meter', 'ecg'],
    dataValidation: 'FDA-approved-only',
    encryption: 'end-to-end',
  },
};
```

### 19. Clinical Decision Support (CDS)

```javascript
export const CDS_ROUTES = {
  '/api/cds/drug-interactions': {
    requiredPermission: { resource: RESOURCES.PRESCRIPTION, action: ACTIONS.CREATE },
    auditDecisions: true,
    humanOverride: true,
  },
  '/api/cds/diagnosis-suggest': {
    mlModel: 'diagnosis-v2.1',
    confidenceThreshold: 0.85,
    disclaimerRequired: true,
  },
};
```

### 20. E-Prescribing / EPCS

```javascript
export const EPCS_ROUTES = {
  '/api/prescriptions/controlled/sign': {
    require2FA: true,
    requireHardwareToken: true,
    dea_verification: true,
    state_pmp_check: true,
    auditLevel: 'forensic',
  },
};
```

### 21. Laboratory / Imaging Integration

```javascript
export const LAB_IMAGING_ROUTES = {
  '/api/imaging/dicom': {
    protocol: 'DICOM',
    storage: 'PACS',
    viewerRoute: '/imaging/viewer/:studyId',
  },
  '/api/lab/hl7': {
    protocol: 'HL7v2',
    messageTypes: ['ORU^R01', 'ORM^O01'],
    ackRequired: true,
  },
};
```

### 22. Insurance Verification

```javascript
export const INSURANCE_ROUTES = {
  '/api/insurance/verify-realtime': {
    providers: ['change-healthcare', 'availity'],
    cacheEligibility: 24 * 60 * 60,
    fallbackToManual: true,
  },
  '/api/insurance/prior-auth': {
    workflow: 'async',
    statusPolling: 300,
    requiredDocs: ['clinical-notes', 'diagnosis'],
  },
};
```

### 23. Clinical Trial Routes

```javascript
export const CLINICAL_TRIAL_ROUTES = {
  '/api/trials/enrollment': {
    irbApprovalRequired: true,
    consentVersion: 'tracked',
    dataAnonymization: 'automatic',
  },
};
```

### 24. Regulatory Reporting

```javascript
export const REGULATORY_REPORTING = {
  '/api/reporting/adverse-events': {
    destinations: ['FDA-FAERS', 'CDC-VAERS'],
    timeline: 'within-24-hours',
    followUpRequired: true,
  },
  '/api/reporting/communicable-disease': {
    autoTrigger: ['COVID-19', 'Tuberculosis', 'HIV'],
    stateHealthDept: 'auto-detect',
    encryption: 'state-mandated',
  },
};
```

### 25. Patient Portal Delegation

```javascript
export const DELEGATION_ROUTES = {
  '/portal/patients/:id/delegates': {
    relationshipTypes: ['parent', 'guardian', 'poa', 'caregiver'],
    expiryRequired: true,
    scopeLimits: ['view-only', 'book-appointments', 'no-financial'],
  },
};
```

### 26. Cross-Border Data Transfer (GDPR Art. 46)

```javascript
export const DATA_TRANSFER = {
  '/api/patients/export': {
    allowedDestinations: ['EU', 'UK', 'CA'],
    standardContractualClauses: true,
    requireDPIA: true,
    transferLog: 'mandatory',
  },
};
```

### 27. Blockchain / Immutable Audit

```javascript
export const BLOCKCHAIN_AUDIT = {
  '/api/audit/blockchain': {
    events: ['prescription.signed', 'consent.granted', 'record.accessed'],
    network: 'hyperledger-fabric',
    smartContracts: ['access-control', 'data-provenance'],
  },
};
```

### 28. Emergency Access (Break-Glass)

```javascript
export const EMERGENCY_ACCESS = {
  '/api/emergency-access/break-glass': {
    justificationRequired: true,
    notifyPatient: true,
    notifyComplianceOfficer: true,
    accessDuration: 60 * 60,
    postAccessReview: 'mandatory',
    auditLevel: 'forensic',
  },
};
```

### 29. Telehealth State Licensing

```javascript
export const LICENSING_VALIDATION = {
  '/telemedicine/:id/validate-license': {
    checkProviderState: true,
    checkPatientState: true,
    crossStateBorder: 'block-or-warn',
    compactStates: ['IMLC', 'NLC'],
    expiryCheck: 'realtime',
  },
};
```

### 30. Medication Reconciliation

```javascript
export const MED_RECONCILIATION = {
  '/api/med-reconciliation/import': {
    sources: ['surescripts', 'pharmacy-benefit-manager'],
    duplicateDetection: true,
    interactionCheck: true,
    allergyCheck: true,
  },
};
```

### 31. Change Management

```javascript
export const CHANGE_MANAGEMENT = {
  routeVersioning: true,
  deprecationNotice: 90,
  backwardCompatibility: 2,
  changeLog: 'required',
};
```

### 32. SLA Definitions

```javascript
export const SLA_TARGETS = {
  '/api/appointments': { uptime: 99.9, responseTime: 200 },
  '/api/prescriptions': { uptime: 99.95, responseTime: 100 },
  '/telemedicine': { uptime: 99.5, latency: 150, jitter: 30 },
};
```

### 33. Cost Allocation Tags

```javascript
export const COST_ALLOCATION = {
  '/api/imaging/dicom': { costCenter: 'radiology', chargebackRate: 5.0 },
  '/api/lab/results': { costCenter: 'laboratory', chargebackRate: 2.5 },
};
```

### 34. Dependency Health Checks

```javascript
export const HEALTH_CHECKS = {
  '/api/health/dependencies': {
    checks: ['mongodb', 'redis', 'stripe', 'twilio', 'dicom-server'],
    timeout: 5000,
    criticalDependencies: ['mongodb', 'redis'],
  },
};
```

### 35. A/B Testing Routes

```javascript
export const AB_TESTING = {
  '/dashboard': {
    variants: ['original', 'redesign-v2'],
    trafficSplit: [50, 50],
    metrics: ['time-on-page', 'task-completion'],
  },
};
```

---

## Summary of All Items

| Category       | Count | Examples                                                                |
| -------------- | ----- | ----------------------------------------------------------------------- |
| Security       | 8     | CSP, IP whitelist, consent, emergency access, break-glass               |
| Compliance     | 10    | GDPR transfers, HIPAA audit, regulatory reporting, data retention, EPCS |
| Clinical       | 7     | CDS, med rec, e-prescribing, lab integration, adverse events            |
| Infrastructure | 6     | DR/failover, caching, rate limits, health checks, SLA                   |
| Integration    | 4     | Webhooks, FHIR, HL7, DICOM, devices                                     |

**In-scope (implement first):** Items 1–10 (Critical + Medium + Low) and Recommended (permission matrix, audit, rate limits, feature flags). Enforce via constants and middleware.

**Out of scope unless in CursorMD/New:** Items 11–35. Use as reference only; do not implement until specified in CursorMD/New.

The codebase has partial enforcement (e.g. `requiredPermission` on some routes). This doc is the full checklist; implement in-scope items 100% and reference out-of-scope items for future work.
Complete Enterprise Dashboard Loading Strategy

1. Loading State Architecture
   javascript// lib/loading/loading-states.js

export const LOADING_STATES = {
IDLE: 'idle',
INITIAL: 'initial', // First load
REFRESHING: 'refreshing', // Pull-to-refresh
PAGINATING: 'paginating', // Load more
MUTATING: 'mutating', // Creating/updating
BACKGROUND: 'background', // Silent refresh
OPTIMISTIC: 'optimistic', // Instant UI update
STREAMING: 'streaming', // Real-time data
ERROR: 'error',
SUCCESS: 'success'
};

export const SKELETON_TYPES = {
DASHBOARD: 'dashboard',
TABLE: 'table',
FORM: 'form',
DETAIL: 'detail',
CHART: 'chart',
CARD: 'card',
LIST: 'list',
GRID: 'grid',
CALENDAR: 'calendar',
KANBAN: 'kanban'
};

export const LOADING_PRIORITIES = {
CRITICAL: 1, // Auth, permissions, tenant data
HIGH: 2, // Dashboard stats, active appointments
MEDIUM: 3, // Lists, charts
LOW: 4, // Analytics, historical data
LAZY: 5 // Images, non-critical widgets
}; 2. Progressive Loading Strategy
javascript// lib/loading/progressive-loader.js

export const PROGRESSIVE_LOADING_MAP = {
'/dashboard': {
phases: [
{
phase: 1,
priority: LOADING_PRIORITIES.CRITICAL,
components: ['UserAuth', 'TenantContext', 'PermissionsCheck'],
timeout: 1000,
fallback: 'redirect-login'
},
{
phase: 2,
priority: LOADING_PRIORITIES.HIGH,
components: ['DashboardStats', 'QuickActions', 'TodayAppointments'],
timeout: 2000,
skeleton: SKELETON_TYPES.DASHBOARD
},
{
phase: 3,
priority: LOADING_PRIORITIES.MEDIUM,
components: ['RevenueChart', 'PatientSummary', 'QueueWidget'],
timeout: 3000,
skeleton: SKELETON_TYPES.CHART
},
{
phase: 4,
priority: LOADING_PRIORITIES.LOW,
components: ['InventoryAlerts', 'RecentActivity'],
timeout: 5000,
skeleton: SKELETON_TYPES.CARD
}
],
preload: ['critical-fonts', 'icons', 'primary-css'],
deferrable: ['analytics-script', 'chat-widget']
},

'/appointments': {
phases: [
{
phase: 1,
priority: LOADING_PRIORITIES.CRITICAL,
components: ['AppointmentFilters', 'CalendarHeader'],
timeout: 1000
},
{
phase: 2,
priority: LOADING_PRIORITIES.HIGH,
components: ['AppointmentCalendar', 'TodayList'],
timeout: 2500,
skeleton: SKELETON_TYPES.CALENDAR
},
{
phase: 3,
priority: LOADING_PRIORITIES.MEDIUM,
components: ['UpcomingList', 'StatusSummary'],
timeout: 4000,
skeleton: SKELETON_TYPES.LIST
}
]
},

'/patients': {
phases: [
{
phase: 1,
priority: LOADING_PRIORITIES.CRITICAL,
components: ['SearchBar', 'FilterPanel'],
timeout: 1000
},
{
phase: 2,
priority: LOADING_PRIORITIES.HIGH,
components: ['PatientTable'],
timeout: 2500,
skeleton: SKELETON_TYPES.TABLE,
virtualScroll: true,
initialRows: 50
}
]
},

'/patients/:id': {
phases: [
{
phase: 1,
priority: LOADING_PRIORITIES.CRITICAL,
components: ['PatientHeader', 'TabNavigation'],
timeout: 1500,
skeleton: SKELETON_TYPES.DETAIL
},
{
phase: 2,
priority: LOADING_PRIORITIES.HIGH,
components: ['ActiveTabContent'],
timeout: 2000,
skeleton: 'tab-specific'
},
{
phase: 3,
priority: LOADING_PRIORITIES.MEDIUM,
components: ['RelatedData', 'Timeline'],
timeout: 3500,
lazy: true
}
]
},

'/queue': {
phases: [
{
phase: 1,
priority: LOADING_PRIORITIES.HIGH,
components: ['QueueBoard'],
timeout: 1500,
skeleton: SKELETON_TYPES.KANBAN,
realtime: true
}
]
},

'/reports': {
phases: [
{
phase: 1,
priority: LOADING_PRIORITIES.CRITICAL,
components: ['DateRangePicker', 'ReportFilters'],
timeout: 1000
},
{
phase: 2,
priority: LOADING_PRIORITIES.MEDIUM,
components: ['ReportCharts', 'SummaryCards'],
timeout: 3000,
skeleton: SKELETON_TYPES.CHART,
cacheable: true,
cacheKey: 'date-range'
},
{
phase: 3,
priority: LOADING_PRIORITIES.LOW,
components: ['DetailedTable', 'ExportButtons'],
timeout: 5000,
skeleton: SKELETON_TYPES.TABLE
}
]
},

'/inventory': {
phases: [
{
phase: 1,
priority: LOADING_PRIORITIES.HIGH,
components: ['InventoryTabs', 'SearchFilter'],
timeout: 1000
},
{
phase: 2,
priority: LOADING_PRIORITIES.HIGH,
components: ['ItemsTable', 'LowStockAlerts'],
timeout: 2500,
skeleton: SKELETON_TYPES.TABLE
},
{
phase: 3,
priority: LOADING_PRIORITIES.MEDIUM,
components: ['ExpiryAlerts', 'TransactionHistory'],
timeout: 4000
}
]
},

'/telemedicine/:id': {
phases: [
{
phase: 1,
priority: LOADING_PRIORITIES.CRITICAL,
components: ['MediaDeviceCheck', 'ConnectionStatus'],
timeout: 2000,
fallback: 'device-error'
},
{
phase: 2,
priority: LOADING_PRIORITIES.HIGH,
components: ['VideoStream', 'ChatPanel'],
timeout: 5000,
skeleton: 'video-placeholder'
}
]
},

'/admin': {
phases: [
{
phase: 1,
priority: LOADING_PRIORITIES.CRITICAL,
components: ['AdminStats', 'PlatformHealth'],
timeout: 2000,
skeleton: SKELETON_TYPES.DASHBOARD
},
{
phase: 2,
priority: LOADING_PRIORITIES.MEDIUM,
components: ['TenantList', 'RevenueChart'],
timeout: 3500
}
]
}
}; 3. Skeleton Component Library
javascript// components/skeletons/SkeletonFactory.jsx

import React from 'react';

export const SkeletonFactory = ({ type, count = 1, variant = 'default' }) => {
const skeletons = {
[SKELETON_TYPES.DASHBOARD]: <DashboardSkeleton variant={variant} />,
[SKELETON_TYPES.TABLE]: <TableSkeleton rows={count} />,
[SKELETON_TYPES.FORM]: <FormSkeleton fields={count} />,
[SKELETON_TYPES.DETAIL]: <DetailSkeleton />,
[SKELETON_TYPES.CHART]: <ChartSkeleton variant={variant} />,
[SKELETON_TYPES.CARD]: <CardSkeleton count={count} />,
[SKELETON_TYPES.LIST]: <ListSkeleton items={count} />,
[SKELETON_TYPES.GRID]: <GridSkeleton items={count} />,
[SKELETON_TYPES.CALENDAR]: <CalendarSkeleton />,
[SKELETON_TYPES.KANBAN]: <KanbanSkeleton columns={count || 3} />
};

return skeletons[type] || <GenericSkeleton />;
};

// Dashboard Skeleton
const DashboardSkeleton = ({ variant }) => (

  <div className="space-y-6 animate-pulse">
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-6 shadow">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>

    {/* Quick Actions */}
    <div className="bg-white rounded-lg p-6 shadow">
      <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Appointments */}
      <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 mb-4 pb-4 border-b">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Right: Queue & Charts */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="h-6 bg-gray-300 rounded w-2/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>

  </div>
);

// Table Skeleton
const TableSkeleton = ({ rows = 10 }) => (

  <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
    {/* Header */}
    <div className="bg-gray-100 px-6 py-4 border-b">
      <div className="flex items-center space-x-4">
        <div className="h-4 bg-gray-300 rounded w-1/6"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/5"></div>
        <div className="h-4 bg-gray-300 rounded w-1/6"></div>
        <div className="h-4 bg-gray-300 rounded w-1/6"></div>
      </div>
    </div>

    {/* Rows */}
    <div className="divide-y">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>

  </div>
);

// Calendar Skeleton
const CalendarSkeleton = () => (

  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div className="h-8 bg-gray-300 rounded w-1/4"></div>
      <div className="flex space-x-2">
        <div className="h-10 w-10 bg-gray-200 rounded"></div>
        <div className="h-10 w-10 bg-gray-200 rounded"></div>
      </div>
    </div>

    {/* Calendar Grid */}
    <div className="grid grid-cols-7 gap-2 mb-4">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="h-8 bg-gray-200 rounded text-center"></div>
      ))}
    </div>

    <div className="grid grid-cols-7 gap-2">
      {[...Array(35)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded border-2 border-gray-200">
          <div className="h-5 bg-gray-300 rounded m-1 w-1/3"></div>
          <div className="space-y-1 p-1">
            <div className="h-3 bg-blue-200 rounded"></div>
            <div className="h-3 bg-green-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>

  </div>
);

// Kanban Skeleton
const KanbanSkeleton = ({ columns = 3 }) => (

  <div className="flex space-x-4 overflow-x-auto animate-pulse">
    {[...Array(columns)].map((_, i) => (
      <div key={i} className="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4">
        <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="bg-white rounded-lg p-4 shadow">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Chart Skeleton
const ChartSkeleton = ({ variant = 'line' }) => (

  <div className="bg-white rounded-lg p-6 shadow animate-pulse">
    <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
    
    {variant === 'line' && (
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-around">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-8 bg-gray-200 rounded-t"
              style={{ height: `${Math.random() * 100}%` }}
            ></div>
          ))}
        </div>
      </div>
    )}

    {variant === 'pie' && (
      <div className="flex justify-center">
        <div className="w-64 h-64 bg-gray-200 rounded-full"></div>
      </div>
    )}

    {variant === 'bar' && (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="h-4 bg-gray-300 rounded w-20"></div>
            <div
              className="h-8 bg-gray-200 rounded"
              style={{ width: `${Math.random() * 80 + 20}%` }}
            ></div>
          </div>
        ))}
      </div>
    )}

  </div>
);

// Form Skeleton
const FormSkeleton = ({ fields = 6 }) => (

  <div className="bg-white rounded-lg p-6 shadow space-y-6 animate-pulse">
    <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
    
    {[...Array(fields)].map((_, i) => (
      <div key={i}>
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    ))}

    <div className="flex space-x-4 pt-4">
      <div className="h-10 bg-blue-200 rounded w-32"></div>
      <div className="h-10 bg-gray-200 rounded w-32"></div>
    </div>

  </div>
);

// Detail Page Skeleton
const DetailSkeleton = () => (

  <div className="space-y-6 animate-pulse">
    {/* Header */}
    <div className="bg-white rounded-lg p-6 shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
          <div>
            <div className="h-8 bg-gray-300 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-24 bg-blue-200 rounded"></div>
        </div>
      </div>
    </div>

    {/* Tabs */}
    <div className="bg-white rounded-lg shadow">
      <div className="border-b px-6">
        <div className="flex space-x-8 py-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded w-20"></div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-6">
            <div>
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>

  </div>
);

// Card Skeleton
const CardSkeleton = ({ count = 3 }) => (

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg p-6 shadow animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-10 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    ))}
  </div>
);

// List Skeleton
const ListSkeleton = ({ items = 8 }) => (

  <div className="bg-white rounded-lg shadow divide-y animate-pulse">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="px-6 py-4 flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-16 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
);

// Grid Skeleton
const GridSkeleton = ({ items = 9 }) => (

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-4 space-y-3">
          <div className="h-5 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="flex justify-between items-center pt-2">
            <div className="h-6 bg-gray-300 rounded w-1/4"></div>
            <div className="h-8 w-20 bg-blue-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
4. Loading Hook Implementation
javascript// hooks/useProgressiveLoading.js

import { useState, useEffect, useCallback } from 'react';

export const useProgressiveLoading = (routePath, dependencies = []) => {
const [loadingPhases, setLoadingPhases] = useState({});
const [currentPhase, setCurrentPhase] = useState(0);
const [loadingState, setLoadingState] = useState(LOADING_STATES.INITIAL);
const [errors, setErrors] = useState({});

const config = PROGRESSIVE_LOADING_MAP[routePath];

useEffect(() => {
if (!config) return;

    const loadPhase = async (phaseIndex) => {
      const phase = config.phases[phaseIndex];
      if (!phase) {
        setLoadingState(LOADING_STATES.SUCCESS);
        return;
      }

      setCurrentPhase(phaseIndex + 1);
      setLoadingPhases(prev => ({
        ...prev,
        [phaseIndex]: LOADING_STATES.INITIAL
      }));

      try {
        // Simulate component loading (replace with actual data fetching)
        await Promise.race([
          loadPhaseComponents(phase),
          timeout(phase.timeout)
        ]);

        setLoadingPhases(prev => ({
          ...prev,
          [phaseIndex]: LOADING_STATES.SUCCESS
        }));

        // Load next phase
        setTimeout(() => loadPhase(phaseIndex + 1), 0);
      } catch (error) {
        setLoadingPhases(prev => ({
          ...prev,
          [phaseIndex]: LOADING_STATES.ERROR
        }));
        setErrors(prev => ({
          ...prev,
          [phaseIndex]: error.message
        }));

        if (phase.fallback) {
          handleFallback(phase.fallback);
        }
      }
    };

    loadPhase(0);

}, [routePath, ...dependencies]);

return {
currentPhase,
loadingPhases,
loadingState,
errors,
isPhaseLoaded: (phase) => loadingPhases[phase] === LOADING_STATES.SUCCESS,
isLoading: loadingState === LOADING_STATES.INITIAL,
config
};
};

const loadPhaseComponents = async (phase) => {
// Implement actual data fetching logic
return new Promise(resolve => setTimeout(resolve, Math.random() \* 1000));
};

const timeout = (ms) => new Promise((\_, reject) =>
setTimeout(() => reject(new Error('Timeout')), ms)
);

const handleFallback = (fallback) => {
switch (fallback) {
case 'redirect-login':
window.location.href = '/login';
break;
case 'device-error':
// Show device error modal
break;
default:
console.warn('Unknown fallback:', fallback);
}
}; 5. Loading Wrapper Component
javascript// components/loading/LoadingWrapper.jsx

import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import { SkeletonFactory } from '@/components/skeletons/SkeletonFactory';

export const LoadingWrapper = ({
children,
routePath,
phase,
fallback,
dependencies = []
}) => {
const { isPhaseLoaded, config } = useProgressiveLoading(routePath, dependencies);

if (!config || !config.phases[phase - 1]) {
return children;
}

const phaseConfig = config.phases[phase - 1];

if (!isPhaseLoaded(phase - 1)) {
if (fallback) return fallback;
if (phaseConfig.skeleton) {
return <SkeletonFactory type={phaseConfig.skeleton} />;
}
return <GenericLoader />;
}

return children;
};

const GenericLoader = () => (

  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);
6. Usage Examples
javascript// pages/dashboard.jsx

import { LoadingWrapper } from '@/components/loading/LoadingWrapper';

export default function Dashboard() {
return (

<div className="space-y-6">
{/_ Phase 1: Critical - Auth & Context _/}
<LoadingWrapper routePath="/dashboard" phase={1}>
<UserAuthCheck />
</LoadingWrapper>

      {/* Phase 2: High Priority - Stats & Quick Actions */}
      <LoadingWrapper routePath="/dashboard" phase={2}>
        <DashboardStats />
        <QuickActions />
        <TodayAppointments />
      </LoadingWrapper>

      {/* Phase 3: Medium Priority - Charts & Summaries */}
      <LoadingWrapper routePath="/dashboard" phase={3}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <PatientSummary />
            <QueueWidget />
          </div>
        </div>
      </LoadingWrapper>

      {/* Phase 4: Low Priority - Alerts & Activity */}
      <LoadingWrapper routePath="/dashboard" phase={4}>
        <InventoryAlerts />
        <RecentActivity />
      </LoadingWrapper>
    </div>

);
} 7. Complete Loading State System
javascript// lib/loading/loading-system.js

export const LOADING_SYSTEM = {
// Spinner variants
spinners: {
dots: 'three-dots-bounce',
circle: 'circle-spin',
bar: 'progress-bar',
pulse: 'pulse-ring',
skeleton: 'skeleton-shimmer'
},

// Transition durations
transitions: {
instant: 0,
fast: 150,
normal: 300,
slow: 500
},

// Retry strategies
retry: {
maxAttempts: 3,
backoff: 'exponential', // exponential, linear, fixed
initialDelay: 1000,
maxDelay: 10000
},

// Cache strategies
cache: {
dashboard: { ttl: 300, staleWhileRevalidate: true },
patients: { ttl: 60, invalidateOn: ['patient.updated'] },
appointments: { ttl: 30, realtime: true }
},

// Optimistic updates
optimistic: {
enabled: ['appointments.create', 'queue.update', 'patient.edit'],
rollbackOn: 'error',
toastOnSuccess: true
},

// Streaming data
streaming: {
queue: { enabled: true, protocol: 'websocket' },
notifications: { enabled: true, protocol: 'sse' },
vitals: { enabled: true, protocol: 'websocket' }
}
};
